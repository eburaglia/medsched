import React, { useEffect, useState, useMemo } from 'react';
import api from '../services/api';
import { jwtDecode } from 'jwt-decode';
import { Toaster, toast } from 'react-hot-toast';
import Modal from '../components/Modal';
import Layout from '../components/Layout';
import { 
  Plus, Shield, UserCheck, Loader2, AlertCircle, 
  Search, Download, Edit2, Trash2, Settings2, UploadCloud, Clock, Save, Filter, X, Layers, Activity, ChevronLeft, ChevronRight, Info,
  Ban
} from 'lucide-react';

export default function Resources() {
  const [resources, setResources] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [showPerfDetails, setShowPerfDetails] = useState(false);
  const [perfMetrics, setPerfMetrics] = useState({ network: 0, server: 0, browser: 0, api: 0, total: 0 });

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedResources, setSelectedResources] = useState([]);
  const [showColumnMenu, setShowColumnMenu] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);
  
  const [showFilters, setShowFilters] = useState(false);
  const [queryBuilder, setQueryBuilder] = useState({ rootLogic: 'AND', groups: [] });
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); 
  const [isSaving, setIsSaving] = useState(false);
  
  // Controles de edição em lote específicos de Recursos
  const [batchToggles, setBatchToggles] = useState({ status: false, tipo: false, capacidade_maxima: false, requer_aprovacao: false });

  const [formData, setFormData] = useState({ 
    nome: '', tipo: 'fisico', capacidade_maxima: 1, requer_aprovacao: false, observacoes: '', status: 'ativo', tenant_id: ''
  });

  const [editingAuditData, setEditingAuditData] = useState(null);

  const [visibleColumns, setVisibleColumns] = useState({ 
    id: false,
    nome: true, tipo: true, capacidade_maxima: true, requer_aprovacao: true, status: true, 
    observacoes: false,
    criado_em: false, criado_por: false, 
    alterado_em: false, alterado_por: false,
    deletado_em: false, deletado_por: false
  });
  
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchResources = async () => {
    const startTime = performance.now();
    try {
      const token = localStorage.getItem('medsched_token');
      if (!token) return;
      const decoded = jwtDecode(token);
      
      const response = await api.get('/resources/', { params: { tenant_id: decoded.tenant_id } });
      const endTime = performance.now(); 
      
      setResources(response.data);
      if (modalMode === 'create') setFormData(prev => ({ ...prev, tenant_id: decoded.tenant_id }));
      
      requestAnimationFrame(() => {
        const renderTime = performance.now();
        const apiTotal = Math.round(endTime - startTime);
        const serverEstimate = Math.round(apiTotal * 0.35);
        const networkEstimate = apiTotal - serverEstimate;
        const browserEstimate = Math.round(renderTime - endTime);
        
        setPerfMetrics({
          server: serverEstimate,
          network: networkEstimate,
          browser: browserEstimate,
          api: apiTotal,
          total: apiTotal + browserEstimate
        });
      });

    } catch (err) {
      setError("Falha ao carregar recursos.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchResources(); }, []);

  useEffect(() => {
    setCurrentPage(1);
    setSelectedResources([]); 
  }, [searchTerm, queryBuilder, itemsPerPage]);

  const filteredResources = useMemo(() => {
    let result = resources;
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter(r => 
        (r.nome && r.nome.toLowerCase().includes(lowerSearch)) || 
        (r.id && r.id.toLowerCase().includes(lowerSearch))
      );
    }
    const activeGroups = queryBuilder.groups.filter(g => g.rules.some(r => r.column && r.operator && r.value !== ''));
    if (activeGroups.length > 0) {
      result = result.filter(item => {
        const checkRule = (r) => {
          if (!r.column || !r.operator || r.value === '') return true;

          const isNumeric = ['capacidade_maxima'].includes(r.column);
          const isBoolean = ['requer_aprovacao'].includes(r.column);

          if (isNumeric) {
            const userValue = Number(item[r.column]) || 0;
            const filterValue = Number(r.value) || 0;
            switch (r.operator) {
              case 'equals': return userValue === filterValue;
              case 'not_equals': return userValue !== filterValue;
              case 'greater_than': return userValue > filterValue;
              case 'less_than': return userValue < filterValue;
              case 'greater_equals': return userValue >= filterValue;
              case 'less_equals': return userValue <= filterValue;
              default: return true;
            }
          } else if (isBoolean) {
             const userValue = String(item[r.column] === true);
             const filterValue = String(r.value === 'true');
             return userValue === filterValue;
          } else {
            const userValue = String(item[r.column] || '').toLowerCase();
            const filterValue = String(r.value).toLowerCase();
            switch (r.operator) {
              case 'contains': return userValue.includes(filterValue);
              case 'equals': return userValue === filterValue;
              case 'starts_with': return userValue.startsWith(filterValue);
              case 'not_equals': return userValue !== filterValue;
              default: return true;
            }
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
  }, [resources, searchTerm, queryBuilder]);

  const paginatedResources = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredResources.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredResources, currentPage, itemsPerPage]);

  const addGroup = () => setQueryBuilder(prev => ({ ...prev, groups: [...prev.groups, { id: Date.now(), logic: 'OR', rules: [{ id: Date.now() + 1, column: 'nome', operator: 'starts_with', value: '' }] }] }));
  const removeGroup = (groupId) => setQueryBuilder(prev => ({ ...prev, groups: prev.groups.filter(g => g.id !== groupId) }));
  const updateGroupLogic = (groupId, logic) => setQueryBuilder(prev => ({ ...prev, groups: prev.groups.map(g => g.id === groupId ? { ...g, logic } : g) }));
  const addRule = (groupId) => setQueryBuilder(prev => ({ ...prev, groups: prev.groups.map(g => g.id === groupId ? { ...g, rules: [...g.rules, { id: Date.now(), column: 'nome', operator: 'starts_with', value: '' }] } : g) }));
  const removeRule = (groupId, ruleId) => setQueryBuilder(prev => {
    const newGroups = prev.groups.map(g => { if (g.id === groupId) return { ...g, rules: g.rules.filter(r => r.id !== ruleId) }; return g; });
    return { ...prev, groups: newGroups.filter(g => g.rules.length > 0) }; 
  });
  
  const updateRuleColumn = (groupId, ruleId, newCol) => {
    setQueryBuilder(prev => ({
      ...prev,
      groups: prev.groups.map(g => {
        if (g.id === groupId) {
          return {
            ...g,
            rules: g.rules.map(r => {
              if (r.id === ruleId) {
                const wasNumeric = ['capacidade_maxima'].includes(r.column);
                const isNowNumeric = ['capacidade_maxima'].includes(newCol);
                const wasBool = ['requer_aprovacao'].includes(r.column);
                const isNowBool = ['requer_aprovacao'].includes(newCol);
                
                if (wasNumeric !== isNowNumeric || wasBool !== isNowBool) {
                  return { ...r, column: newCol, operator: 'equals', value: '' };
                }
                return { ...r, column: newCol };
              }
              return r;
            })
          };
        }
        return g;
      })
    }));
  };

  const updateRule = (groupId, ruleId, field, value) => setQueryBuilder(prev => ({ ...prev, groups: prev.groups.map(g => { if (g.id === groupId) return { ...g, rules: g.rules.map(r => r.id === ruleId ? { ...r, [field]: value } : r) }; return g; }) }));
  const clearFilters = () => { setQueryBuilder({ rootLogic: 'AND', groups: [] }); setShowFilters(false); };

  const handleExportCSV = () => {
    const dataToExport = selectedResources.length > 0 ? resources.filter(r => selectedResources.includes(r.id)) : filteredResources;
    if (dataToExport.length === 0) return toast.error("Nenhum dado para exportar.");
    const headers = Object.keys(visibleColumns).filter(key => visibleColumns[key]);
    const csvRows = [headers.join(',')];
    for (const row of dataToExport) {
      const values = headers.map(header => `"${String(row[header] || '').replace(/"/g, '""')}"`);
      csvRows.push(values.join(','));
    }
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    const now = new Date();
    link.download = `medsched_recursos_${now.getTime()}.csv`;
    link.click();
    toast.success(`${dataToExport.length} registros exportados!`);
  };

  const handleQuickInactivate = async () => {
    const count = selectedResources.length;
    if (count === 0) return;
    if (!window.confirm(`Deseja inativar ${count} recurso(s)? Eles não aparecerão mais para agendamento.`)) return;
    const loadingToast = toast.loading("Processando...");
    try {
      for (const resId of selectedResources) {
        await api.put(`/resources/${resId}`, { status: "inativo" }, { params: { tenant_id: jwtDecode(localStorage.getItem('medsched_token')).tenant_id } });
      }
      toast.success("Operação concluída.", { id: loadingToast });
      setSelectedResources([]);
      fetchResources();
    } catch (err) { toast.error("Erro na inativação.", { id: loadingToast }); }
  };

  const handleOpenCreate = () => { 
    setShowAddMenu(false); 
    setModalMode('create'); 
    setEditingAuditData(null);
    setFormData({ 
      nome: '', tipo: 'fisico', capacidade_maxima: 1, requer_aprovacao: false, observacoes: '', status: 'ativo', 
      tenant_id: jwtDecode(localStorage.getItem('medsched_token')).tenant_id 
    }); 
    setIsModalOpen(true); 
  };

  const handleOpenEdit = () => {
    if (selectedResources.length === 1) {
      const resToEdit = resources.find(r => r.id === selectedResources[0]);
      setFormData({ 
        nome: resToEdit.nome || '', 
        tipo: resToEdit.tipo || 'fisico', 
        capacidade_maxima: resToEdit.capacidade_maxima || 1, 
        requer_aprovacao: resToEdit.requer_aprovacao || false,
        observacoes: resToEdit.observacoes || '', 
        status: resToEdit.status || 'ativo', 
        tenant_id: resToEdit.tenant_id 
      });
      setEditingAuditData({
        id: resToEdit.id,
        criado_em: resToEdit.criado_em, criado_por: resToEdit.criado_por,
        alterado_em: resToEdit.alterado_em, alterado_por: resToEdit.alterado_por,
        deletado_em: resToEdit.deletado_em, deletado_por: resToEdit.deletado_por
      });
      setModalMode('edit'); setIsModalOpen(true);
    } else if (selectedResources.length > 1) {
      setModalMode('batch-edit'); setBatchToggles({ status: false, tipo: false, capacidade_maxima: false, requer_aprovacao: false }); 
      setFormData({ 
        nome: '', tipo: 'fisico', capacidade_maxima: 1, requer_aprovacao: false, observacoes: '', status: 'ativo', tenant_id: jwtDecode(localStorage.getItem('medsched_token')).tenant_id 
      }); 
      setIsModalOpen(true);
    }
  };

  const handleSaveResource = async (e) => {
    e.preventDefault(); setIsSaving(true);
    try {
      const payload = { ...formData };
      
      // Tratamento numérico
      if (payload.capacidade_maxima) payload.capacidade_maxima = parseInt(payload.capacidade_maxima, 10);
      
      // Sanitização de string vazia
      Object.keys(payload).forEach(key => {
        if (payload[key] === '' && key !== 'capacidade_maxima' && key !== 'requer_aprovacao') {
          payload[key] = null;
        }
      });

      if (modalMode === 'create') { 
        await api.post('/resources/', payload); 
        toast.success("Recurso criado com sucesso!"); 
      } 
      else if (modalMode === 'edit') { 
        await api.put(`/resources/${selectedResources[0]}`, payload, { params: { tenant_id: formData.tenant_id } }); 
        toast.success("Recurso atualizado!"); 
        setSelectedResources([]); 
      } 
      else if (modalMode === 'batch-edit') {
        const batchPayload = {}; 
        if (batchToggles.status) batchPayload.status = formData.status; 
        if (batchToggles.tipo) batchPayload.tipo = formData.tipo;
        if (batchToggles.capacidade_maxima) batchPayload.capacidade_maxima = formData.capacidade_maxima;
        if (batchToggles.requer_aprovacao) batchPayload.requer_aprovacao = formData.requer_aprovacao;

        if (Object.keys(batchPayload).length === 0) { toast.error("Selecione pelo menos um campo para alterar."); setIsSaving(false); return; }
        
        const loadingToast = toast.loading(`Atualizando ${selectedResources.length} registros...`);
        for (const resId of selectedResources) { await api.put(`/resources/${resId}`, batchPayload, { params: { tenant_id: formData.tenant_id } }); }
        toast.success("Edição em lote concluída!", { id: loadingToast }); setSelectedResources([]);
      }
      setIsModalOpen(false); fetchResources(); 
    } catch (err) { 
      const errorMsg = err.response?.data?.detail || "Erro ao salvar. Verifique os dados.";
      toast.error(typeof errorMsg === 'string' ? errorMsg : "Erro de formatação nos campos"); 
    } finally { setIsSaving(false); }
  };

  const toggleColumn = (colName) => setVisibleColumns(prev => ({ ...prev, [colName]: !prev[colName] }));
  const totalActiveRules = queryBuilder.groups.reduce((acc, g) => acc + g.rules.filter(r => r.value !== '').length, 0);
  const formatDate = (isoString) => isoString ? new Date(isoString).toLocaleString('pt-BR') : '-';

  return (
    <Layout>
      <div className="p-8 max-w-7xl mx-auto flex flex-col gap-6">
        <Toaster position="top-right" />

        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={modalMode === 'create' ? "Novo Recurso" : modalMode === 'edit' ? "Editar Recurso" : "Edição em Lote"}>
          <form onSubmit={handleSaveResource} className="space-y-6 max-h-[75vh] overflow-y-auto px-1 pb-2">
            
            {modalMode === 'batch-edit' && (
              <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg text-sm text-blue-800 flex items-start gap-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <p>Você está editando <strong>{selectedResources.length} recursos</strong> simultaneamente. Marque os campos que deseja sobrescrever.</p>
              </div>
            )}

            {modalMode !== 'batch-edit' && (
              <fieldset className="border border-gray-200 p-4 rounded-xl bg-gray-50/50">
                <legend className="text-sm font-bold text-gray-700 px-2 uppercase tracking-wider">Identificação</legend>
                <div className="grid grid-cols-1 gap-4 mt-2">
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Nome do Recurso / Sala</label><input required className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" placeholder="Ex: Sala de Raio-X 01" value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Observações ou Link de Acesso</label><textarea rows={2} className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 resize-none" placeholder="Localização, código de acesso..." value={formData.observacoes} onChange={e => setFormData({...formData, observacoes: e.target.value})} /></div>
                </div>
              </fieldset>
            )}

            <fieldset className="border border-gray-200 p-4 rounded-xl bg-gray-50/50">
              <legend className="text-sm font-bold text-gray-700 px-2 uppercase tracking-wider">Especificações & Regras</legend>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                
                <div className={`p-3 rounded-lg border ${modalMode === 'batch-edit' && !batchToggles.tipo ? 'bg-gray-100 border-gray-200' : 'bg-white border-gray-300'}`}>
                  {modalMode === 'batch-edit' ? <label className="flex items-center gap-2 mb-2 font-semibold text-gray-700 cursor-pointer"><input type="checkbox" checked={batchToggles.tipo} onChange={e => setBatchToggles({...batchToggles, tipo: e.target.checked})} className="rounded text-blue-600" />Sobrescrever Tipo</label> : <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Ambiente</label>}
                  <select disabled={modalMode === 'batch-edit' && !batchToggles.tipo} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none bg-white disabled:bg-gray-50" value={formData.tipo} onChange={e => setFormData({...formData, tipo: e.target.value})}>
                    <option value="fisico">Físico (Presencial)</option>
                    <option value="online">Online (Telemedicina)</option>
                  </select>
                </div>

                <div className={`p-3 rounded-lg border ${modalMode === 'batch-edit' && !batchToggles.status ? 'bg-gray-100 border-gray-200' : 'bg-white border-gray-300'}`}>
                  {modalMode === 'batch-edit' ? <label className="flex items-center gap-2 mb-2 font-semibold text-gray-700 cursor-pointer"><input type="checkbox" checked={batchToggles.status} onChange={e => setBatchToggles({...batchToggles, status: e.target.checked})} className="rounded text-blue-600" />Sobrescrever Status</label> : <label className="block text-sm font-medium text-gray-700 mb-1">Status Operacional</label>}
                  <select disabled={modalMode === 'batch-edit' && !batchToggles.status} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none bg-white disabled:bg-gray-50" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                    <option value="ativo">Ativo</option>
                    <option value="inativo">Inativo (Manutenção/Fechado)</option>
                  </select>
                </div>

                <div className={`p-3 rounded-lg border ${modalMode === 'batch-edit' && !batchToggles.capacidade_maxima ? 'bg-gray-100 border-gray-200' : 'bg-white border-gray-300'}`}>
                  {modalMode === 'batch-edit' ? <label className="flex items-center gap-2 mb-2 font-semibold text-gray-700 cursor-pointer"><input type="checkbox" checked={batchToggles.capacidade_maxima} onChange={e => setBatchToggles({...batchToggles, capacidade_maxima: e.target.checked})} className="rounded text-blue-600" />Sobrescrever Capacidade</label> : <label className="block text-sm font-medium text-gray-700 mb-1">Capacidade Simultânea</label>}
                  <input type="number" min="1" disabled={modalMode === 'batch-edit' && !batchToggles.capacidade_maxima} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50" value={formData.capacidade_maxima} onChange={e => setFormData({...formData, capacidade_maxima: e.target.value})} />
                </div>
                
                <div className={`p-3 rounded-lg border flex flex-col justify-center ${modalMode === 'batch-edit' && !batchToggles.requer_aprovacao ? 'bg-gray-100 border-gray-200' : 'bg-white border-gray-300'}`}>
                  {modalMode === 'batch-edit' && <label className="flex items-center gap-2 mb-2 font-semibold text-gray-700 cursor-pointer"><input type="checkbox" checked={batchToggles.requer_aprovacao} onChange={e => setBatchToggles({...batchToggles, requer_aprovacao: e.target.checked})} className="rounded text-blue-600" />Sobrescrever Aprovação</label>}
                  <label className={`flex items-center gap-3 font-medium text-gray-700 cursor-pointer ${modalMode === 'batch-edit' && !batchToggles.requer_aprovacao ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    <input type="checkbox" disabled={modalMode === 'batch-edit' && !batchToggles.requer_aprovacao} checked={formData.requer_aprovacao} onChange={e => setFormData({...formData, requer_aprovacao: e.target.checked})} className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500" />
                    Agendamento requer aprovação prévia
                  </label>
                </div>

              </div>
            </fieldset>

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
              <button type="submit" disabled={isSaving} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg flex justify-center items-center gap-2 font-bold hover:bg-blue-700 transition-colors">
                {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-4 h-4" />} 
                {modalMode === 'create' ? 'Salvar Novo Recurso' : modalMode === 'edit' ? 'Salvar Alterações' : 'Aplicar em Lote'}
              </button>
            </div>
          </form>
        </Modal>

        <div>
          <h1 className="text-3xl font-bold text-gray-900">Recursos e Infraestrutura</h1>
          <p className="text-gray-500 mt-1">Gestão de salas, equipamentos e ambientes online.</p>
        </div>

        <div className="flex flex-col">
          <div className={`bg-white p-4 rounded-t-xl shadow-sm border border-gray-200 flex gap-4 items-center justify-between ${showFilters ? 'border-b-0 rounded-b-none' : ''}`}>
            <div className="relative flex-1 max-w-md flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input type="text" placeholder="Pesquisa rápida (Nome, ID)..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm" />
              </div>
              <button onClick={() => { setShowFilters(!showFilters); if(!showFilters && queryBuilder.groups.length === 0) addGroup(); }} className={`p-2 rounded-lg border transition-colors flex items-center gap-2 ${showFilters || totalActiveRules > 0 ? 'bg-blue-50 border-blue-200 text-blue-700' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
                <Filter className="w-5 h-5" />
                {totalActiveRules > 0 && <span className="bg-blue-600 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">{totalActiveRules}</span>}
              </button>
            </div>

            <div className="flex items-center gap-2">
              {selectedResources.length > 0 && (
                <div className="flex items-center gap-2 mr-2 pr-4 border-r border-gray-200">
                  <span className="text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1.5 rounded-md">{selectedResources.length}</span>
                  <button onClick={handleOpenEdit} className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg" title="Editar"><Edit2 className="w-5 h-5" /></button>
                  <button onClick={handleQuickInactivate} className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg" title="Inativar em Lote"><Ban className="w-5 h-5" /></button>
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
                <button onClick={handleOpenCreate} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 font-medium shadow-sm"><Plus className="w-5 h-5" /> Novo Recurso</button>
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
                      {group.rules.map((rule, ruleIndex) => {
                        const isNumericCol = ['capacidade_maxima'].includes(rule.column);
                        const isBoolCol = ['requer_aprovacao'].includes(rule.column);
                        const isSelectCol = ['status', 'tipo'].includes(rule.column);
                        
                        return (
                          <div key={rule.id} className="flex gap-3 items-center">
                            <span className="text-xs font-bold text-blue-400 w-8 text-center">{ruleIndex === 0 ? '►' : group.logic === 'AND' ? 'E' : 'OU'}</span>
                            
                            <select className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-white" value={rule.column} onChange={e => updateRuleColumn(group.id, rule.id, e.target.value)}>
                              {Object.keys(visibleColumns).map(col => (<option key={col} value={col}>{col === 'id' ? 'ID' : col.replace(/_/g, ' ')}</option>))}
                            </select>
                            
                            <select className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-white" value={rule.operator} onChange={e => updateRule(group.id, rule.id, 'operator', e.target.value)}>
                              {isNumericCol ? (
                                <>
                                  <option value="equals">É igual a</option><option value="not_equals">É diferente de</option><option value="greater_than">Maior que (&gt;)</option><option value="less_than">Menor que (&lt;)</option><option value="greater_equals">Maior ou igual a (&gt;=)</option><option value="less_equals">Menor ou igual a (&lt;=)</option>
                                </>
                              ) : isBoolCol ? (
                                <>
                                  <option value="equals">É igual a</option>
                                </>
                              ) : (
                                <>
                                  <option value="starts_with">Começa com</option><option value="contains">Contém</option><option value="equals">É igual a</option><option value="not_equals">É diferente de</option>
                                </>
                              )}
                            </select>
                            
                            {isSelectCol ? (
                              <select className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-white" value={rule.value} onChange={e => updateRule(group.id, rule.id, 'value', e.target.value)}>
                                <option value="">Selecione...</option>
                                {rule.column === 'status' ? <><option value="ativo">Ativo</option><option value="inativo">Inativo</option></> : <><option value="fisico">Físico</option><option value="online">Online</option></>}
                              </select>
                            ) : isBoolCol ? (
                              <select className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-white" value={rule.value} onChange={e => updateRule(group.id, rule.id, 'value', e.target.value)}>
                                <option value="">Selecione...</option>
                                <option value="true">Sim</option><option value="false">Não</option>
                              </select>
                            ) : isNumericCol ? (
                              <input type="number" step="any" className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" placeholder="Digite o número..." value={rule.value} onChange={e => updateRule(group.id, rule.id, 'value', e.target.value)} />
                            ) : (
                              <input type="text" className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" placeholder="Digite o texto..." value={rule.value} onChange={e => updateRule(group.id, rule.id, 'value', e.target.value)} />
                            )}
                            
                            <button onClick={() => removeRule(group.id, rule.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"><X className="w-4 h-4" /></button>
                          </div>
                        );
                      })}
                      <button onClick={() => addRule(group.id)} className="mt-2 text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"><Plus className="w-3 h-3" /> Adicionar Regra</button>
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={addGroup} className="mt-4 text-sm font-bold text-gray-700 bg-white border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 flex items-center gap-2 shadow-sm"><Layers className="w-4 h-4" /> Adicionar Novo Grupo</button>
            </div>
          )}

          <div className={`bg-white border border-gray-200 overflow-x-auto shadow-sm relative ${showFilters ? 'rounded-xl' : 'border-t-0 rounded-b-xl'}`}>
            <table className="w-full text-left min-w-[1000px]">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 text-sm uppercase sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-4 w-12"><input type="checkbox" onChange={e => e.target.checked ? setSelectedResources(paginatedResources.map(r => r.id)) : setSelectedResources([])} checked={selectedResources.length > 0 && selectedResources.length === paginatedResources.length} /></th>
                  {Object.keys(visibleColumns).map(col => visibleColumns[col] && <th key={col} className="px-6 py-4 capitalize font-semibold tracking-wider whitespace-nowrap">{col === 'id' ? 'ID' : col.replace(/_/g, ' ')}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginatedResources.length === 0 ? (
                   <tr><td colSpan={15} className="px-6 py-12 text-center text-gray-500 font-medium">Nenhum recurso encontrado.</td></tr>
                ) : (
                  paginatedResources.map((res) => (
                    <tr key={res.id} className={`hover:bg-blue-50/50 transition-colors ${selectedResources.includes(res.id) ? 'bg-blue-50' : ''}`}>
                      <td className="px-6 py-4"><input type="checkbox" checked={selectedResources.includes(res.id)} onChange={() => setSelectedResources(prev => prev.includes(res.id) ? prev.filter(id => id !== res.id) : [...prev, res.id])} /></td>
                      {visibleColumns.id && <td className="px-6 py-4 text-gray-400 font-mono text-xs">{res.id}</td>}
                      {visibleColumns.nome && <td className="px-6 py-4 font-bold text-gray-900 whitespace-nowrap">{res.nome}</td>}
                      {visibleColumns.tipo && <td className="px-6 py-4 text-gray-600 font-medium uppercase text-xs">{res.tipo}</td>}
                      {visibleColumns.capacidade_maxima && <td className="px-6 py-4 text-gray-600 whitespace-nowrap">{res.capacidade_maxima} </td>}
                      {visibleColumns.requer_aprovacao && <td className="px-6 py-4 text-gray-600 whitespace-nowrap">{res.requer_aprovacao ? <span className="text-orange-600 font-bold">Sim</span> : 'Não'}</td>}
                      {visibleColumns.status && (
                        <td className="px-6 py-4">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-bold shadow-sm border ${res.status === 'ativo' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'}`}>
                            {res.status?.toUpperCase()}
                          </span>
                        </td>
                      )}
                      
                      {visibleColumns.observacoes && <td className="px-6 py-4 text-gray-600 truncate max-w-xs">{res.observacoes || '-'}</td>}
                      
                      {visibleColumns.criado_em && <td className="px-6 py-4 text-gray-500 text-xs whitespace-nowrap">{formatDate(res.criado_em)}</td>}
                      {visibleColumns.criado_por && <td className="px-6 py-4 text-gray-500 text-xs whitespace-nowrap">{res.criado_por || '-'}</td>}
                      {visibleColumns.alterado_em && <td className="px-6 py-4 text-gray-500 text-xs whitespace-nowrap">{formatDate(res.alterado_em)}</td>}
                      {visibleColumns.alterado_por && <td className="px-6 py-4 text-gray-500 text-xs whitespace-nowrap">{res.alterado_por || '-'}</td>}
                      {visibleColumns.deletado_em && <td className={`px-6 py-4 text-xs whitespace-nowrap ${res.status === 'inativo' ? 'text-red-500 font-medium' : 'text-gray-400'}`}>{res.status === 'inativo' ? formatDate(res.deletado_em) : '-'}</td>}
                      {visibleColumns.deletado_por && <td className={`px-6 py-4 text-xs whitespace-nowrap ${res.status === 'inativo' ? 'text-red-500 font-medium' : 'text-gray-400'}`}>{res.status === 'inativo' ? (res.deletado_por || 'Sistema') : '-'}</td>}
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
            <div className="font-medium">{filteredResources.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredResources.length)} de {filteredResources.length}</div>
            <div className="flex items-center gap-1">
              <button disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)} className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"><ChevronLeft className="w-5 h-5 text-gray-600" /></button>
              <button disabled={currentPage * itemsPerPage >= filteredResources.length} onClick={() => setCurrentPage(prev => prev + 1)} className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"><ChevronRight className="w-5 h-5 text-gray-600" /></button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
