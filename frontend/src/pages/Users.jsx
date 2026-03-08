import React, { useEffect, useState, useMemo } from 'react';
import api from '../services/api';
import { jwtDecode } from 'jwt-decode';
import { Toaster, toast } from 'react-hot-toast';
import Modal from '../components/Modal';
import Layout from '../components/Layout';
import { 
  UserPlus, Mail, Shield, UserCheck, Loader2, AlertCircle, 
  Search, Download, Edit2, Trash2, Settings2, UploadCloud, Clock, Save, UserX, Filter, Plus, X, Layers, Activity, ChevronLeft, ChevronRight, Info, CalendarDays, Lock, MapPin
} from 'lucide-react';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [customers, setCustomers] = useState([]); 
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [showPerfDetails, setShowPerfDetails] = useState(false);
  const [perfMetrics, setPerfMetrics] = useState({ network: 0, server: 0, browser: 0, api: 0, total: 0 });

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [showColumnMenu, setShowColumnMenu] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);
  
  const [showFilters, setShowFilters] = useState(false);
  const [queryBuilder, setQueryBuilder] = useState({ rootLogic: 'AND', groups: [] });
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); 
  const [isSaving, setIsSaving] = useState(false);
  
  const [batchToggles, setBatchToggles] = useState({ papel: false, status: false, endereco_cidade: false, endereco_estado: false });

  const [formData, setFormData] = useState({ 
    nome: '', email: '', papel: 'PROFISSIONAL', senha: '', status: 'ATIVO', tenant_id: '',
    cpf: '', telefone: '', telefone_contato: '', 
    endereco_cep: '', endereco_logradouro: '', endereco_numero: '', endereco_bairro: '', endereco_cidade: '', endereco_estado: '', endereco_regiao: '',
    observacoes: ''
  });

  const [editingAuditData, setEditingAuditData] = useState(null);

  const [visibleColumns, setVisibleColumns] = useState({ 
    id: false,
    nome: true, email: true, role: true, telefone: true, status: true, 
    cpf: false, telefone_contato: false, endereco_cidade: false, endereco_estado: false, 
    criado_em: false, criado_por: false, 
    alterado_em: false, alterado_por: false,
    deletado_em: false, deletado_por: false
  });
  
  const [currentUserId, setCurrentUserId] = useState(null);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);

  const [isCheckingCEP, setIsCheckingCEP] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedHistoryUser, setSelectedHistoryUser] = useState(null);
  const [userAppointments, setUserAppointments] = useState([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [historyFilters, setHistoryFilters] = useState({ dataInicio: '', dataFim: '' });

  const fetchUsers = async () => {
    const startTime = performance.now();
    try {
      const token = localStorage.getItem('medsched_token');
      if (!token) return;
      const decoded = jwtDecode(token);
      setCurrentUserId(decoded.sub);
      
      const [resUsers, resCust] = await Promise.all([
          api.get('/users/', { params: { tenant_id: decoded.tenant_id } }),
          api.get('/customers/', { params: { tenant_id: decoded.tenant_id } })
      ]);
      const endTime = performance.now(); 
      
      setUsers(resUsers.data);
      setCustomers(resCust.data);

      if (modalMode === 'create') setFormData(prev => ({ ...prev, tenant_id: decoded.tenant_id }));
      
      requestAnimationFrame(() => {
        const renderTime = performance.now();
        const apiTotal = Math.round(endTime - startTime);
        const serverEstimate = Math.round(apiTotal * 0.35);
        const networkEstimate = apiTotal - serverEstimate;
        const browserEstimate = Math.round(renderTime - endTime);
        
        setPerfMetrics({ server: serverEstimate, network: networkEstimate, browser: browserEstimate, api: apiTotal, total: apiTotal + browserEstimate });
      });

    } catch (err) {
      setError("Falha ao carregar usuários.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  useEffect(() => {
    setCurrentPage(1);
    setSelectedUsers([]); 
  }, [searchTerm, queryBuilder, itemsPerPage]);

  const handleCEPLookup = async (cep) => {
    const cleanCEP = cep.replace(/\D/g, '');
    setFormData(prev => ({ ...prev, endereco_cep: cleanCEP }));
    if (cleanCEP.length === 8) {
      setIsCheckingCEP(true);
      try {
        const response = await api.get(`/utils/cep/${cleanCEP}`);
        const data = response.data;
        setFormData(prev => ({
          ...prev,
          endereco_logradouro: data.logradouro || '',
          endereco_bairro: data.bairro || '',
          endereco_cidade: data.localidade || '',
          endereco_estado: data.uf || ''
        }));
        toast.success("Endereço localizado com sucesso!");
      } catch (err) {
        toast.error("CEP não encontrado.");
      } finally {
        setIsCheckingCEP(false);
      }
    }
  };

  const openHistoryModal = async (user) => {
      setSelectedHistoryUser(user);
      setHistoryFilters({ dataInicio: '', dataFim: '' });
      setIsHistoryModalOpen(true);
      setIsHistoryLoading(true);
      try {
          const tenantId = jwtDecode(localStorage.getItem('medsched_token')).tenant_id;
          const res = await api.get('/appointments/', { params: { tenant_id: tenantId } });
          const myApps = res.data.filter(app => app.profissional_id === user.id).sort((a,b) => new Date(a.data_hora_inicio) - new Date(b.data_hora_inicio));
          setUserAppointments(myApps);
      } catch (err) {
          toast.error("Erro ao carregar a agenda do profissional.");
      } finally {
          setIsHistoryLoading(false);
      }
  };

  const filteredHistory = useMemo(() => {
      let result = userAppointments;
      if (historyFilters.dataInicio) {
          const start = new Date(historyFilters.dataInicio); start.setHours(0,0,0,0);
          result = result.filter(app => new Date(app.data_hora_inicio) >= start);
      }
      if (historyFilters.dataFim) {
          const end = new Date(historyFilters.dataFim); end.setHours(23,59,59,999);
          result = result.filter(app => new Date(app.data_hora_inicio) <= end);
      }
      return result;
  }, [userAppointments, historyFilters]);

  const handleExportHistoryCSV = () => {
    if (filteredHistory.length === 0) return toast.error("Nenhum dado para exportar.");
    const csvRows = ['Data/Horario,Status,Cliente,Observacoes'];
    filteredHistory.forEach(app => {
      const dataHora = new Date(app.data_hora_inicio).toLocaleString('pt-BR');
      const status = app.status ? String(app.status).toUpperCase() : 'N/A';
      const custName = customers.find(c => c.id === app.customer_id)?.nome || 'Cliente';
      const obs = app.observacoes_internas ? app.observacoes_internas.replace(/(\r\n|\n|\r)/gm, " ") : '';
      csvRows.push(`"${dataHora}","${status}","${custName}","${obs}"`);
    });
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Agenda_${selectedHistoryUser?.nome.replace(/\s+/g, '_')}.csv`;
    link.click();
    toast.success("Agenda exportada!");
  };

  const getSolidStatusStyle = (status) => {
    switch(status?.toLowerCase()) {
      case 'confirmado': return { backgroundColor: '#3b82f6', color: '#ffffff', borderColor: '#2563eb' };
      case 'concluido': return { backgroundColor: '#10b981', color: '#ffffff', borderColor: '#059669' };
      case 'cancelado_cliente': case 'cancelado_profissional': case 'no_show': return { backgroundColor: '#64748b', color: '#ffffff', borderColor: '#475569' };
      default: return { backgroundColor: '#f59e0b', color: '#ffffff', borderColor: '#d97706' };
    }
  };

  const filteredUsers = useMemo(() => {
    let result = users;
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter(u => 
        (u.nome && u.nome.toLowerCase().includes(lowerSearch)) || 
        (u.email && u.email.toLowerCase().includes(lowerSearch)) ||
        (u.cpf && u.cpf.includes(lowerSearch)) ||
        (u.id && u.id.toLowerCase().includes(lowerSearch))
      );
    }
    const activeGroups = queryBuilder.groups.filter(g => g.rules.some(r => r.column && r.operator && r.value !== ''));
    if (activeGroups.length > 0) {
      result = result.filter(u => {
        const checkRule = (r) => {
          const fieldName = r.column === 'role' ? 'papel' : r.column;
          const userValue = String(u[fieldName] || '').toLowerCase();
          const filterValue = String(r.value).toLowerCase();
          switch (r.operator) {
            case 'contains': return userValue.includes(filterValue);
            case 'equals': return userValue === filterValue;
            case 'starts_with': return userValue.startsWith(filterValue);
            case 'not_equals': return userValue !== filterValue;
            default: return true;
          }
        };
        const checkGroup = (g) => {
          const validRules = g.rules.filter(r => r.column && r.operator && r.value !== '');
          if (validRules.length === 0) return true;
          if (g.logic === 'AND') return validRules.every(checkRule);
          return validRules.some(checkRule); 
        };
        if (queryBuilder.rootLogic === 'AND') return activeGroups.every(checkGroup);
        return activeGroups.some(checkGroup);
      });
    }
    return result;
  }, [users, searchTerm, queryBuilder]);

  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredUsers.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredUsers, currentPage, itemsPerPage]);

  const addGroup = () => setQueryBuilder(prev => ({ ...prev, groups: [...prev.groups, { id: Date.now(), logic: 'OR', rules: [{ id: Date.now() + 1, column: 'nome', operator: 'starts_with', value: '' }] }] }));
  const removeGroup = (groupId) => setQueryBuilder(prev => ({ ...prev, groups: prev.groups.filter(g => g.id !== groupId) }));
  const updateGroupLogic = (groupId, logic) => setQueryBuilder(prev => ({ ...prev, groups: prev.groups.map(g => g.id === groupId ? { ...g, logic } : g) }));
  const addRule = (groupId) => setQueryBuilder(prev => ({ ...prev, groups: prev.groups.map(g => g.id === groupId ? { ...g, rules: [...g.rules, { id: Date.now(), column: 'nome', operator: 'starts_with', value: '' }] } : g) }));
  const removeRule = (groupId, ruleId) => setQueryBuilder(prev => {
    const newGroups = prev.groups.map(g => { if (g.id === groupId) return { ...g, rules: g.rules.filter(r => r.id !== ruleId) }; return g; });
    return { ...prev, groups: newGroups.filter(g => g.rules.length > 0) }; 
  });
  const updateRule = (groupId, ruleId, field, value) => setQueryBuilder(prev => ({ ...prev, groups: prev.groups.map(g => { if (g.id === groupId) return { ...g, rules: g.rules.map(r => r.id === ruleId ? { ...r, [field]: value } : r) }; return g; }) }));
  const clearFilters = () => { setQueryBuilder({ rootLogic: 'AND', groups: [] }); setShowFilters(false); };

  const handleExportCSV = () => {
    const dataToExport = selectedUsers.length > 0 ? users.filter(u => selectedUsers.includes(u.id)) : filteredUsers;
    if (dataToExport.length === 0) return toast.error("Nenhum dado para exportar.");
    const headers = Object.keys(visibleColumns).filter(key => visibleColumns[key]);
    const csvRows = [headers.join(',')];
    for (const row of dataToExport) {
      const values = headers.map(header => `"${String(row[header === 'role' ? 'papel' : header] || row[header] || '').replace(/"/g, '""')}"`);
      csvRows.push(values.join(','));
    }
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    const now = new Date();
    const ano = now.getFullYear();
    const mes = String(now.getMonth() + 1).padStart(2, '0');
    const dia = String(now.getDate()).padStart(2, '0');
    const hora = String(now.getHours()).padStart(2, '0');
    const minuto = String(now.getMinutes()).padStart(2, '0');
    const segundo = String(now.getSeconds()).padStart(2, '0');
    link.download = `medsched_usuarios_${ano}${mes}${dia}_${hora}${minuto}${segundo}.csv`;
    link.click();
    toast.success(`${dataToExport.length} registros exportados!`);
  };

  const handleQuickInactivate = async () => {
    const count = selectedUsers.length;
    if (count === 0) return;
    if (!window.confirm(`Deseja inativar ${count} usuário(s)?`)) return;
    const loadingToast = toast.loading("Processando...");
    try {
      for (const userId of selectedUsers) {
        if (userId === currentUserId) continue;
        await api.put(`/users/${userId}`, { status: "INATIVO" }, { params: { tenant_id: jwtDecode(localStorage.getItem('medsched_token')).tenant_id } });
      }
      toast.success("Operação concluída.", { id: loadingToast });
      setSelectedUsers([]);
      fetchUsers();
    } catch (err) { toast.error("Erro na inativação.", { id: loadingToast }); }
  };

  const handleOpenCreate = () => { 
    setShowAddMenu(false); 
    setModalMode('create'); 
    setEditingAuditData(null);
    setFormData({ 
      nome: '', email: '', papel: 'PROFISSIONAL', senha: '', status: 'ATIVO', 
      cpf: '', telefone: '', telefone_contato: '', 
      endereco_cep: '', endereco_logradouro: '', endereco_numero: '', endereco_bairro: '', endereco_cidade: '', endereco_estado: '', endereco_regiao: '', observacoes: '',
      tenant_id: jwtDecode(localStorage.getItem('medsched_token')).tenant_id 
    }); 
    setIsModalOpen(true); 
  };

  const handleOpenEdit = () => {
    if (selectedUsers.length === 1) {
      const userToEdit = users.find(u => u.id === selectedUsers[0]);
      setFormData({ 
        nome: userToEdit.nome || '', email: userToEdit.email || '', papel: userToEdit.papel || userToEdit.role || 'PROFISSIONAL', status: userToEdit.status || 'ATIVO', 
        cpf: userToEdit.cpf || '', telefone: userToEdit.telefone || '', telefone_contato: userToEdit.telefone_contato || '',
        endereco_cep: userToEdit.endereco_cep || '', endereco_logradouro: userToEdit.endereco_logradouro || '', endereco_numero: userToEdit.endereco_numero || '', endereco_bairro: userToEdit.endereco_bairro || '', endereco_cidade: userToEdit.endereco_cidade || '',
        endereco_estado: userToEdit.endereco_estado || '', endereco_regiao: userToEdit.endereco_regiao || '', observacoes: userToEdit.observacoes || '',
        senha: '', tenant_id: userToEdit.tenant_id 
      });
      setEditingAuditData({
        id: userToEdit.id,
        criado_em: userToEdit.criado_em, criado_por: userToEdit.criado_por,
        alterado_em: userToEdit.alterado_em, alterado_por: userToEdit.alterado_por,
        deletado_em: userToEdit.deletado_em, deletado_por: userToEdit.deletado_por
      });
      setModalMode('edit'); setIsModalOpen(true);
    } else if (selectedUsers.length > 1) {
      setModalMode('batch-edit'); setBatchToggles({ papel: false, status: false, endereco_cidade: false, endereco_estado: false }); 
      setFormData({ 
        nome: '', email: '', papel: 'PROFISSIONAL', senha: '', status: 'ATIVO', cpf: '', telefone: '', telefone_contato: '', endereco_cep: '', endereco_logradouro: '', endereco_numero: '', endereco_bairro: '', endereco_cidade: '', endereco_estado: '', endereco_regiao: '', observacoes: '', tenant_id: jwtDecode(localStorage.getItem('medsched_token')).tenant_id 
      }); 
      setIsModalOpen(true);
    }
  };

  const handleSaveUser = async (e) => {
    e.preventDefault(); setIsSaving(true);
    try {
      const payload = { ...formData };
      if (modalMode === 'edit') delete payload.senha; 

      Object.keys(payload).forEach(key => {
        if (payload[key] === '') {
          payload[key] = null;
        }
      });

      if (modalMode === 'create') { 
        await api.post('/users/', payload); 
        toast.success("Usuário criado com sucesso!"); 
      } 
      else if (modalMode === 'edit') { 
        await api.put(`/users/${selectedUsers[0]}`, payload, { params: { tenant_id: formData.tenant_id } }); 
        toast.success("Usuário atualizado!"); 
        setSelectedUsers([]); 
      } 
      else if (modalMode === 'batch-edit') {
        const batchPayload = {}; 
        if (batchToggles.papel) batchPayload.papel = formData.papel; 
        if (batchToggles.status) batchPayload.status = formData.status;
        if (batchToggles.endereco_cidade) batchPayload.endereco_cidade = formData.endereco_cidade ? formData.endereco_cidade : null;
        if (batchToggles.endereco_estado) batchPayload.endereco_estado = formData.endereco_estado ? formData.endereco_estado : null;

        if (Object.keys(batchPayload).length === 0) { toast.error("Selecione pelo menos um campo para alterar."); setIsSaving(false); return; }
        
        const loadingToast = toast.loading(`Atualizando ${selectedUsers.length} registros...`);
        for (const userId of selectedUsers) { await api.put(`/users/${userId}`, batchPayload, { params: { tenant_id: formData.tenant_id } }); }
        toast.success("Edição em lote concluída!", { id: loadingToast }); setSelectedUsers([]);
      }
      setIsModalOpen(false); fetchUsers(); 
    } catch (err) { 
      toast.error("Erro ao salvar. Verifique os dados."); 
    } finally { setIsSaving(false); }
  };

  const toggleColumn = (colName) => setVisibleColumns(prev => ({ ...prev, [colName]: !prev[colName] }));
  const totalActiveRules = queryBuilder.groups.reduce((acc, g) => acc + g.rules.filter(r => r.value).length, 0);

  const formatDate = (isoString) => isoString ? new Date(isoString).toLocaleString('pt-BR') : '-';

  return (
    <Layout>
      <div className="p-8 max-w-7xl mx-auto flex flex-col gap-6">
        <Toaster position="top-right" />

        <Modal isOpen={isHistoryModalOpen} onClose={() => setIsHistoryModalOpen(false)} title={`Agenda do Profissional: ${selectedHistoryUser?.nome}`}>
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="flex items-center gap-4">
                    <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">A partir de</label>
                        <input type="date" className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" value={historyFilters.dataInicio} onChange={e => setHistoryFilters({...historyFilters, dataInicio: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Até o dia</label>
                        <input type="date" className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" value={historyFilters.dataFim} onChange={e => setHistoryFilters({...historyFilters, dataFim: e.target.value})} />
                    </div>
                </div>
                <button onClick={handleExportHistoryCSV} disabled={filteredHistory.length === 0} className="flex items-center gap-2 bg-white hover:bg-slate-100 disabled:opacity-50 text-slate-700 px-4 py-2 rounded-lg text-sm font-bold transition-all border border-slate-300 shadow-sm mt-4">
                    <Download className="w-4 h-4" /> Exportar Lista
                </button>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden max-h-[50vh] overflow-y-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] tracking-wider sticky top-0 z-10 shadow-sm">
                  <tr>
                    <th className="px-4 py-3 font-bold">Data e Hora</th>
                    <th className="px-4 py-3 font-bold">Status</th>
                    <th className="px-4 py-3 font-bold">Cliente</th>
                    <th className="px-4 py-3 font-bold">Observações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {isHistoryLoading ? (
                      <tr><td colSpan="4" className="text-center py-10"><Loader2 className="w-6 h-6 animate-spin text-blue-500 mx-auto" /></td></tr>
                  ) : filteredHistory.length === 0 ? (
                      <tr><td colSpan="4" className="text-center py-10 text-slate-400 font-medium">Nenhum agendamento encontrado no período.</td></tr>
                  ) : (
                    filteredHistory.map(app => {
                        const custName = customers.find(c => c.id === app.customer_id)?.nome || 'Cliente';
                        return (
                          <tr key={app.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-4 py-3 font-bold text-slate-700 whitespace-nowrap">{new Date(app.data_hora_inicio).toLocaleString('pt-BR', {day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit'})}</td>
                            <td className="px-4 py-3">
                                <span className="px-2 py-1 rounded text-[10px] font-bold uppercase shadow-sm border whitespace-nowrap" style={getSolidStatusStyle(app.status)}>
                                    {app.status ? String(app.status).replace(/_/g, ' ') : 'N/A'}
                                </span>
                            </td>
                            <td className="px-4 py-3 text-slate-600 font-medium whitespace-nowrap">{custName}</td>
                            <td className="px-4 py-3 text-slate-500 text-xs truncate max-w-[200px]" title={app.observacoes_internas}>{app.observacoes_internas || '-'}</td>
                          </tr>
                        )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </Modal>

        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={modalMode === 'create' ? "Novo Usuário" : modalMode === 'edit' ? "Editar Usuário" : "Edição em Lote"}>
          <form onSubmit={handleSaveUser} className="space-y-6 max-h-[75vh] overflow-y-auto px-1 pb-2">
            
            {modalMode === 'batch-edit' && (
              <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg text-sm text-blue-800 flex items-start gap-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <p>Você está editando <strong>{selectedUsers.length} usuários</strong> simultaneamente. Marque apenas os campos que deseja sobrescrever em todos eles.</p>
              </div>
            )}

            {modalMode !== 'batch-edit' && (
              <fieldset className="border border-gray-200 p-4 rounded-xl bg-gray-50/50">
                <legend className="text-sm font-bold text-gray-700 px-2 uppercase tracking-wider">Informações Básicas</legend>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                  <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label><input required className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" value={formData.nome || ''} onChange={e => setFormData({...formData, nome: e.target.value})} /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label><input required disabled={modalMode === 'edit'} type="email" className={`w-full px-4 py-2 border border-gray-300 rounded-lg outline-none ${modalMode === 'edit' ? 'bg-gray-100 cursor-not-allowed' : 'focus:ring-2 focus:ring-blue-500'}`} value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value})} /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">CPF</label><input className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" placeholder="000.000.000-00" value={formData.cpf || ''} onChange={e => setFormData({...formData, cpf: e.target.value})} /></div>
                  {modalMode === 'create' && (<div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Senha de Acesso</label><input required type="password" minLength={8} className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" value={formData.senha || ''} onChange={e => setFormData({...formData, senha: e.target.value})} /></div>)}
                </div>
              </fieldset>
            )}

            {modalMode !== 'batch-edit' && (
              <>
                <fieldset className="border border-gray-200 p-4 rounded-xl bg-gray-50/50 mt-4">
                  <legend className="text-sm font-bold text-gray-700 px-2 uppercase tracking-wider">Telefones</legend>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Telefone Principal</label><input className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" placeholder="(00) 00000-0000" value={formData.telefone || ''} onChange={e => setFormData({...formData, telefone: e.target.value})} /></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Telefone Recado/Contato</label><input className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" placeholder="(00) 00000-0000" value={formData.telefone_contato || ''} onChange={e => setFormData({...formData, telefone_contato: e.target.value})} /></div>
                  </div>
                </fieldset>

                <fieldset className="border border-blue-200 p-4 rounded-xl bg-blue-50/30 mt-4 shadow-sm">
                  <legend className="text-sm font-bold text-blue-700 px-2 uppercase tracking-wider flex items-center gap-2"><MapPin className="w-4 h-4" /> Endereço & Localização</legend>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                    
                    {/* Linha 1: Apenas o CEP */}
                    <div className="relative md:col-span-1">
                        <label className="block text-xs font-bold text-gray-700 mb-1">CEP</label>
                        <input className="w-full px-4 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-bold" placeholder="00000-000" value={formData.endereco_cep || ''} onChange={e => handleCEPLookup(e.target.value)} />
                        {isCheckingCEP && <Loader2 className="w-4 h-4 animate-spin absolute right-3 top-8 text-blue-500" />}
                    </div>
                    <div className="hidden md:block md:col-span-2"></div> {/* Espaçador invisível para forçar a quebra de linha */}

                    {/* Linha 2: Logradouro + Número ocupando as 3 colunas */}
                    <div className="md:col-span-2"><label className="block text-xs font-bold text-gray-700 mb-1">Logradouro (Rua, Av)</label><input readOnly className="w-full px-4 py-2 border border-gray-300 bg-gray-100 rounded-lg text-gray-500" value={formData.endereco_logradouro || ''} onChange={e => setFormData({...formData, endereco_logradouro: e.target.value})} /></div>
                    <div className="md:col-span-1"><label className="block text-xs font-bold text-gray-700 mb-1">Número</label><input className="w-full px-4 py-2 border border-blue-400 shadow-sm rounded-lg outline-none focus:ring-2 focus:ring-blue-500" value={formData.endereco_numero || ''} onChange={e => setFormData({...formData, endereco_numero: e.target.value})} /></div>
                    
                    {/* Linha 3: Bairro, Cidade, UF e Região */}
                    <div className="md:col-span-1"><label className="block text-xs font-bold text-gray-700 mb-1">Bairro</label><input readOnly className="w-full px-4 py-2 border border-gray-300 bg-gray-100 rounded-lg text-gray-500" value={formData.endereco_bairro || ''} onChange={e => setFormData({...formData, endereco_bairro: e.target.value})} /></div>
                    <div className="md:col-span-1"><label className="block text-xs font-bold text-gray-700 mb-1">Cidade</label><input readOnly className="w-full px-4 py-2 border border-gray-300 bg-gray-100 rounded-lg text-gray-500" value={formData.endereco_cidade || ''} onChange={e => setFormData({...formData, endereco_cidade: e.target.value})} /></div>
                    <div className="md:col-span-1 grid grid-cols-2 gap-2">
                        <div><label className="block text-xs font-bold text-gray-700 mb-1">UF</label><input readOnly className="w-full px-4 py-2 border border-gray-300 bg-gray-100 rounded-lg text-gray-500 text-center" maxLength={2} value={formData.endereco_estado || ''} onChange={e => setFormData({...formData, endereco_estado: e.target.value})} /></div>
                        <div><label className="block text-xs font-bold text-gray-700 mb-1">Região</label><input className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" value={formData.endereco_regiao || ''} onChange={e => setFormData({...formData, endereco_regiao: e.target.value})} /></div>
                    </div>
                  </div>
                </fieldset>
              </>
            )}

            <fieldset className="border border-gray-200 p-4 rounded-xl bg-gray-50/50 mt-4">
              <legend className="text-sm font-bold text-gray-700 px-2 uppercase tracking-wider">Configurações de Acesso</legend>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                <div className={`p-3 rounded-lg border ${modalMode === 'batch-edit' && !batchToggles.papel ? 'bg-gray-100 border-gray-200' : 'bg-white border-gray-300'}`}>
                  {modalMode === 'batch-edit' ? <label className="flex items-center gap-2 mb-2 font-semibold text-gray-700 cursor-pointer"><input type="checkbox" checked={batchToggles.papel} onChange={e => setBatchToggles({...batchToggles, papel: e.target.checked})} className="rounded text-blue-600" />Sobrescrever Cargo</label> : <label className="block text-sm font-medium text-gray-700 mb-1">Papel / Cargo</label>}
                  <select disabled={modalMode === 'batch-edit' && !batchToggles.papel} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none bg-white disabled:bg-gray-50" value={formData.papel} onChange={e => setFormData({...formData, papel: e.target.value})}><option value="TENANT_ADMIN">Admin</option><option value="PROFISSIONAL">Profissional</option><option value="CLIENTE">Cliente</option></select>
                </div>
                {modalMode !== 'create' && (
                  <div className={`p-3 rounded-lg border ${modalMode === 'batch-edit' && !batchToggles.status ? 'bg-gray-100 border-gray-200' : 'bg-white border-gray-300'}`}>
                    {modalMode === 'batch-edit' ? <label className="flex items-center gap-2 mb-2 font-semibold text-gray-700 cursor-pointer"><input type="checkbox" checked={batchToggles.status} onChange={e => setBatchToggles({...batchToggles, status: e.target.checked})} className="rounded text-blue-600" />Sobrescrever Status</label> : <label className="block text-sm font-medium text-gray-700 mb-1">Status do Acesso</label>}
                    <select disabled={modalMode === 'batch-edit' && !batchToggles.status} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none bg-white disabled:bg-gray-50" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}><option value="ATIVO">Ativo</option><option value="PENDENTE">Pendente</option><option value="INATIVO">Inativo</option></select>
                  </div>
                )}
                {modalMode === 'batch-edit' && (
                  <>
                    <div className={`p-3 rounded-lg border ${!batchToggles.endereco_cidade ? 'bg-gray-100 border-gray-200' : 'bg-white border-gray-300'}`}><label className="flex items-center gap-2 mb-2 font-semibold text-gray-700 cursor-pointer"><input type="checkbox" checked={batchToggles.endereco_cidade} onChange={e => setBatchToggles({...batchToggles, endereco_cidade: e.target.checked})} className="rounded text-blue-600" />Sobrescrever Cidade</label><input disabled={!batchToggles.endereco_cidade} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none disabled:bg-gray-50" value={formData.endereco_cidade} onChange={e => setFormData({...formData, endereco_cidade: e.target.value})} /></div>
                    <div className={`p-3 rounded-lg border ${!batchToggles.endereco_estado ? 'bg-gray-100 border-gray-200' : 'bg-white border-gray-300'}`}><label className="flex items-center gap-2 mb-2 font-semibold text-gray-700 cursor-pointer"><input type="checkbox" checked={batchToggles.endereco_estado} onChange={e => setBatchToggles({...batchToggles, endereco_estado: e.target.checked})} className="rounded text-blue-600" />Sobrescrever Estado (UF)</label><input disabled={!batchToggles.endereco_estado} maxLength={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none disabled:bg-gray-50" value={formData.endereco_estado} onChange={e => setFormData({...formData, endereco_estado: e.target.value})} /></div>
                  </>
                )}
              </div>
            </fieldset>

            {modalMode !== 'batch-edit' && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Observações Internas</label>
                <textarea rows={3} className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 resize-none" placeholder="Anotações sobre este usuário..." value={formData.observacoes || ''} onChange={e => setFormData({...formData, observacoes: e.target.value})} />
              </div>
            )}

            {modalMode === 'edit' && editingAuditData && (
              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="flex items-center gap-2 text-gray-500 mb-3"><Info className="w-4 h-4" /><span className="text-xs font-bold uppercase tracking-wider">Auditoria do Registro</span></div>
                <div className="grid grid-cols-2 gap-y-2 text-xs text-gray-500 bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <div><span className="font-semibold">ID no Banco:</span> {editingAuditData.id}</div>
                  <div><span className="font-semibold">Criado em:</span> {formatDate(editingAuditData.criado_em)}</div>
                  <div><span className="font-semibold">Criado por:</span> {editingAuditData.criado_por || '-'}</div>
                  <div><span className="font-semibold">Última alteração:</span> {formatDate(editingAuditData.alterado_em)}</div>
                  <div><span className="font-semibold">Alterado por:</span> {editingAuditData.alterado_por || '-'}</div>
                  {editingAuditData.deletado_em && <div><span className="font-semibold text-red-500">Inativado em:</span> <span className="text-red-500">{formatDate(editingAuditData.deletado_em)}</span></div>}
                  {editingAuditData.deletado_por && <div><span className="font-semibold text-red-500">Inativado por:</span> <span className="text-red-500">{editingAuditData.deletado_por}</span></div>}
                </div>
              </div>
            )}

            <div className="sticky bottom-0 bg-white pt-4 pb-2 border-t mt-4 border-gray-100 flex gap-3">
              <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors">Cancelar</button>
              <button type="submit" disabled={isSaving || isCheckingCEP} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg flex justify-center items-center gap-2 font-bold hover:bg-blue-700 transition-colors">
                {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-4 h-4" />} 
                {modalMode === 'create' ? 'Salvar Novo Usuário' : modalMode === 'edit' ? 'Salvar Alterações' : 'Aplicar em Lote'}
              </button>
            </div>
          </form>
        </Modal>

        <div>
          <h1 className="text-3xl font-bold text-gray-900">Usuários</h1>
          <p className="text-gray-500 mt-1">Gestão de Usuários e Acessos.</p>
        </div>

        <div className="flex flex-col">
          <div className={`bg-white p-4 rounded-t-xl shadow-sm border border-gray-200 flex gap-4 items-center justify-between ${showFilters ? 'border-b-0 rounded-b-none' : ''}`}>
            <div className="relative flex-1 max-w-md flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input type="text" placeholder="Pesquisa rápida (Nome, E-mail, CPF, ID)..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm" />
              </div>
              <button onClick={() => { setShowFilters(!showFilters); if(!showFilters && queryBuilder.groups.length === 0) addGroup(); }} className={`p-2 rounded-lg border transition-colors flex items-center gap-2 ${showFilters || totalActiveRules > 0 ? 'bg-blue-50 border-blue-200 text-blue-700' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
                <Filter className="w-5 h-5" />
                {totalActiveRules > 0 && <span className="bg-blue-600 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">{totalActiveRules}</span>}
              </button>
            </div>

            <div className="flex items-center gap-2">
              {selectedUsers.length > 0 && (
                <div className="flex items-center gap-2 mr-2 pr-4 border-r border-gray-200">
                  <span className="text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1.5 rounded-md">{selectedUsers.length}</span>
                  <button onClick={handleOpenEdit} className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg" title="Editar"><Edit2 className="w-5 h-5" /></button>
                  <button onClick={handleQuickInactivate} className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg" title="Inativar em Lote"><UserX className="w-5 h-5" /></button>
                </div>
              )}
              
              <div className="relative">
                <button onClick={() => setShowColumnMenu(!showColumnMenu)} className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600" title="Configurar Colunas">
                  <Settings2 className="w-5 h-5" />
                </button>
                
                {showColumnMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 shadow-xl rounded-xl z-50 py-2 max-h-96 overflow-y-auto">
                    <div className="px-4 py-2 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase mb-1">Colunas Visíveis</div>
                    {Object.keys(visibleColumns).map(col => (
                      <label key={col} className="flex items-center px-4 py-2 hover:bg-gray-50 cursor-pointer text-sm capitalize text-gray-700">
                        <input type="checkbox" checked={visibleColumns[col]} onChange={() => toggleColumn(col)} className="rounded text-blue-600 mr-3 focus:ring-blue-500" /> 
                        {col === 'id' ? 'ID do Banco' : col.replace(/_/g, ' ')}
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <button onClick={handleExportCSV} className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600" title="Exportar CSV"><Download className="w-5 h-5" /></button>
              <div className="relative">
                <button onClick={() => setShowAddMenu(!showAddMenu)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 font-medium shadow-sm"><UserPlus className="w-5 h-5" /> Adicionar</button>
                {showAddMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 shadow-xl rounded-xl z-20 py-1">
                    <button onClick={handleOpenCreate} className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-blue-50"><UserPlus className="w-4 h-4 mr-2 text-blue-600" /> Novo Usuário</button>
                    <button onClick={() => setShowAddMenu(false)} className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-blue-50"><UploadCloud className="w-4 h-4 mr-2 text-blue-600" /> Importar de CSV</button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {showFilters && (
            <div className="bg-gray-50 p-5 border border-t-0 border-gray-200 rounded-b-xl shadow-sm mb-4 animate-in slide-in-from-top-2 duration-200">
              <div className="flex justify-between items-center mb-4 border-b border-gray-200 pb-3">
                <div className="flex items-center gap-3">
                  <Layers className="w-5 h-5 text-gray-500" />
                  <span className="text-sm font-bold text-gray-700">Mostrar resultados que correspondam a</span>
                  <select value={queryBuilder.rootLogic} onChange={e => setQueryBuilder({...queryBuilder, rootLogic: e.target.value})} className="text-sm font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded px-2 py-1 outline-none">
                    <option value="AND">TODOS os Grupos (E)</option>
                    <option value="OR">QUALQUER Grupo (OU)</option>
                  </select>
                </div>
                <button onClick={clearFilters} className="text-xs text-red-600 hover:text-red-800 font-medium">Limpar Todos os Filtros</button>
              </div>
              
              <div className="space-y-4">
                {queryBuilder.groups.map((group, groupIndex) => (
                  <div key={group.id} className="bg-white p-4 border border-gray-200 rounded-lg shadow-sm relative">
                    <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-100">
                      <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded">GRUPO {groupIndex + 1}</span>
                      <span className="text-xs text-gray-500">Corresponder a</span>
                      <select value={group.logic} onChange={e => updateGroupLogic(group.id, e.target.value)} className="text-xs font-bold text-gray-700 border border-gray-300 rounded px-1 outline-none bg-gray-50">
                        <option value="OR">QUALQUER regra abaixo (OU)</option>
                        <option value="AND">TODAS as regras abaixo (E)</option>
                      </select>
                      <button onClick={() => removeGroup(group.id)} className="ml-auto p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded" title="Remover Grupo"><Trash2 className="w-4 h-4" /></button>
                    </div>

                    <div className="space-y-2 pl-2 border-l-2 border-blue-200">
                      {group.rules.map((rule, ruleIndex) => (
                        <div key={rule.id} className="flex gap-3 items-center">
                          <span className="text-xs font-bold text-blue-400 w-8 text-center">{ruleIndex === 0 ? '►' : group.logic === 'AND' ? 'E' : 'OU'}</span>
                          <select className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-white" value={rule.column} onChange={e => updateRule(group.id, rule.id, 'column', e.target.value)}>
                            {Object.keys(visibleColumns).map(col => (<option key={col} value={col}>{col === 'id' ? 'ID' : col.replace(/_/g, ' ')}</option>))}
                          </select>
                          <select className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-white" value={rule.operator} onChange={e => updateRule(group.id, rule.id, 'operator', e.target.value)}>
                            <option value="starts_with">Começa com</option><option value="contains">Contém</option><option value="equals">É igual a</option><option value="not_equals">É diferente de</option>
                          </select>
                          {['role', 'papel', 'status'].includes(rule.column) ? (
                            <select className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-white" value={rule.value} onChange={e => updateRule(group.id, rule.id, 'value', e.target.value)}>
                              <option value="">Selecione...</option>
                              {['role', 'papel'].includes(rule.column) ? <><option value="TENANT_ADMIN">Admin</option><option value="PROFISSIONAL">Profissional</option><option value="CLIENTE">Cliente</option></> : <><option value="ATIVO">Ativo</option><option value="PENDENTE">Pendente</option><option value="INATIVO">Inativo</option></>}
                            </select>
                          ) : <input type="text" className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" placeholder="Digite o valor..." value={rule.value} onChange={e => updateRule(group.id, rule.id, 'value', e.target.value)} />}
                          <button onClick={() => removeRule(group.id, rule.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"><X className="w-4 h-4" /></button>
                        </div>
                      ))}
                      <button onClick={() => addRule(group.id)} className="mt-2 text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"><Plus className="w-3 h-3" /> Adicionar Regra</button>
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={addGroup} className="mt-4 text-sm font-bold text-gray-700 bg-white border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 flex items-center gap-2 shadow-sm"><Layers className="w-4 h-4" /> Adicionar Novo Grupo</button>
            </div>
          )}

          <div className={`bg-white border border-gray-200 overflow-x-auto shadow-sm relative ${showFilters ? 'rounded-xl' : 'border-t-0 rounded-b-xl'}`}>
            <table className="w-full text-left min-w-[1200px]">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 text-sm uppercase sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-4 w-12"><input type="checkbox" onChange={e => e.target.checked ? setSelectedUsers(paginatedUsers.map(u => u.id)) : setSelectedUsers([])} checked={selectedUsers.length > 0 && selectedUsers.length === paginatedUsers.length} /></th>
                  <th className="px-4 py-4 w-20 text-center font-semibold tracking-wider">Ações</th>
                  {Object.keys(visibleColumns).map(col => visibleColumns[col] && <th key={col} className="px-6 py-4 capitalize font-semibold tracking-wider whitespace-nowrap">{col === 'id' ? 'ID' : col.replace(/_/g, ' ')}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginatedUsers.length === 0 ? (
                   <tr><td colSpan={15} className="px-6 py-12 text-center text-gray-500 font-medium">Nenhum registro encontrado.</td></tr>
                ) : (
                  paginatedUsers.map((user) => (
                    <tr key={user.id} className={`hover:bg-blue-50/50 transition-colors group ${selectedUsers.includes(user.id) ? 'bg-blue-50' : ''}`}>
                      <td className="px-6 py-4"><input type="checkbox" checked={selectedUsers.includes(user.id)} onChange={() => setSelectedUsers(prev => prev.includes(user.id) ? prev.filter(id => id !== user.id) : [...prev, user.id])} /></td>
                      
                      <td className="px-4 py-4 text-center">
                          <button onClick={() => openHistoryModal(user)} className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors border border-transparent shadow-sm hover:border-blue-200" title="Ver Agenda">
                              <CalendarDays className="w-4 h-4" />
                          </button>
                      </td>

                      {visibleColumns.id && <td className="px-6 py-4 text-gray-400 font-mono text-xs">{user.id}</td>}
                      {visibleColumns.nome && <td className="px-6 py-4 font-bold text-gray-900 whitespace-nowrap">{user.nome}</td>}
                      {visibleColumns.email && <td className="px-6 py-4 text-gray-600 whitespace-nowrap">{user.email}</td>}
                      {visibleColumns.role && <td className="px-6 py-4 text-xs font-semibold text-gray-500">{user.papel || user.role}</td>}
                      {visibleColumns.telefone && <td className="px-6 py-4 text-gray-600 whitespace-nowrap">{user.telefone || '-'}</td>}
                      {visibleColumns.status && (
                        <td className="px-6 py-4">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-bold shadow-sm ${user.status === 'ATIVO' ? 'bg-green-100 text-green-700 border border-green-200' : user.status === 'PENDENTE' ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' : 'bg-red-100 text-red-700 border border-red-200'}`}>{user.status}</span>
                        </td>
                      )}
                      
                      {visibleColumns.cpf && <td className="px-6 py-4 text-gray-600 whitespace-nowrap">{user.cpf || '-'}</td>}
                      {visibleColumns.telefone_contato && <td className="px-6 py-4 text-gray-600 whitespace-nowrap">{user.telefone_contato || '-'}</td>}
                      {visibleColumns.endereco_cidade && <td className="px-6 py-4 text-gray-600 whitespace-nowrap">{user.endereco_cidade || '-'}</td>}
                      {visibleColumns.endereco_estado && <td className="px-6 py-4 text-gray-600">{user.endereco_estado || '-'}</td>}
                      
                      {visibleColumns.criado_em && <td className="px-6 py-4 text-gray-500 text-xs whitespace-nowrap">{formatDate(user.criado_em)}</td>}
                      {visibleColumns.criado_por && <td className="px-6 py-4 text-gray-500 text-xs whitespace-nowrap">{user.criado_por || '-'}</td>}
                      {visibleColumns.alterado_em && <td className="px-6 py-4 text-gray-500 text-xs whitespace-nowrap">{formatDate(user.alterado_em)}</td>}
                      {visibleColumns.alterado_por && <td className="px-6 py-4 text-gray-500 text-xs whitespace-nowrap">{user.alterado_por || '-'}</td>}
                      {visibleColumns.deletado_em && <td className={`px-6 py-4 text-xs whitespace-nowrap ${user.status === 'INATIVO' ? 'text-red-500 font-medium' : 'text-gray-400'}`}>{user.status === 'INATIVO' ? formatDate(user.deletado_em) : '-'}</td>}
                      {visibleColumns.deletado_por && <td className={`px-6 py-4 text-xs whitespace-nowrap ${user.status === 'INATIVO' ? 'text-red-500 font-medium' : 'text-gray-400'}`}>{user.status === 'INATIVO' ? (user.deletado_por || 'Sistema') : '-'}</td>}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="flex justify-between items-center text-xs text-gray-500 pt-2 pb-8 relative">
          <div className="relative">
            <button onClick={() => setShowPerfDetails(!showPerfDetails)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors border ${showPerfDetails ? 'bg-blue-50 border-blue-200 text-blue-700' : 'border-transparent hover:bg-gray-100'}`} title="Clique para detalhes">
              <Clock className="w-4 h-4" /> <span className="font-medium">Carregado em {perfMetrics.total}ms</span>
            </button>
            {showPerfDetails && (
              <div className="absolute bottom-10 left-0 bg-white border border-gray-200 shadow-xl rounded-xl p-4 w-64 z-50 text-gray-700 animate-in fade-in slide-in-from-bottom-2">
                <div className="flex items-center gap-2 mb-3 border-b border-gray-100 pb-2"><Activity className="w-4 h-4 text-blue-600" /><h4 className="font-bold text-sm text-gray-900">Análise de Performance</h4></div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center"><span className="text-gray-500">Tempo de Rede:</span> <span className="font-semibold">{perfMetrics.network}ms</span></div>
                  <div className="flex justify-between items-center"><span className="text-gray-500">API (Servidor):</span> <span className="font-semibold">{perfMetrics.server}ms</span></div>
                  <div className="flex justify-between items-center"><span className="text-gray-500">Render (Browser):</span> <span className="font-semibold">{perfMetrics.browser}ms</span></div>
                  <div className="pt-2 mt-2 border-t border-gray-100 flex justify-between items-center"><span className="font-bold text-gray-900">Tempo Total:</span> <span className="font-bold text-blue-600 text-base">{perfMetrics.total}ms</span></div>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span>Linhas por página:</span>
              <select value={itemsPerPage} onChange={(e) => setItemsPerPage(Number(e.target.value))} className="border border-gray-300 rounded px-2 py-1 bg-white outline-none focus:border-blue-500 text-gray-700 font-medium cursor-pointer">
                <option value={10}>10</option><option value={25}>25</option><option value={50}>50</option><option value={100}>100</option><option value={100000}>Todos</option>
              </select>
            </div>
            <div className="font-medium">{filteredUsers.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredUsers.length)} de {filteredUsers.length}</div>
            <div className="flex items-center gap-1">
              <button disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)} className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"><ChevronLeft className="w-5 h-5 text-gray-600" /></button>
              <button disabled={currentPage * itemsPerPage >= filteredUsers.length} onClick={() => setCurrentPage(prev => prev + 1)} className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"><ChevronRight className="w-5 h-5 text-gray-600" /></button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
