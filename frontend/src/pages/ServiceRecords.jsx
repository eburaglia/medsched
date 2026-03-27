import React, { useEffect, useState, useMemo, useRef } from 'react';
import api from '../services/api';
import { jwtDecode } from 'jwt-decode';
import { Toaster, toast } from 'react-hot-toast';
import Modal from '../components/Modal';
import Layout from '../components/Layout';
import { 
  FileText, Search, UserRound, Calendar, Lock, Unlock, 
  Plus, Loader2, Save, Edit3, CheckCircle, AlertTriangle, Clock, Info, Paperclip, XCircle, DownloadCloud
} from 'lucide-react';

export default function ServiceRecords() {
  const [customers, setCustomers] = useState([]);
  const [professionals, setProfessionals] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [records, setRecords] = useState([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isRecordsLoading, setIsRecordsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [customerSearch, setCustomerSearch] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); 
  const [currentRecordId, setCurrentRecordId] = useState(null);
  
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    tipo: 'nota_sessao', // 👇 DRCODE: Corrigido para minúsculo igual ao Backend
    conteudo: '',
    appointment_id: '',
    assinado: false,
    anexos: [] 
  });

  const getActiveTenantId = () => {
    const token = localStorage.getItem('medsched_token');
    if (!token) return null;
    const decoded = jwtDecode(token);
    return decoded.tenant_id || localStorage.getItem('selected_tenant_id');
  };

  const getCurrentUserId = () => {
    const token = localStorage.getItem('medsched_token');
    if (!token) return null;
    return jwtDecode(token).sub;
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      const tenantId = getActiveTenantId();
      if (!tenantId) {
          setIsLoading(false);
          return;
      }
      try {
        const [custRes, profRes, appRes] = await Promise.all([
          api.get('/customers/', { params: { tenant_id: tenantId } }),
          api.get('/users/', { params: { tenant_id: tenantId } }),
          api.get('/appointments/', { params: { tenant_id: tenantId } })
        ]);
        
        setCustomers(custRes.data.filter(c => c.status?.toLowerCase() === 'ativo'));
        setProfessionals(profRes.data);
        setAppointments(appRes.data);
      } catch (err) {
        toast.error("Erro ao carregar os dados base.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (!selectedCustomerId) return;

    const fetchHistory = async () => {
      setIsRecordsLoading(true);
      try {
        const res = await api.get(`/service-records/customer/${selectedCustomerId}`);
        const sortedRecords = res.data.sort((a, b) => new Date(b.criado_em) - new Date(a.criado_em));
        setRecords(sortedRecords);
      } catch (err) {
        toast.error("Erro ao buscar o histórico do cliente.");
      } finally {
        setIsRecordsLoading(false);
      }
    };

    fetchHistory();
  }, [selectedCustomerId]);

  const filteredCustomers = useMemo(() => {
    if (!customerSearch) return customers;
    return customers.filter(c => c.nome.toLowerCase().includes(customerSearch.toLowerCase()));
  }, [customers, customerSearch]);

  const handleOpenCreate = () => {
    setModalMode('create');
    setCurrentRecordId(null);
    setFormData({
      tipo: 'nota_sessao',
      conteudo: '',
      appointment_id: '',
      assinado: false,
      anexos: []
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (record) => {
    setModalMode(record.assinado ? 'view' : 'edit');
    setCurrentRecordId(record.id);
    setFormData({
      tipo: record.tipo || 'nota_sessao',
      conteudo: record.conteudo,
      appointment_id: record.appointment_id || '',
      assinado: record.assinado,
      anexos: record.anexos || [] 
    });
    setIsModalOpen(true);
  };

  const handleFileChange = (e) => {
      const files = Array.from(e.target.files);
      const newAnexos = [];

      files.forEach(file => {
          if (file.size > 5 * 1024 * 1024) { 
              toast.error(`O arquivo ${file.name} é maior que 5MB.`);
              return;
          }
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => {
              newAnexos.push({
                  id_temp: Date.now() + Math.random(),
                  nome_arquivo: file.name,
                  tipo_arquivo: file.type,
                  dados_base64: reader.result
              });
              if (newAnexos.length === files.length) {
                  setFormData(prev => ({ ...prev, anexos: [...prev.anexos, ...newAnexos] }));
              }
          };
      });
  };

  const removeAnexo = (id_temp) => {
      setFormData(prev => ({
          ...prev,
          anexos: prev.anexos.filter(a => a.id_temp !== id_temp)
      }));
  };

  const downloadBase64File = (anexo) => {
      const link = document.createElement("a");
      link.href = anexo.dados_base64;
      link.download = anexo.nome_arquivo;
      link.click();
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (formData.conteudo.length < 5) return toast.error("O conteúdo deve ter no mínimo 5 caracteres.");

    setIsSaving(true);
    const tenantId = getActiveTenantId();
    const userId = getCurrentUserId();

    try {
      if (modalMode === 'create') {
        const payload = {
          tenant_id: tenantId,
          customer_id: selectedCustomerId,
          profissional_id: userId,
          tipo: formData.tipo,
          conteudo: formData.conteudo,
          appointment_id: formData.appointment_id || null,
          anexos: formData.anexos
        };
        await api.post('/service-records/', payload);
        toast.success("Registro e anexos salvos com sucesso!");
      } else {
        const payload = {
          conteudo: formData.conteudo,
          anexos: formData.anexos
        };
        await api.put(`/service-records/${currentRecordId}`, payload);
        toast.success("Registro atualizado!");
      }

      setIsModalOpen(false);
      const res = await api.get(`/service-records/customer/${selectedCustomerId}`);
      setRecords(res.data.sort((a, b) => new Date(b.criado_em) - new Date(a.criado_em)));
    } catch (err) {
      // 👇 DRCODE: Blindagem idêntica à da tela de Usuários para impedir a tela branca!
      let msg = "Erro ao salvar o registro.";
      if (err.response?.data?.detail) {
          msg = typeof err.response.data.detail === 'string' 
              ? err.response.data.detail 
              : "Atenção: Campos inválidos ou formato incorreto.";
      }
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSignRecord = async () => {
    if (!window.confirm("Assinar eletronicamente este documento irá travá-lo permanentemente contra edições. Deseja continuar?")) return;
    setIsSaving(true);
    try {
      const payload = { conteudo: formData.conteudo, anexos: formData.anexos, assinado: true };
      await api.put(`/service-records/${currentRecordId}`, payload);
      toast.success("Registro assinado e travado com sucesso!");
      setIsModalOpen(false);
      const res = await api.get(`/service-records/customer/${selectedCustomerId}`);
      setRecords(res.data.sort((a, b) => new Date(b.criado_em) - new Date(a.criado_em)));
    } catch (err) {
      let msg = "Erro ao assinar o documento.";
      if (err.response?.data?.detail) {
          msg = typeof err.response.data.detail === 'string' ? err.response.data.detail : "Erro de validação.";
      }
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const getProfessionalName = (id) => professionals.find(p => p.id === id)?.nome || 'Profissional';
  const getAppointmentDate = (id) => {
      const app = appointments.find(a => a.id === id);
      if (!app) return 'Sessão Avulsa';
      return new Date(app.data_hora_inicio).toLocaleString('pt-BR');
  };

  return (
    <Layout>
      <div className="flex h-screen bg-slate-50 overflow-hidden">
        <Toaster position="top-right" />

        {/* PAINEL ESQUERDO: LISTA DE CLIENTES */}
        <div className="w-80 bg-white border-r border-slate-200 flex flex-col flex-shrink-0 z-10 shadow-sm">
          <div className="p-4 border-b border-slate-200 bg-slate-50/50">
            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <UserRound className="w-5 h-5 text-blue-600" /> Clientes
            </h2>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Buscar cliente..." 
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                value={customerSearch}
                onChange={e => setCustomerSearch(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
                <div className="p-10 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div>
            ) : filteredCustomers.length === 0 ? (
                <div className="p-6 text-center text-sm text-slate-500">Nenhum cliente encontrado.</div>
            ) : (
                <ul className="divide-y divide-slate-100">
                    {filteredCustomers.map(c => (
                        <li 
                            key={c.id} 
                            onClick={() => setSelectedCustomerId(c.id)}
                            className={`p-4 cursor-pointer transition-colors hover:bg-blue-50 ${selectedCustomerId === c.id ? 'bg-blue-50 border-l-4 border-blue-600' : 'border-l-4 border-transparent'}`}
                        >
                            <p className={`font-bold text-sm ${selectedCustomerId === c.id ? 'text-blue-800' : 'text-slate-700'}`}>{c.nome}</p>
                            <p className="text-xs text-slate-500 truncate mt-0.5">{c.email || c.telefone || 'Sem contato'}</p>
                        </li>
                    ))}
                </ul>
            )}
          </div>
        </div>

        {/* PAINEL DIREITO: HISTÓRICO DO CLIENTE */}
        <div className="flex-1 flex flex-col bg-slate-50 relative">
          {!selectedCustomerId ? (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                  <FileText className="w-16 h-16 mb-4 text-slate-300" />
                  <h3 className="text-xl font-bold text-slate-600">Selecione um Cliente</h3>
                  <p className="text-sm">Escolha um cliente na lista lateral para ver ou adicionar registros de serviço.</p>
              </div>
          ) : (
              <React.Fragment>
                  <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
                      <div>
                          <h1 className="text-2xl font-black text-slate-800">Histórico de Serviço</h1>
                          <p className="text-sm text-slate-500 mt-1 font-medium flex items-center gap-1">
                             <UserRound className="w-4 h-4"/> {customers.find(c => c.id === selectedCustomerId)?.nome}
                          </p>
                      </div>
                      <button onClick={handleOpenCreate} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-blue-200 flex items-center gap-2 transition-all">
                          <Plus className="w-4 h-4" /> Novo Registro
                      </button>
                  </header>

                  <div className="flex-1 p-8 overflow-y-auto relative">
                      {isRecordsLoading ? (
                          <div className="flex justify-center mt-20"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
                      ) : records.length === 0 ? (
                          <div className="bg-white rounded-2xl border border-slate-200 border-dashed p-10 text-center">
                              <AlertTriangle className="w-10 h-10 text-yellow-500 mx-auto mb-3" />
                              <h4 className="text-lg font-bold text-slate-700">Nenhum registro encontrado</h4>
                              <p className="text-sm text-slate-500 mt-1">Este cliente ainda não possui evoluções ou notas de serviço.</p>
                          </div>
                      ) : (
                          <div className="space-y-6 max-w-4xl mx-auto">
                              {records.map(record => (
                                  <div key={record.id} className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all hover:shadow-md ${record.assinado ? 'border-green-200' : 'border-slate-200'}`}>
                                      <div className={`px-6 py-3 flex items-center justify-between border-b ${record.assinado ? 'bg-green-50 border-green-100' : 'bg-slate-50 border-slate-100'}`}>
                                          <div className="flex items-center gap-4">
                                              <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${record.assinado ? 'bg-green-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                                                  {record.tipo.replace('_', ' ')}
                                              </span>
                                              <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                                                  <Calendar className="w-3.5 h-3.5" />
                                                  {new Date(record.criado_em).toLocaleDateString('pt-BR')} às {new Date(record.criado_em).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
                                              </span>
                                          </div>
                                          <div className="flex items-center gap-3">
                                              {record.assinado ? (
                                                  <span className="text-xs font-bold text-green-700 flex items-center gap-1 bg-green-100 px-2 py-1 rounded-lg border border-green-200">
                                                      <Lock className="w-3.5 h-3.5" /> Assinado
                                                  </span>
                                              ) : (
                                                  <span className="text-xs font-bold text-yellow-600 flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-lg border border-yellow-200">
                                                      <Unlock className="w-3.5 h-3.5" /> Em Aberto (Rascunho)
                                                  </span>
                                              )}
                                              <button onClick={() => handleOpenEdit(record)} className="p-1.5 hover:bg-white rounded-lg text-blue-600 shadow-sm border border-transparent hover:border-blue-200 transition-all">
                                                  {record.assinado ? <Search className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
                                              </button>
                                          </div>
                                      </div>
                                      <div className="p-6">
                                          <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{record.conteudo}</p>
                                          
                                          {record.anexos && record.anexos.length > 0 && (
                                              <div className="mt-4 pt-4 border-t border-dashed border-slate-200">
                                                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Anexos Vinculados</p>
                                                  <div className="flex flex-wrap gap-2">
                                                      {record.anexos.map((anexo, idx) => (
                                                          <div key={idx} className="flex items-center gap-2 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg text-sm cursor-pointer hover:bg-slate-200" onClick={() => downloadBase64File(anexo)}>
                                                              <Paperclip className="w-4 h-4 text-blue-600" />
                                                              <span className="text-slate-700 font-medium truncate max-w-[200px]">{anexo.nome_arquivo}</span>
                                                          </div>
                                                      ))}
                                                  </div>
                                              </div>
                                          )}
                                      </div>
                                      <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
                                          <div className="flex items-center gap-1">
                                              <UserRound className="w-3.5 h-3.5" /> Executado por: {getProfessionalName(record.profissional_id)}
                                          </div>
                                          {record.appointment_id && (
                                              <div className="flex items-center gap-1">
                                                  <Clock className="w-3.5 h-3.5" /> Vinculado à Agenda: {getAppointmentDate(record.appointment_id)}
                                              </div>
                                          )}
                                      </div>
                                  </div>
                              ))}
                          </div>
                      )}
                  </div>
              </React.Fragment>
          )}
        </div>

        {/* MODAL DE CRIAÇÃO / EDIÇÃO DE REGISTRO */}
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={modalMode === 'create' ? "Novo Registro de Serviço" : modalMode === 'view' ? "Visualizar Registro" : "Editar Registro"}>
            <form onSubmit={handleSave} className="flex flex-col space-y-4 max-h-[85vh]">
                
                {modalMode === 'view' && (
                    <div className="bg-green-50 border border-green-200 p-3 rounded-lg flex items-center gap-2 text-green-800 text-sm">
                        <Lock className="w-4 h-4" /> Este registro foi assinado eletronicamente e não pode mais ser alterado.
                    </div>
                )}

                <div className="overflow-y-auto pr-2 space-y-4 pb-2" style={{ maxHeight: 'calc(85vh - 80px)' }}>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col justify-end">
                            <label className="block text-sm font-bold text-slate-700 mb-1">Tipo de Registro</label>
                            <select 
                                disabled={modalMode !== 'create'}
                                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 disabled:text-slate-500" 
                                value={formData.tipo} 
                                onChange={e => setFormData({...formData, tipo: e.target.value})}
                            >
                                {/* 👇 DRCODE: Corrigido para minúsculo */}
                                <option value="nota_sessao">Nota de Atendimento / Sessão</option>
                                <option value="avaliacao_inicial">Avaliação / Diagnóstico</option>
                                <option value="documento">Relatório / Laudo (Documento)</option>
                                <option value="interno">Registro Interno</option>
                            </select>
                        </div>
                        <div className="flex flex-col justify-end">
                            <label className="block text-sm font-bold text-slate-700 mb-1 truncate" title="Vincular a um Agendamento (Opcional)">
                                Vincular a um Agendamento (Opcional)
                            </label>
                            <select 
                                disabled={modalMode !== 'create'}
                                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 disabled:text-slate-500 text-sm" 
                                value={formData.appointment_id} 
                                onChange={e => setFormData({...formData, appointment_id: e.target.value})}
                            >
                                <option value="">- Registro Avulso -</option>
                                {appointments
                                    .filter(a => a.customer_id === selectedCustomerId)
                                    .map(a => (
                                        <option key={a.id} value={a.id}>
                                            {new Date(a.data_hora_inicio).toLocaleString('pt-BR')} ({a.status})
                                        </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Detalhes da Execução do Serviço *</label>
                        <textarea 
                            required
                            disabled={modalMode === 'view'}
                            rows={8}
                            className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 resize-none disabled:bg-slate-50 disabled:text-slate-700" 
                            placeholder="Descreva aqui o que foi executado, procedimentos, observações..."
                            value={formData.conteudo} 
                            onChange={e => setFormData({...formData, conteudo: e.target.value})}
                        />
                    </div>

                    {/* MÓDULO DE ANEXOS VISUALMENTE PRONTO E LIBERADO PARA ENVIO */}
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                <Paperclip className="w-4 h-4 text-blue-600" /> Arquivos Anexos
                            </h3>
                            {modalMode !== 'view' && (
                                <div>
                                    <input 
                                        type="file" 
                                        multiple 
                                        className="hidden" 
                                        ref={fileInputRef} 
                                        onChange={handleFileChange}
                                        accept="image/*,application/pdf,.doc,.docx"
                                    />
                                    <button 
                                        type="button" 
                                        onClick={() => fileInputRef.current?.click()}
                                        className="text-xs font-bold bg-white border border-blue-200 text-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-50 shadow-sm transition-colors"
                                    >
                                        Adicionar Arquivos
                                    </button>
                                </div>
                            )}
                        </div>

                        {formData.anexos.length === 0 ? (
                            <div className="text-center py-6 text-slate-400 border-2 border-dashed border-slate-200 rounded-lg bg-white">
                                <p className="text-xs font-medium">Nenhum documento anexado.</p>
                            </div>
                        ) : (
                            <ul className="space-y-2">
                                {formData.anexos.map((anexo, index) => (
                                    <li key={anexo.id_temp || index} className="flex items-center justify-between bg-white border border-slate-200 p-2 rounded-lg shadow-sm">
                                        <div className="flex items-center gap-2 overflow-hidden">
                                            <Paperclip className="w-4 h-4 text-slate-400 flex-shrink-0" />
                                            <span className="text-sm text-slate-700 font-medium truncate">{anexo.nome_arquivo}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {modalMode === 'view' ? (
                                                <button type="button" onClick={() => downloadBase64File(anexo)} className="p-1 text-blue-600 hover:bg-blue-50 rounded" title="Baixar">
                                                    <DownloadCloud className="w-4 h-4" />
                                                </button>
                                            ) : (
                                                <button type="button" onClick={() => removeAnexo(anexo.id_temp)} className="p-1 text-red-500 hover:bg-red-50 rounded" title="Remover Anexo">
                                                    <XCircle className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>

                {modalMode !== 'view' && (
                    <div className="flex gap-3 pt-4 border-t border-slate-200 mt-2 shrink-0">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-2 border border-slate-300 text-slate-600 font-bold rounded-lg hover:bg-slate-50">
                            Cancelar
                        </button>
                        <button type="submit" disabled={isSaving} className="flex-1 px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white font-bold rounded-lg flex justify-center items-center gap-2">
                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            Salvar Rascunho
                        </button>
                        
                        {/* Botão de Assinar só aparece se o registro já existir (modo edit) */}
                        {modalMode === 'edit' && (
                            <button type="button" onClick={handleSignRecord} disabled={isSaving} className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg flex justify-center items-center gap-2 shadow-sm">
                                <Lock className="w-4 h-4" />
                                Assinar e Travar
                            </button>
                        )}
                    </div>
                )}
                {modalMode === 'view' && (
                    <div className="pt-2 shrink-0">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="w-full px-4 py-2 bg-slate-200 text-slate-700 font-bold rounded-lg hover:bg-slate-300">
                            Fechar Visualização
                        </button>
                    </div>
                )}
            </form>
        </Modal>
      </div>
    </Layout>
  );
}
