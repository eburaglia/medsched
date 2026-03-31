import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Toaster, toast } from 'react-hot-toast';
import Layout from '../components/Layout';
import Modal from '../components/Modal';
import { Database, UploadCloud, CheckCircle2, AlertCircle, Play, Loader2, ArrowLeft, Download, Edit2, Trash2, RefreshCw } from 'lucide-react';

export default function DataLoad() {
  const navigate = useNavigate();
  
  const [entityType, setEntityType] = useState('customer');
  const [file, setFile] = useState(null);
  
  const [step, setStep] = useState(1); 
  const [isProcessing, setIsProcessing] = useState(false);
  const [batchId, setBatchId] = useState(null);
  const [importResult, setImportResult] = useState(null);

  // Estados da Staging Area (Auditoria)
  const [batchRows, setBatchRows] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRow, setEditingRow] = useState(null);
  const [editFormData, setEditFormData] = useState({});

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) setFile(e.target.files[0]);
  };

  const downloadTemplate = () => {
    let csvContent = "";
    let fileName = "";

    if (entityType === "customer") {
      csvContent = "Nome,Email,CPF_CNPJ,Telefone,Data_Nascimento,Genero,CEP,Logradouro,Numero,Bairro,Cidade,Estado,Observacoes\nJoão da Silva,joao@email.com,11122233344,11999999999,1990-01-25,Masculino,01000-000,Rua Exemplo,123,Centro,São Paulo,SP,Cliente preferencial";
      fileName = "modelo_importacao_clientes.csv";
    } else if (entityType === "holiday") {
      csvContent = "Nome,Data,Tipo,Expediente\nConfraternização,2024-12-24,AD-HOC,nao\nNatal,2024-12-25,FEDERAL,nao";
      fileName = "modelo_importacao_feriados.csv";
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Planilha modelo baixada!");
  };

  const fetchRows = async (id) => {
    try {
      const res = await api.get(`/import/${id}/rows`);
      setBatchRows(res.data);
    } catch (err) {
      toast.error("Erro ao carregar os dados validados.");
    }
  };

  const handleUploadAndValidate = async () => {
    if (!file) return toast.error("Selecione um arquivo CSV ou Excel.");
    setIsProcessing(true);
    const toastId = toast.loading("Enviando e analisando arquivo...");
    
    try {
      const formData = new FormData();
      formData.append('entity_type', entityType);
      formData.append('file', file);
      
      const uploadRes = await api.post('/import/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' }});
      const newBatchId = uploadRes.data.id;
      setBatchId(newBatchId);

      await api.post(`/import/${newBatchId}/validate`);
      await fetchRows(newBatchId);
      
      toast.success("Validação concluída!", { id: toastId });
      setStep(2); 
    } catch (err) {
      toast.error(err.response?.data?.detail || "Erro ao processar.", { id: toastId });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRevalidate = async () => {
    setIsProcessing(true);
    const toastId = toast.loading("Revalidando o lote...");
    try {
      await api.post(`/import/${batchId}/validate`);
      await fetchRows(batchId);
      toast.success("Lote revalidado!", { id: toastId });
    } catch (err) {
      toast.error("Erro na revalidação.", { id: toastId });
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePromote = async () => {
    if (!batchId) return;
    setIsProcessing(true);
    const toastId = toast.loading("Promovendo dados válidos para a base...");
    
    try {
      const res = await api.post(`/import/${batchId}/promote`);
      setImportResult(res.data);
      toast.success("Importação finalizada com sucesso!", { id: toastId });
      setStep(3); 
    } catch (err) {
      toast.error(err.response?.data?.detail || "Erro ao promover.", { id: toastId });
    } finally {
      setIsProcessing(false);
    }
  };

  const openEditModal = (row) => {
    setEditingRow(row);
    setEditFormData(row.raw_data);
    setIsModalOpen(true);
  };

  const saveRowEdit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/import/rows/${editingRow.id}`, editFormData);
      toast.success("Linha atualizada. Revalide o lote para testar os dados.");
      setIsModalOpen(false);
      fetchRows(batchId);
    } catch (err) {
      toast.error("Erro ao salvar linha.");
    }
  };

  const discardRow = async (rowId) => {
    if (!window.confirm("Deseja realmente descartar esta linha do lote?")) return;
    try {
      await api.delete(`/import/rows/${rowId}`);
      toast.success("Linha descartada.");
      fetchRows(batchId);
    } catch (err) {
      toast.error("Erro ao descartar linha.");
    }
  };

  const resetProcess = () => {
    setFile(null); setBatchId(null); setImportResult(null); setBatchRows([]); setStep(1);
    if (document.getElementById('file-upload')) document.getElementById('file-upload').value = "";
  };

  // Contadores de Status
  const validCount = batchRows.filter(r => r.status === 'valid').length;
  const invalidCount = batchRows.filter(r => r.status === 'invalid').length;
  const duplicatedCount = batchRows.filter(r => r.status === 'duplicated').length;

  return (
    <Layout>
      <div className="p-8 max-w-6xl mx-auto flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4">
        <Toaster position="top-right" />
        
        {/* MODAL DE EDIÇÃO */}
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Corrigir Registro">
          <form onSubmit={saveRowEdit} className="flex flex-col gap-4">
            <div className="max-h-[50vh] overflow-y-auto pr-2 space-y-3">
              {Object.keys(editFormData).map(key => (
                <div key={key}>
                  <label className="block text-xs font-bold text-slate-600 mb-1 capitalize">{key.replace('_', ' ')}</label>
                  <input 
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                    value={editFormData[key] || ''} 
                    onChange={e => setEditFormData({...editFormData, [key]: e.target.value})} 
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-2 pt-4 border-t border-slate-200">
              <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2 bg-slate-100 text-slate-700 rounded-lg font-bold">Cancelar</button>
              <button type="submit" className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold">Salvar Correção</button>
            </div>
          </form>
        </Modal>

        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/configuracoes')} className="p-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 text-slate-600 transition-colors shadow-sm"><ArrowLeft className="w-5 h-5" /></button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3"><Database className="w-8 h-8 text-blue-600" /> DataLoad Management</h1>
            <p className="text-slate-500 mt-1">Importação em lote, validação de integridade e promoção de dados.</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          
          {step === 1 && (
            <div className="p-8 flex flex-col gap-6">
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-blue-800">Selecione a entidade de destino e faça o upload da sua planilha. O sistema irá validar duplicatas e erros de formatação antes de salvar qualquer registro na base oficial.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Entidade de Destino</label>
                  <select className="w-full px-4 py-3 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 mb-3" value={entityType} onChange={(e) => setEntityType(e.target.value)}>
                    <option value="customer">Clientes / Pacientes</option>
                    <option value="holiday">Feriados / Calendário</option>
                  </select>
                  <button onClick={downloadTemplate} className="flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-lg transition-colors w-fit"><Download className="w-4 h-4" /> Baixar Planilha Modelo (CSV)</button>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Arquivo (.csv ou .xlsx)</label>
                  <div className="relative">
                    <input id="file-upload" type="file" accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" onChange={handleFileChange} className="hidden" />
                    <label htmlFor="file-upload" className="flex items-center justify-center gap-2 w-full px-4 py-3 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:bg-slate-50 hover:border-blue-500 transition-all text-slate-600 font-medium h-[104px]"><UploadCloud className="w-5 h-5" />{file ? <span className="truncate max-w-[200px]">{file.name}</span> : "Clique para selecionar o arquivo"}</label>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100 flex justify-end">
                <button onClick={handleUploadAndValidate} disabled={!file || isProcessing} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold shadow-md flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                  {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />} Iniciar Validação de Dados
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col">
              {/* Dashboard Resumo */}
              <div className="bg-slate-50 p-6 border-b border-slate-200 flex flex-wrap gap-4 items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">Inspetor de Qualidade (Staging Area)</h2>
                  <p className="text-slate-500 text-sm mt-1">Analise os resultados abaixo. Você pode corrigir os erros diretamente aqui ou promover apenas os dados válidos.</p>
                </div>
                <div className="flex gap-3">
                  <div className="bg-white border border-slate-200 rounded-lg px-4 py-2 text-center shadow-sm">
                    <span className="block text-2xl font-bold text-green-600">{validCount}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Prontos</span>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-lg px-4 py-2 text-center shadow-sm">
                    <span className="block text-2xl font-bold text-red-500">{invalidCount}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Erros</span>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-lg px-4 py-2 text-center shadow-sm">
                    <span className="block text-2xl font-bold text-amber-500">{duplicatedCount}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Duplicados</span>
                  </div>
                </div>
              </div>

              {/* Tabela de Correções */}
              <div className="overflow-x-auto max-h-[400px]">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-white sticky top-0 border-b border-slate-200 z-10 shadow-sm">
                    <tr>
                      <th className="px-4 py-3 font-bold text-slate-500">Linha</th>
                      <th className="px-4 py-3 font-bold text-slate-500">Status</th>
                      <th className="px-4 py-3 font-bold text-slate-500 w-full">Dados do Registro</th>
                      <th className="px-4 py-3 font-bold text-slate-500 text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {batchRows.map(row => (
                      <tr key={row.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-bold text-slate-400">#{row.row_number}</td>
                        <td className="px-4 py-3">
                          {row.status === 'valid' && <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold border border-green-200 uppercase">Válido</span>}
                          {row.status === 'invalid' && <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold border border-red-200 uppercase">Inválido</span>}
                          {row.status === 'duplicated' && <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded text-xs font-bold border border-amber-200 uppercase">Duplicado</span>}
                          {row.status === 'pending' && <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-bold border border-blue-200 uppercase">Pendente</span>}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col">
                            <span className="text-slate-800 font-medium truncate max-w-lg">
                              {Object.entries(row.raw_data).filter(([_, v]) => v).map(([k, v]) => `${k}: ${v}`).join(' | ')}
                            </span>
                            {row.error_message && <span className="text-[10px] font-bold text-red-500 mt-1 max-w-lg truncate" title={row.error_message}>{row.error_message}</span>}
                          </div>
                        </td>
                        <td className="px-4 py-3 flex justify-center gap-2">
                          {(row.status === 'invalid' || row.status === 'duplicated') && (
                            <>
                              <button onClick={() => openEditModal(row)} className="p-1.5 bg-white border border-slate-300 rounded hover:bg-blue-50 hover:text-blue-600 text-slate-500 transition-colors shadow-sm" title="Corrigir Registro"><Edit2 className="w-4 h-4" /></button>
                              <button onClick={() => discardRow(row.id)} className="p-1.5 bg-white border border-slate-300 rounded hover:bg-red-50 hover:text-red-600 text-slate-500 transition-colors shadow-sm" title="Descartar Registro"><Trash2 className="w-4 h-4" /></button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Botões Finais */}
              <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
                <button onClick={resetProcess} className="px-6 py-2 border border-slate-300 text-slate-600 font-bold rounded-xl hover:bg-white transition-colors">Cancelar Lote</button>
                <div className="flex gap-3">
                  <button onClick={handleRevalidate} disabled={isProcessing} className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-6 py-2 rounded-xl font-bold flex items-center gap-2 transition-all disabled:opacity-50">
                    <RefreshCw className="w-4 h-4" /> Re-validar Lote
                  </button>
                  <button onClick={handlePromote} disabled={isProcessing || validCount === 0} className="bg-green-600 hover:bg-green-700 text-white px-8 py-2 rounded-xl font-bold shadow-md flex items-center gap-2 transition-all disabled:opacity-50">
                    {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                    Promover ({validCount}) Válidos
                  </button>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="p-8 flex flex-col items-center text-center gap-6 animate-in zoom-in-95">
              <div className="w-20 h-20 bg-green-50 text-green-600 rounded-full flex items-center justify-center border-4 border-green-100">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-800">Importação Concluída</h2>
                <p className="text-slate-500 mt-2">{importResult?.mensagem || "Os dados foram promovidos com sucesso para a base oficial."}</p>
              </div>
              <button onClick={resetProcess} className="mt-4 px-8 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-md">Nova Importação</button>
            </div>
          )}

        </div>
      </div>
    </Layout>
  );
}
