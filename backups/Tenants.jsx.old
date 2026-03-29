import React, { useEffect, useState, useMemo } from 'react';
import api from '../services/api';
import { Toaster, toast } from 'react-hot-toast';
import Modal from '../components/Modal';
import Layout from '../components/Layout';
import { 
  Building2, Mail, Shield, Loader2, AlertCircle, 
  Search, Download, Edit2, Trash2, Settings2, UploadCloud, Clock, Save, Ban, Filter, Plus, X, Layers, Activity, ChevronLeft, ChevronRight, Info
} from 'lucide-react';

export default function Tenants() {
  const [tenants, setTenants] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [showPerfDetails, setShowPerfDetails] = useState(false);
  const [perfMetrics, setPerfMetrics] = useState({ network: 0, server: 0, browser: 0, api: 0, total: 0 });

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTenants, setSelectedTenants] = useState([]);
  const [showColumnMenu, setShowColumnMenu] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);
  
  const [showFilters, setShowFilters] = useState(false);
  const [queryBuilder, setQueryBuilder] = useState({ rootLogic: 'AND', groups: [] });
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); 
  const [isSaving, setIsSaving] = useState(false);
  
  const [batchToggles, setBatchToggles] = useState({ status: false, endereco_cidade: false, endereco_estado: false });

  const [formData, setFormData] = useState({ 
    nome: '', nome_fantasia: '', cnpj: '', segmento_atuacao: 'Saúde', fuso_horario: 'America/Sao_Paulo', status: 'phase-in',
    endereco_logradouro: '', endereco_cidade: '', endereco_estado: '', endereco_regiao: '',
    site_url: '', email_contato: '', telefone_contato: '', dominio_interno: '', url_externa: '', logotipo_url: '',
    validade_assinatura: '', observacoes: ''
  });

  const [editingAuditData, setEditingAuditData] = useState(null);

  const [visibleColumns, setVisibleColumns] = useState({ 
    codigo_visual: true, nome: true, cnpj: false, dominio_interno: true, email_contato: true, telefone_contato: true, status: true, 
    endereco_cidade: false, endereco_estado: false, criado_em: false, criado_por: false, alterado_em: false
  });
  
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchTenants = async () => {
    const startTime = performance.now();
    try {
      const response = await api.get('/tenants/');
      const endTime = performance.now(); 
      setTenants(response.data);
      
      requestAnimationFrame(() => {
        const renderTime = performance.now();
        const apiTotal = Math.round(endTime - startTime);
        setPerfMetrics({
          server: Math.round(apiTotal * 0.35),
          network: apiTotal - Math.round(apiTotal * 0.35),
          browser: Math.round(renderTime - endTime),
          api: apiTotal,
          total: apiTotal + Math.round(renderTime - endTime)
        });
      });
    } catch (err) { setError("Falha ao carregar clínicas."); } finally { setIsLoading(false); }
  };

  useEffect(() => { fetchTenants(); }, []);
  useEffect(() => { setCurrentPage(1); setSelectedTenants([]); }, [searchTerm, queryBuilder, itemsPerPage]);

  const filteredTenants = useMemo(() => {
    let result = tenants;
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter(t => 
        (t.nome && t.nome.toLowerCase().includes(lowerSearch)) || 
        (t.dominio_interno && t.dominio_interno.toLowerCase().includes(lowerSearch)) || 
        (t.cnpj && t.cnpj.includes(lowerSearch)) ||
        (String(t.codigo_visual).includes(lowerSearch))
      );
    }
    const activeGroups = queryBuilder.groups.filter(g => g.rules.some(r => r.column && r.operator && r.value !== ''));
    if (activeGroups.length > 0) {
      result = result.filter(item => {
        const checkRule = (r) => {
          if (!r.column || !r.operator || r.value === '') return true;
          const userValue = String(item[r.column] || '').toLowerCase();
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
  }, [tenants, searchTerm, queryBuilder]);

  const paginatedTenants = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredTenants.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredTenants, currentPage, itemsPerPage]);

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
    const dataToExport = selectedTenants.length > 0 ? tenants.filter(t => selectedTenants.includes(t.id)) : filteredTenants;
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
    link.download = `medsched_clinicas_${new Date().getTime()}.csv`;
    link.click();
    toast.success(`${dataToExport.length} registros exportados!`);
  };

  const handleQuickInactivate = async () => {
    const count = selectedTenants.length;
    if (count === 0) return;
    if (!window.confirm(`Deseja inativar ${count} clínica(s)?`)) return;
    const loadingToast = toast.loading("Processando...");
    try {
      for (const id of selectedTenants) {
        await api.put(`/tenants/${id}`, { status: "inativo" });
      }
      toast.success("Operação concluída.", { id: loadingToast });
      setSelectedTenants([]);
      fetchTenants();
    } catch (err) { toast.error("Erro na inativação.", { id: loadingToast }); }
  };

  const handleOpenCreate = () => { 
    setShowAddMenu(false); 
    setModalMode('create'); 
    setEditingAuditData(null);
    setFormData({ 
      nome: '', nome_fantasia: '', cnpj: '', segmento_atuacao: 'Saúde', fuso_horario: 'America/Sao_Paulo', status: 'phase-in',
      endereco_logradouro: '', endereco_cidade: '', endereco_estado: '', endereco_regiao: '',
      site_url: '', email_contato: '', telefone_contato: '', dominio_interno: '', url_externa: '', logotipo_url: '',
      validade_assinatura: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0], 
      observacoes: ''
    }); 
    setIsModalOpen(true); 
  };

  const handleOpenEdit = () => {
    if (selectedTenants.length === 1) {
      const t = tenants.find(item => item.id === selectedTenants[0]);
      setFormData({ 
        ...t, 
        status: t.status || 'phase-in',
        validade_assinatura: t.validade_assinatura ? new Date(t.validade_assinatura).toISOString().split('T')[0] : '', 
        endereco_logradouro: t.endereco_logradouro || '', 
        endereco_cidade: t.endereco_cidade || '', endereco_estado: t.endereco_estado || '', 
        endereco_regiao: t.endereco_regiao || '', observacoes: t.observacoes || ''
      });
      setEditingAuditData(t);
      setModalMode('edit'); setIsModalOpen(true);
    } else if (selectedTenants.length > 1) {
      setModalMode('batch-edit'); setBatchToggles({ status: false, endereco_cidade: false, endereco_estado: false }); 
      setFormData({ 
        nome: '', nome_fantasia: '', cnpj: '', segmento_atuacao: '', fuso_horario: '', status: 'ativo',
        endereco_logradouro: '', endereco_cidade: '', endereco_estado: '', endereco_regiao: '',
        site_url: '', email_contato: '', telefone_contato: '', dominio_interno: '', url_externa: '', logotipo_url: '',
        validade_assinatura: '', observacoes: ''
      });
      setIsModalOpen(true);
    }
  };

  const handleSaveTenant = async (e) => {
    e.preventDefault(); 
    setIsSaving(true);
    try {
      const payload = { ...formData };

      // CORREÇÃO 1: Só transformamos em null o que é realmente opcional no banco.
      const optionalFields = ['nome_fantasia', 'cnpj', 'observacoes'];
      Object.keys(payload).forEach(key => { 
          if (payload[key] === '' && optionalFields.includes(key)) {
              payload[key] = null; 
          }
      });
      
      // CORREÇÃO 2: Garantir que URLs exigidas pelo banco não cheguem vazias
      if (payload.site_url === '') payload.site_url = 'https://';
      if (payload.url_externa === '') payload.url_externa = 'https://';
      if (payload.logotipo_url === '') payload.logotipo_url = 'https://';

      // CORREÇÃO 3: O backend exige status minúsculo (ativo, inativo, phase-in)
      if (payload.status) payload.status = payload.status.toLowerCase();

      // Formatação Pydantic
      if (payload.validade_assinatura) {
         payload.validade_assinatura = new Date(payload.validade_assinatura).toISOString();
      }

      if (modalMode === 'create') { 
        await api.post('/tenants/', payload); 
        toast.success("Clínica registrada com sucesso!"); 
      } 
      else if (modalMode === 'edit') { 
        await api.put(`/tenants/${selectedTenants[0]}`, payload); 
        toast.success("Clínica atualizada!"); 
        setSelectedTenants([]); 
      } 
      else if (modalMode === 'batch-edit') {
        const batchPayload = {}; 
        if (batchToggles.status) batchPayload.status = formData.status.toLowerCase();
        if (batchToggles.endereco_cidade) batchPayload.endereco_cidade = formData.endereco_cidade || null;
        if (batchToggles.endereco_estado) batchPayload.endereco_estado = formData.endereco_estado || null;

        if (Object.keys(batchPayload).length === 0) { toast.error("Selecione pelo menos um campo para alterar."); setIsSaving(false); return; }
        
        const loadingToast = toast.loading(`Atualizando ${selectedTenants.length} registros...`);
        for (const id of selectedTenants) { await api.put(`/tenants/${id}`, batchPayload); }
        toast.success("Edição em lote concluída!", { id: loadingToast }); setSelectedTenants([]);
      }
      setIsModalOpen(false); 
      fetchTenants(); 
    } catch (err) { 
      // PROTEÇÃO CONTRA TELA BRANCA:
      // Se o FastAPI retornar uma lista de validações (Array), nós transformamos em texto.
      let errorMsg = err.response?.data?.detail;
      if (Array.isArray(errorMsg)) {
         errorMsg = "Verifique o campo: " + errorMsg[0].loc.join(" -> ") + " (" + errorMsg[0].msg + ")";
      }
      toast.error(typeof errorMsg === 'string' ? errorMsg : "Erro de validação. Verifique os campos."); 
    } finally { 
      setIsSaving(false); 
    }
  };

  const toggleColumn = (colName) => setVisibleColumns(prev => ({ ...prev, [colName]: !prev[colName] }));
  const totalActiveRules = queryBuilder.groups.reduce((acc, g) => acc + g.rules.filter(r => r.value).length, 0);
  const formatDate = (isoString) => isoString ? new Date(isoString).toLocaleString('pt-BR') : '-';

  return (
    <Layout>
      <div className="p-8 max-w-7xl mx-auto flex flex-col gap-6">
        <Toaster position="top-right" />

        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={modalMode === 'create' ? "Nova Clínica/Tenant" : modalMode === 'edit' ? "Editar Clínica" : "Edição em Lote"}>
          <form onSubmit={handleSaveTenant} className="space-y-6 max-h-[75vh] overflow-y-auto px-1 pb-2">
            
            {modalMode === 'batch-edit' && (
              <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg text-sm text-blue-800 flex items-start gap-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <p>Você está editando <strong>{selectedTenants.length} clínicas</strong> simultaneamente. Marque apenas os campos que deseja sobrescrever em todos eles.</p>
              </div>
            )}

            {modalMode !== 'batch-edit' && (
              <fieldset className="border border-gray-200 p-4 rounded-xl bg-gray-50/50">
                <legend className="text-sm font-bold text-gray-700 px-2 uppercase tracking-wider">Identificação Básica</legend>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Razão Social *</label>
                    <input required className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" value={formData.nome || ''} onChange={e => setFormData({...formData, nome: e.target.value})} />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome Fantasia</label>
                    <input className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" value={formData.nome_fantasia || ''} onChange={e => setFormData({...formData, nome_fantasia: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">CNPJ</label>
                    <input className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" placeholder="00.000.000/0000-00" value={formData.cnpj || ''} onChange={e => setFormData({...formData, cnpj: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Segmento de Atuação *</label>
                    <input required className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" value={formData.segmento_atuacao || ''} onChange={e => setFormData({...formData, segmento_atuacao: e.target.value})} />
                  </div>
                </div>
              </fieldset>
            )}

            {modalMode !== 'batch-edit' && (
              <fieldset className="border border-gray-200 p-4 rounded-xl bg-gray-50/50">
                <legend className="text-sm font-bold text-gray-700 px-2 uppercase tracking-wider">Digital & Endereço</legend>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">E-mail de Contato *</label>
                    <input required type="email" className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" value={formData.email_contato || ''} onChange={e => setFormData({...formData, email_contato: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Telefone Comercial *</label>
                    <input required className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" value={formData.telefone_contato || ''} onChange={e => setFormData({...formData, telefone_contato: e.target.value})} />
                  </div>
                  
                  <div className="md:col-span-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <div>
                         <label className="block text-sm font-medium text-gray-700 mb-1">Domínio Interno (URL) *</label>
                         <input required className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" placeholder="ex: clinica-vida" value={formData.dominio_interno || ''} onChange={e => setFormData({...formData, dominio_interno: e.target.value.toLowerCase().replace(/\s+/g, '-')})} />
                       </div>
                       <div>
                         <label className="block text-sm font-medium text-gray-700 mb-1">Site Externo (URL)</label>
                         <input className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" placeholder="https://" value={formData.site_url || ''} onChange={e => setFormData({...formData, site_url: e.target.value})} />
                       </div>
                    </div>
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">URL Externa p/ Pacientes</label>
                    <input className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" placeholder="https://agendamento.clinica.com" value={formData.url_externa || ''} onChange={e => setFormData({...formData, url_externa: e.target.value})} />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">URL do Logotipo</label>
                    <input className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" placeholder="https://..." value={formData.logotipo_url || ''} onChange={e => setFormData({...formData, logotipo_url: e.target.value})} />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Logradouro Completo *</label>
                    <input required className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" value={formData.endereco_logradouro || ''} onChange={e => setFormData({...formData, endereco_logradouro: e.target.value})} />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cidade *</label>
                    <input required className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" value={formData.endereco_cidade || ''} onChange={e => setFormData({...formData, endereco_cidade: e.target.value})} />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Estado (UF) *</label>
                      <input required className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 uppercase" maxLength={2} placeholder="SP" value={formData.endereco_estado || ''} onChange={e => setFormData({...formData, endereco_estado: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Região *</label>
                      <input required className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" placeholder="Sudeste" value={formData.endereco_regiao || ''} onChange={e => setFormData({...formData, endereco_regiao: e.target.value})} />
                    </div>
                  </div>
                </div>
              </fieldset>
            )}

            <fieldset className="border border-gray-200 p-4 rounded-xl bg-gray-50/50">
              <legend className="text-sm font-bold text-gray-700 px-2 uppercase tracking-wider">Gestão e Assinatura</legend>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                <div className={`p-3 rounded-lg border ${modalMode === 'batch-edit' && !batchToggles.status ? 'bg-gray-100 border-gray-200' : 'bg-white border-gray-300'}`}>
                  {modalMode === 'batch-edit' ? <label className="flex items-center gap-2 mb-2 font-semibold text-gray-700 cursor-pointer"><input type="checkbox" checked={batchToggles.status} onChange={e => setBatchToggles({...batchToggles, status: e.target.checked})} className="rounded text-blue-600" />Sobrescrever Status</label> : <label className="block text-sm font-medium text-gray-700 mb-1">Status da Clínica</label>}
                  <select disabled={modalMode === 'batch-edit' && !batchToggles.status} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none bg-white disabled:bg-gray-50" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                    <option value="phase-in">Phase-In (Em implantação)</option>
                    <option value="ativo">Ativo</option>
                    <option value="phase-out">Phase-Out (Encerrando)</option>
                    <option value="inativo">Inativo</option>
                  </select>
                </div>

                {modalMode !== 'batch-edit' && (
                  <div className="p-3 rounded-lg border bg-white border-gray-300">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Validade da Assinatura *</label>
                    <input required type="date" className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" value={formData.validade_assinatura} onChange={e => setFormData({...formData, validade_assinatura: e.target.value})} />
                  </div>
                )}
                
                {modalMode === 'batch-edit' && (
                  <>
                    <div className={`p-3 rounded-lg border ${!batchToggles.endereco_cidade ? 'bg-gray-100 border-gray-200' : 'bg-white border-gray-300'}`}><label className="flex items-center gap-2 mb-2 font-semibold text-gray-700 cursor-pointer"><input type="checkbox" checked={batchToggles.endereco_cidade} onChange={e => setBatchToggles({...batchToggles, endereco_cidade: e.target.checked})} className="rounded text-blue-600" />Sobrescrever Cidade</label><input disabled={!batchToggles.endereco_cidade} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none disabled:bg-gray-50" value={formData.endereco_cidade || ''} onChange={e => setFormData({...formData, endereco_cidade: e.target.value})} /></div>
                    <div className={`p-3 rounded-lg border ${!batchToggles.endereco_estado ? 'bg-gray-100 border-gray-200' : 'bg-white border-gray-300'}`}><label className="flex items-center gap-2 mb-2 font-semibold text-gray-700 cursor-pointer"><input type="checkbox" checked={batchToggles.endereco_estado} onChange={e => setBatchToggles({...batchToggles, endereco_estado: e.target.checked})} className="rounded text-blue-600" />Sobrescrever Estado (UF)</label><input disabled={!batchToggles.endereco_estado} maxLength={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none disabled:bg-gray-50 uppercase" value={formData.endereco_estado || ''} onChange={e => setFormData({...formData, endereco_estado: e.target.value})} /></div>
                  </>
                )}
              </div>
            </fieldset>

            {modalMode !== 'batch-edit' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Observações Gerais</label>
                <textarea rows={3} className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 resize-none" placeholder="Anotações comerciais, plano contratado..." value={formData.observacoes || ''} onChange={e => setFormData({...formData, observacoes: e.target.value})} />
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
                </div>
              </div>
            )}

            <div className="sticky bottom-0 bg-white pt-4 pb-2 border-t mt-4 border-gray-100 flex gap-3">
              <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors">Cancelar</button>
              <button type="submit" disabled={isSaving} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg flex justify-center items-center gap-2 font-bold hover:bg-blue-700 transition-colors">
                {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-4 h-4" />} 
                {modalMode === 'create' ? 'Registrar Clínica' : modalMode === 'edit' ? 'Salvar Alterações' : 'Aplicar em Lote'}
              </button>
            </div>
          </form>
        </Modal>

        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestão Global de Tenants</h1>
          <p className="text-gray-500 mt-1">Controle de clínicas parceiras e faturamento.</p>
        </div>

        <div className="flex flex-col">
          <div className={`bg-white p-4 rounded-t-xl shadow-sm border border-gray-200 flex gap-4 items-center justify-between ${showFilters ? 'border-b-0 rounded-b-none' : ''}`}>
            <div className="relative flex-1 max-w-md flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input type="text" placeholder="Pesquisar (Código, Nome, URL, CNPJ)..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm" />
              </div>
              <button onClick={() => { setShowFilters(!showFilters); if(!showFilters && queryBuilder.groups.length === 0) addGroup(); }} className={`p-2 rounded-lg border transition-colors flex items-center gap-2 ${showFilters || totalActiveRules > 0 ? 'bg-blue-50 border-blue-200 text-blue-700' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
                <Filter className="w-5 h-5" />
                {totalActiveRules > 0 && <span className="bg-blue-600 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">{totalActiveRules}</span>}
              </button>
            </div>

            <div className="flex items-center gap-2">
              {selectedTenants.length > 0 && (
                <div className="flex items-center gap-2 mr-2 pr-4 border-r border-gray-200">
                  <span className="text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1.5 rounded-md">{selectedTenants.length}</span>
                  <button onClick={handleOpenEdit} className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg" title="Editar"><Edit2 className="w-5 h-5" /></button>
                  <button onClick={handleQuickInactivate} className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg" title="Inativar Lote"><Ban className="w-5 h-5" /></button>
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
                        {col === 'codigo_visual' ? 'CÓD. (ID)' : col.replace(/_/g, ' ')}
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <button onClick={handleExportCSV} className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600" title="Exportar CSV"><Download className="w-5 h-5" /></button>
              <button onClick={handleOpenCreate} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 shadow-sm hover:bg-blue-700 transition-colors"><Building2 className="w-5 h-5" /> Nova Clínica</button>
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
                            {Object.keys(visibleColumns).map(col => (<option key={col} value={col}>{col.replace(/_/g, ' ')}</option>))}
                          </select>
                          <select className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-white" value={rule.operator} onChange={e => updateRule(group.id, rule.id, 'operator', e.target.value)}>
                            <option value="starts_with">Começa com</option><option value="contains">Contém</option><option value="equals">É igual a</option><option value="not_equals">É diferente de</option>
                          </select>
                          {['status'].includes(rule.column) ? (
                            <select className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-white" value={rule.value} onChange={e => updateRule(group.id, rule.id, 'value', e.target.value)}>
                              <option value="">Selecione...</option><option value="phase-in">Phase In</option><option value="ativo">Ativo</option><option value="phase-out">Phase Out</option><option value="inativo">Inativo</option>
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
                  <th className="px-6 py-4 w-12"><input type="checkbox" onChange={e => e.target.checked ? setSelectedTenants(paginatedTenants.map(u => u.id)) : setSelectedTenants([])} checked={selectedTenants.length > 0 && selectedTenants.length === paginatedTenants.length} /></th>
                  {Object.keys(visibleColumns).map(col => visibleColumns[col] && <th key={col} className="px-6 py-4 capitalize font-semibold tracking-wider whitespace-nowrap">{col === 'codigo_visual' ? 'Cód. Clínica' : col.replace(/_/g, ' ')}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {isLoading ? (
                  <tr><td colSpan={15} className="px-6 py-12 text-center text-gray-400"><Loader2 className="w-6 h-6 animate-spin mx-auto mb-2"/>Carregando clínicas...</td></tr>
                ) : paginatedTenants.length === 0 ? (
                  <tr><td colSpan={15} className="px-6 py-12 text-center text-gray-500 font-medium">Nenhuma clínica encontrada.</td></tr>
                ) : paginatedTenants.map((t) => (
                  <tr key={t.id} className={`hover:bg-blue-50/50 transition-colors ${selectedTenants.includes(t.id) ? 'bg-blue-50' : ''}`}>
                    <td className="px-6 py-4"><input type="checkbox" checked={selectedTenants.includes(t.id)} onChange={() => setSelectedTenants(prev => prev.includes(t.id) ? prev.filter(id => id !== t.id) : [...prev, t.id])} /></td>
                    {visibleColumns.codigo_visual && <td className="px-6 py-4 text-blue-700 font-bold font-mono text-sm">#{t.codigo_visual}</td>}
                    {visibleColumns.nome && <td className="px-6 py-4 font-bold text-gray-900 whitespace-nowrap">{t.nome}</td>}
                    {visibleColumns.cnpj && <td className="px-6 py-4 text-gray-600 whitespace-nowrap">{t.cnpj || '-'}</td>}
                    {visibleColumns.dominio_interno && <td className="px-6 py-4 text-gray-600 whitespace-nowrap">{t.dominio_interno}</td>}
                    {visibleColumns.email_contato && <td className="px-6 py-4 text-gray-600 whitespace-nowrap">{t.email_contato || '-'}</td>}
                    {visibleColumns.telefone_contato && <td className="px-6 py-4 text-gray-600 whitespace-nowrap">{t.telefone_contato || '-'}</td>}
                    {visibleColumns.status && (
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold shadow-sm border ${
                          t.status === 'ativo' ? 'bg-green-100 text-green-700 border-green-200' : 
                          t.status === 'phase-in' ? 'bg-blue-100 text-blue-700 border-blue-200' : 
                          t.status === 'phase-out' ? 'bg-orange-100 text-orange-700 border-orange-200' :
                          'bg-red-100 text-red-700 border-red-200'
                        }`}>{t.status?.toUpperCase()}</span>
                      </td>
                    )}
                    {visibleColumns.endereco_cidade && <td className="px-6 py-4 text-gray-600 whitespace-nowrap">{t.endereco_cidade || '-'}</td>}
                    {visibleColumns.endereco_estado && <td className="px-6 py-4 text-gray-600">{t.endereco_estado || '-'}</td>}
                    {visibleColumns.criado_em && <td className="px-6 py-4 text-gray-500 text-xs whitespace-nowrap">{formatDate(t.criado_em)}</td>}
                    {visibleColumns.criado_por && <td className="px-6 py-4 text-gray-500 text-xs whitespace-nowrap">{t.criado_por || '-'}</td>}
                    {visibleColumns.alterado_em && <td className="px-6 py-4 text-gray-500 text-xs whitespace-nowrap">{formatDate(t.alterado_em)}</td>}
                    {visibleColumns.alterado_por && <td className="px-6 py-4 text-gray-500 text-xs whitespace-nowrap">{t.alterado_por || '-'}</td>}
                    {visibleColumns.deletado_em && <td className={`px-6 py-4 text-xs whitespace-nowrap ${t.status === 'inativo' ? 'text-red-500 font-medium' : 'text-gray-400'}`}>{t.status === 'inativo' ? formatDate(t.deletado_em) : '-'}</td>}
                    {visibleColumns.deletado_por && <td className={`px-6 py-4 text-xs whitespace-nowrap ${t.status === 'inativo' ? 'text-red-500 font-medium' : 'text-gray-400'}`}>{t.status === 'inativo' ? (t.deletado_por || 'Sistema') : '-'}</td>}
                  </tr>
                ))}
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
            <div className="font-medium">{filteredTenants.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredTenants.length)} de {filteredTenants.length}</div>
            <div className="flex items-center gap-1">
              <button disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)} className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"><ChevronLeft className="w-5 h-5 text-gray-600" /></button>
              <button disabled={currentPage * itemsPerPage >= filteredTenants.length} onClick={() => setCurrentPage(prev => prev + 1)} className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"><ChevronRight className="w-5 h-5 text-gray-600" /></button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
