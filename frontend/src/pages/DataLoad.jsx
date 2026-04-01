import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import api from '../services/api';
import { Toaster, toast } from 'react-hot-toast';
import Layout from '../components/Layout';
import PerformanceBadge from '../components/PerformanceBadge';
import { 
  Database, UploadCloud, FileText, CheckCircle2, 
  AlertTriangle, Loader2, ArrowRight, Download, Server, Trash2,
  Edit, X, Save // DRCODE: Ícones adicionados para a tela de correção
} from 'lucide-react';

export default function DataLoad() {
  const navigate = useNavigate();
  const [tenantId, setTenantId] = useState('');
  const [batches, setBatches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [file, setFile] = useState(null);
  const [entityType, setEntityType] = useState('customer');
  const [isUploading, setIsUploading] = useState(false);

  const [perfMetrics, setPerfMetrics] = useState({ network: 0, server: 0, browser: 0, api: 0, total: 0 });

  // DRCODE: Estados para controlar a Janela de Edição (Modal)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedBatchId, setSelectedBatchId] = useState(null);
  const [rows, setRows] = useState([]);
  const [editingRowId, setEditingRowId] = useState(null);
  const [editFormData, setEditFormData] = useState({});

  useEffect(() => {
    const token = localStorage.getItem('medsched_token');
    if (token) {
      const decoded = jwtDecode(token);
      const tId = decoded.tenant_id || localStorage.getItem('selected_tenant_id');
      setTenantId(tId);
      if (tId) fetchBatches(tId);
    }
  }, []);

  const fetchBatches = async (tId) => {
    setIsLoading(true);
    const startTime = performance.now();
    try {
      const res = await api.get('/import/batches', { params: { tenant_id: tId } });
      const endTime = performance.now();
      
      setBatches(res.data);
      
      requestAnimationFrame(() => {
        const renderTime = performance.now();
        const apiTotal = Math.round(endTime - startTime);
        const serverEstimate = Math.round(apiTotal * 0.35);
        
        setPerfMetrics({
          server: serverEstimate,
          network: apiTotal - serverEstimate,
          browser: Math.round(renderTime - endTime),
          api: apiTotal,
          total: apiTotal + Math.round(renderTime - endTime)
        });
      });
    } catch (err) {
      toast.error("Erro ao carregar o histórico de importações.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
        toast.error("Por favor, selecione um arquivo CSV válido.");
        setFile(null);
        return;
      }
      setFile(selectedFile);
    }
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
    } else if (entityType === "supplier") {
      csvContent = "Nome_Razao,Nome_Fantasia,CNPJ,Email,Telefone,Contato_Nome,CEP,Logradouro,Numero,Bairro,Cidade,Estado,Observacoes\nFornecedor XYZ Ltda,XYZ Suprimentos,12.345.678/0001-99,vendas@xyz.com.br,11999999999,Carlos Silva,01000-000,Rua das Industrias,100,Distrito Industrial,São Paulo,SP,Entregas apenas de terça e quinta";
      fileName = "modelo_importacao_fornecedores.csv";
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    link.click();
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error("Selecione um arquivo CSV primeiro.");
      return;
    }
    
    setIsUploading(true);
    const loadingToast = toast.loading("Enviando arquivo para a Staging Area...");
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('entity_type', entityType);
    
    try {
      await api.post('/import/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        params: { tenant_id: tenantId }
      });
      
      toast.success("Upload concluído! Arquivo na fila de validação.", { id: loadingToast });
      setFile(null);
      document.getElementById('file-upload').value = "";
      fetchBatches(tenantId);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Falha no upload do arquivo.", { id: loadingToast });
    } finally {
      setIsUploading(false);
    }
  };

  const handleValidate = async (batchId) => {
    const loadingToast = toast.loading("Validando regras de negócio e duplicidades...");
    try {
      await api.post(`/import/validate/${batchId}`, null, { params: { tenant_id: tenantId } });
      toast.success("Validação concluída!", { id: loadingToast });
      fetchBatches(tenantId);
    } catch (err) {
      toast.error("Erro durante a validação.", { id: loadingToast });
    }
  };

  const handlePromote = async (batchId) => {
    const loadingToast = toast.loading("Promovendo registros válidos para o banco oficial...");
    try {
      const res = await api.post(`/import/promote/${batchId}`, null, { params: { tenant_id: tenantId } });
      toast.success(`${res.data.registros_importados || res.data.inseridos || 0} registros promovidos com sucesso!`, { id: loadingToast });
      fetchBatches(tenantId);
    } catch (err) {
      toast.error("Erro durante a promoção dos dados.", { id: loadingToast });
    }
  };

  const handleDeleteBatch = async (batchId) => {
    if(!window.confirm("Deseja realmente excluir este lote da Staging Area? Os dados não promovidos serão perdidos.")) return;
    
    try {
      await api.delete(`/import/batch/${batchId}`, { params: { tenant_id: tenantId } });
      toast.success("Lote removido com sucesso.");
      fetchBatches(tenantId);
    } catch (err) {
      toast.error("Erro ao remover o lote.");
    }
  };

  // DRCODE: Funções criadas para a Janela de Edição de Erros
  const openEditModal = async (batchId) => {
    setSelectedBatchId(batchId);
    setIsEditModalOpen(true);
    await loadRows(batchId);
  };

  const loadRows = async (batchId) => {
    try {
      const res = await api.get(`/import/${batchId}/rows`, { params: { tenant_id: tenantId } });
      setRows(res.data);
    } catch (err) {
      toast.error("Erro ao carregar as linhas da planilha.");
    }
  };

  const startEditing = (row) => {
    setEditingRowId(row.id);
    setEditFormData(row.raw_data);
  };

  const handleEditChange = (key, value) => {
    setEditFormData(prev => ({ ...prev, [key]: value }));
  };

  const saveRowEdit = async (rowId) => {
    try {
      await api.put(`/import/rows/${rowId}`, editFormData, { params: { tenant_id: tenantId } });
      toast.success("Linha corrigida com sucesso!");
      setEditingRowId(null);
      await loadRows(selectedBatchId);
      fetchBatches(tenantId); // Atualiza os contadores em background
    } catch (err) {
      toast.error("Erro ao salvar a correção.");
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending': return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-bold rounded uppercase">Aguardando Validação</span>;
      case 'processing': return <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded uppercase flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin"/> Processando</span>;
      case 'validated': return <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-bold rounded uppercase">Validado (Pronto)</span>;
      case 'completed': return <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded uppercase">Promovido / Concluído</span>;
      case 'failed': return <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded uppercase">Falhou</span>;
      default: return <span className="px-2 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded uppercase">{status}</span>;
    }
  };

  const translateEntity = (entity) => {
    switch (entity) {
        case 'customer': return 'Clientes';
        case 'holiday': return 'Feriados';
        case 'supplier': return 'Fornecedores';
        default: return entity;
    }
  }

  return (
    <Layout>
      <div className="p-8 max-w-7xl mx-auto flex flex-col gap-6 animate-in fade-in">
        <Toaster position="top-right" />
        
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <Database className="w-8 h-8 text-blue-600" /> 
            DataLoad Management
          </h1>
          <p className="text-slate-500 mt-1 text-lg">Área de *Staging* para importação massiva de dados via planilhas CSV.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-4">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
              <UploadCloud className="w-5 h-5 text-blue-500" /> Novo Upload
            </h2>
            
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Entidade de Destino</label>
              <select 
                className="w-full px-4 py-3 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 mb-3"
                value={entityType}
                onChange={(e) => setEntityType(e.target.value)}
              >
                <option value="customer">Clientes / Pacientes</option>
                <option value="holiday">Feriados / Calendário</option>
                <option value="supplier">Fornecedores / Parceiros</option>
              </select>
              
              <button 
                onClick={downloadTemplate}
                className="text-sm font-bold text-blue-600 flex items-center gap-1 hover:text-blue-800 transition-colors w-full justify-center py-2 border border-blue-100 bg-blue-50 rounded-lg"
              >
                <Download className="w-4 h-4" /> Baixar Planilha Modelo (CSV)
              </button>
            </div>

            <div className="mt-2">
              <label className="block text-sm font-bold text-slate-700 mb-2">Selecione o Arquivo CSV</label>
              <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:bg-slate-50 transition-colors bg-white relative">
                <input 
                  type="file" 
                  id="file-upload"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <FileText className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-600">
                  {file ? file.name : "Clique ou arraste o arquivo CSV aqui"}
                </p>
                {file && <p className="text-xs text-green-600 font-bold mt-2">Pronto para envio</p>}
              </div>
            </div>

            <button 
              onClick={handleUpload}
              disabled={!file || isUploading}
              className="mt-2 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Server className="w-5 h-5" />}
              Enviar para Staging Area
            </button>
          </div>

          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
             <div className="p-6 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <Database className="w-5 h-5 text-slate-500" /> Fila de Processamento (Staging)
                </h2>
                <button onClick={() => fetchBatches(tenantId)} className="text-sm text-blue-600 font-bold hover:underline">Atualizar Lista</button>
             </div>
             
             <div className="overflow-x-auto flex-1">
                <table className="w-full text-left text-sm">
                  <thead className="bg-white border-b border-slate-200 text-slate-500 uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="px-6 py-4 font-bold">Arquivo / Entidade</th>
                      <th className="px-6 py-4 font-bold text-center">Status</th>
                      <th className="px-6 py-4 font-bold text-center">Registros (OK / Erro)</th>
                      <th className="px-6 py-4 font-bold text-center">Ações de Esteira</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {isLoading ? (
                       <tr><td colSpan={4} className="text-center py-12"><Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto" /></td></tr>
                    ) : batches.length === 0 ? (
                       <tr><td colSpan={4} className="text-center py-12 text-slate-500 font-medium">Nenhum lote de importação na Staging Area.</td></tr>
                    ) : (
                      batches.map(batch => (
                        <tr key={batch.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4">
                            <p className="font-bold text-slate-800 truncate max-w-[200px]" title={batch.file_name || batch.filename}>{batch.file_name || batch.filename}</p>
                            <p className="text-xs text-slate-500 font-medium mt-0.5">Destino: <span className="text-blue-600">{translateEntity(batch.entity_type)}</span></p>
                            <p className="text-[10px] text-slate-400 mt-1">{new Date(batch.criado_em).toLocaleString('pt-BR')}</p>
                          </td>
                          <td className="px-6 py-4 text-center">
                            {getStatusBadge(batch.status)}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col gap-1 items-center">
                                <span className="text-xs font-bold text-slate-600">Total Lidos: {batch.total_rows}</span>
                                {batch.status !== 'pending' && batch.status !== 'processing' && (
                                  <div className="flex gap-2 text-xs font-bold mt-1">
                                    <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded border border-green-200 flex items-center gap-1" title="Válidos"><CheckCircle2 className="w-3 h-3"/> {batch.valid_rows}</span>
                                    <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded border border-red-200 flex items-center gap-1" title="Com Erro"><AlertTriangle className="w-3 h-3"/> {batch.error_rows}</span>
                                  </div>
                                )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex justify-center items-center gap-2">
                                {/* DRCODE: Regras lógicas dos botões atualizadas para mostrar o Lápis de Edição */}
                                {(batch.status === 'pending' || batch.status === 'failed') && (
                                  <button onClick={() => handleValidate(batch.id)} className="bg-purple-100 hover:bg-purple-200 text-purple-700 border border-purple-200 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors">
                                    <Loader2 className="w-3 h-3"/> Validar Regras
                                  </button>
                                )}
                                {batch.error_rows > 0 && (
                                  <button onClick={() => openEditModal(batch.id)} className="bg-yellow-100 hover:bg-yellow-200 text-yellow-800 border border-yellow-300 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors shadow-sm">
                                    <Edit className="w-3 h-3"/> Corrigir Erros
                                  </button>
                                )}
                                {batch.status === 'validated' && batch.error_rows === 0 && (
                                  <button onClick={() => handlePromote(batch.id)} disabled={batch.valid_rows === 0} className="bg-green-600 hover:bg-green-700 text-white shadow-sm px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 disabled:opacity-50 transition-colors">
                                    <ArrowRight className="w-3 h-3"/> Promover ({batch.valid_rows})
                                  </button>
                                )}
                                <button onClick={() => handleDeleteBatch(batch.id)} className="text-red-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition-colors" title="Descartar Lote">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
             </div>
          </div>
        </div>

        <div className="flex justify-start items-center text-xs text-slate-500 pt-2 pb-8">
          <PerformanceBadge metrics={perfMetrics} />
        </div>

      </div>

      {/* DRCODE: A Tela (Modal) de Edição e Correção de Linhas que faltava */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-5xl max-h-[90vh] flex flex-col gap-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <div>
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <Edit className="w-5 h-5 text-yellow-600"/> Corrigir Divergências
                </h2>
                <p className="text-sm text-slate-500 mt-1">Após salvar suas correções, feche esta tela e clique em "Validar Regras" novamente.</p>
              </div>
              <button onClick={() => setIsEditModalOpen(false)} className="bg-slate-100 hover:bg-slate-200 text-slate-600 p-2 rounded-full transition-colors">
                <X className="w-5 h-5"/>
              </button>
            </div>
            
            <div className="overflow-y-auto flex-1 border border-slate-200 rounded-xl bg-slate-50">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-100 border-b border-slate-200 text-slate-600 font-bold text-xs uppercase sticky top-0 z-10 shadow-sm">
                  <tr>
                    <th className="px-4 py-3 text-center">Linha</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 w-1/2">Dados Originais / Correção</th>
                    <th className="px-4 py-3 text-center">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {rows.length === 0 ? (
                    <tr><td colSpan={4} className="text-center py-8 text-slate-500"><Loader2 className="w-6 h-6 animate-spin mx-auto"/></td></tr>
                  ) : rows.map(row => (
                    <tr key={row.id} className={row.status === 'invalid' || row.status === 'duplicated' ? 'bg-red-50/50' : 'bg-white'}>
                      <td className="px-4 py-4 font-bold text-slate-500 text-center">{row.row_number}</td>
                      <td className="px-4 py-4">
                         <span className={`px-2 py-1 text-[10px] font-bold rounded uppercase flex w-max items-center gap-1 ${row.status === 'valid' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                           {row.status === 'valid' ? <CheckCircle2 className="w-3 h-3"/> : <AlertTriangle className="w-3 h-3"/>}
                           {row.status}
                         </span>
                      </td>
                      <td className="px-4 py-4">
                        {editingRowId === row.id ? (
                          <div className="flex flex-col gap-3 bg-white p-4 rounded-lg border border-blue-200 shadow-sm">
                            {Object.entries(editFormData).map(([k, v]) => (
                              <div key={k} className="flex flex-col">
                                <label className="text-[10px] font-bold text-slate-500 uppercase mb-1">{k.replace(/_/g, ' ')}</label>
                                <input 
                                  type="text" 
                                  className="border border-slate-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                                  value={v || ''} 
                                  onChange={(e) => handleEditChange(k, e.target.value)} 
                                />
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="flex flex-col gap-2">
                            <div className="text-xs text-slate-700 font-mono bg-white p-3 border border-slate-200 rounded-lg whitespace-pre-wrap">
                              {Object.entries(row.raw_data).map(([k,v]) => <span key={k}><b>{k}:</b> {v}<br/></span>)}
                            </div>
                            {row.error_message && (
                              <div className="text-xs font-bold text-red-600 bg-red-100 p-2 rounded flex items-start gap-1">
                                <AlertTriangle className="w-4 h-4 shrink-0"/> {row.error_message}
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4 align-top text-center">
                        {editingRowId === row.id ? (
                          <button onClick={() => saveRowEdit(row.id)} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1 justify-center w-full transition-colors shadow">
                            <Save className="w-4 h-4"/> Salvar
                          </button>
                        ) : (
                          (row.status === 'invalid' || row.status === 'duplicated') && (
                            <button onClick={() => startEditing(row)} className="bg-white border-2 border-slate-300 text-slate-700 hover:border-slate-400 hover:bg-slate-50 px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1 justify-center w-full transition-colors">
                              <Edit className="w-4 h-4"/> Editar Linha
                            </button>
                          )
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
