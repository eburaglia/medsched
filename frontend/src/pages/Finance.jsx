import React, { useEffect, useState, useMemo } from 'react';
import api from '../services/api';
import { jwtDecode } from 'jwt-decode';
import { Toaster, toast } from 'react-hot-toast';
import Modal from '../components/Modal';
import Layout from '../components/Layout';
import { 
  Plus, Loader2, AlertCircle, Search, Download, Edit2, Trash2, 
  Settings2, Clock, Save, Filter, X, Layers, Activity, 
  ChevronLeft, ChevronRight, Info, Ban, DollarSign, Calendar
} from 'lucide-react';

export default function Finance() {
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [showPerfDetails, setShowPerfDetails] = useState(false);
  const [perfMetrics, setPerfMetrics] = useState({ network: 0, server: 0, browser: 0, api: 0, total: 0 });

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItems, setSelectedItems] = useState([]);
  const [showColumnMenu, setShowColumnMenu] = useState(false);
  
  const [showFilters, setShowFilters] = useState(false);
  const [queryBuilder, setQueryBuilder] = useState({ rootLogic: 'AND', groups: [] });
  
  // 🌟 NOVO: Estado para o filtro rápido de período
  const [periodFilter, setPeriodFilter] = useState('mes'); 

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); 
  const [isSaving, setIsSaving] = useState(false);
  
  const [batchToggles, setBatchToggles] = useState({ status: false, tipo: false, metodo_pagamento: false });

  const [formData, setFormData] = useState({ 
    descricao: '', valor: '', tipo: 'RECEITA', status: 'PAGO', 
    metodo_pagamento: 'PIX', data_vencimento: new Date().toISOString().split('T')[0],
    data_pagamento: new Date().toISOString().split('T')[0], tenant_id: ''
  });

  const [editingAuditData, setEditingAuditData] = useState(null);

  const [visibleColumns, setVisibleColumns] = useState({ 
    id: false,
    data_vencimento: true, descricao: true, tipo: true, status: true, 
    metodo_pagamento: true, valor: true, data_pagamento: false,
    criado_em: false, alterado_em: false
  });
  
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchData = async () => {
    const startTime = performance.now();
    try {
      const token = localStorage.getItem('medsched_token');
      if (!token) return;
      const decoded = jwtDecode(token);
      const tenantId = decoded.tenant_id || localStorage.getItem('selected_tenant_id');
      
      const response = await api.get('/finance/', { params: { tenant_id: tenantId } });
      const endTime = performance.now(); 
      
      setTransactions(response.data);
      if (modalMode === 'create') setFormData(prev => ({ ...prev, tenant_id: tenantId }));
      
      requestAnimationFrame(() => {
        const renderTime = performance.now();
        const apiTotal = Math.round(endTime - startTime);
        const serverEstimate = Math.round(apiTotal * 0.35);
        const networkEstimate = apiTotal - serverEstimate;
        const browserEstimate = Math.round(renderTime - endTime);
        
        setPerfMetrics({
          server: serverEstimate, network: networkEstimate, browser: browserEstimate,
          api: apiTotal, total: apiTotal + browserEstimate
        });
      });
    } catch (err) {
      setError("Falha ao carregar dados financeiros.");
      toast.error("Erro ao buscar transações");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    setCurrentPage(1);
    setSelectedItems([]); 
  }, [searchTerm, queryBuilder, periodFilter, itemsPerPage]);

  const filteredTransactions = useMemo(() => {
    let result = transactions;

    // 🌟 LÓGICA DO FILTRO RÁPIDO DE DATAS
    if (periodFilter !== 'tudo') {
      const getLocalYYYYMMDD = (d) => {
        const tzOffset = d.getTimezoneOffset() * 60000;
        return new Date(d.getTime() - tzOffset).toISOString().split('T')[0];
      };
      const now = new Date();
      const todayLocal = getLocalYYYYMMDD(now);
      
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      const startOfWeekStr = getLocalYYYYMMDD(startOfWeek);
      
      const endOfWeek = new Date(now);
      endOfWeek.setDate(now.getDate() + (6 - now.getDay()));
      const endOfWeekStr = getLocalYYYYMMDD(endOfWeek);

      const startOfMonthStr = `${todayLocal.substring(0, 8)}01`;
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      const endOfMonthStr = getLocalYYYYMMDD(endOfMonth);

      result = result.filter(t => {
        const itemDate = t.data_vencimento ? t.data_vencimento.substring(0, 10) : '';
        if (!itemDate) return false;

        if (periodFilter === 'hoje') return itemDate === todayLocal;
        if (periodFilter === 'semana') return itemDate >= startOfWeekStr && itemDate <= endOfWeekStr;
        if (periodFilter === 'mes') return itemDate >= startOfMonthStr && itemDate <= endOfMonthStr;
        return true;
      });
    }

    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter(t => 
        (t.descricao && t.descricao.toLowerCase().includes(lowerSearch)) || 
        (t.id && t.id.toLowerCase().includes(lowerSearch))
      );
    }
    const activeGroups = queryBuilder.groups.filter(g => g.rules.some(r => r.column && r.operator && r.value !== ''));
    if (activeGroups.length > 0) {
      result = result.filter(t => {
        const checkRule = (r) => {
          if (!r.column || !r.operator || r.value === '') return true;
          const isNumeric = ['valor'].includes(r.column);
          const isDate = ['data_vencimento', 'data_pagamento', 'criado_em'].includes(r.column);

          if (isNumeric) {
            const userValue = Number(t[r.column]) || 0;
            const filterValue = Number(r.value) || 0;
            switch (r.operator) {
              case 'equals': return userValue === filterValue;
              case 'greater_than': return userValue > filterValue;
              case 'less_than': return userValue < filterValue;
              case 'greater_equals': return userValue >= filterValue;
              case 'less_equals': return userValue <= filterValue;
              default: return true;
            }
          } else if (isDate) {
              const userDate = t[r.column] ? t[r.column].substring(0, 10) : '';
              switch (r.operator) {
                case 'equals': return userDate === r.value;
                case 'greater_than': return userDate > r.value;
                case 'less_than': return userDate < r.value;
                default: return true;
              }
          } else {
            const userValue = String(t[r.column] || '').toLowerCase();
            const filterValue = String(r.value).toLowerCase();
            switch (r.operator) {
              case 'contains': return userValue.includes(filterValue);
              case 'equals': return userValue === filterValue;
              case 'starts_with': return userValue.startsWith(filterValue);
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
  }, [transactions, searchTerm, queryBuilder, periodFilter]);

  const totais = useMemo(() => {
    let receitas = 0;
    let despesas = 0;
    filteredTransactions.forEach(t => {
      if (t.status === 'PAGO') {
        if (t.tipo === 'RECEITA') receitas += Number(t.valor);
        if (t.tipo === 'DESPESA') despesas += Number(t.valor);
      }
    });
    return { receitas, despesas, saldo: receitas - despesas };
  }, [filteredTransactions]);

  const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredTransactions.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredTransactions, currentPage, itemsPerPage]);

  const addGroup = () => setQueryBuilder(prev => ({ ...prev, groups: [...prev.groups, { id: Date.now(), logic: 'OR', rules: [{ id: Date.now() + 1, column: 'descricao', operator: 'contains', value: '' }] }] }));
  const removeGroup = (groupId) => setQueryBuilder(prev => ({ ...prev, groups: prev.groups.filter(g => g.id !== groupId) }));
  const updateGroupLogic = (groupId, logic) => setQueryBuilder(prev => ({ ...prev, groups: prev.groups.map(g => g.id === groupId ? { ...g, logic } : g) }));
  const addRule = (groupId) => setQueryBuilder(prev => ({ ...prev, groups: prev.groups.map(g => g.id === groupId ? { ...g, rules: [...g.rules, { id: Date.now(), column: 'descricao', operator: 'contains', value: '' }] } : g) }));
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
              if (r.id === ruleId) return { ...r, column: newCol, operator: 'equals', value: '' };
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
    const dataToExport = selectedItems.length > 0 ? transactions.filter(t => selectedItems.includes(t.id)) : filteredTransactions;
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
    link.download = `medsched_financeiro.csv`;
    link.click();
    toast.success(`${dataToExport.length} registros exportados!`);
  };

  const handleOpenCreate = () => { 
    setModalMode('create'); 
    setEditingAuditData(null);
    
    let tenantId = '';
    try {
        const decoded = jwtDecode(localStorage.getItem('medsched_token'));
        tenantId = decoded.tenant_id || localStorage.getItem('selected_tenant_id');
    }catch(e){}

    setFormData({ 
      descricao: '', valor: '', tipo: 'RECEITA', status: 'PAGO', 
      metodo_pagamento: 'PIX', data_vencimento: new Date().toISOString().split('T')[0],
      data_pagamento: new Date().toISOString().split('T')[0], tenant_id: tenantId
    }); 
    setIsModalOpen(true); 
  };

  const handleOpenEdit = () => {
    if (selectedItems.length === 1) {
      const itemToEdit = transactions.find(t => t.id === selectedItems[0]);
      setFormData({ 
        descricao: itemToEdit.descricao || '', 
        valor: itemToEdit.valor || '', 
        tipo: itemToEdit.tipo || 'RECEITA', 
        status: itemToEdit.status || 'PAGO', 
        metodo_pagamento: itemToEdit.metodo_pagamento || 'PIX',
        data_vencimento: itemToEdit.data_vencimento ? itemToEdit.data_vencimento.substring(0, 10) : '',
        data_pagamento: itemToEdit.data_pagamento ? itemToEdit.data_pagamento.substring(0, 10) : '',
        tenant_id: itemToEdit.tenant_id
      });
      setEditingAuditData({
        id: itemToEdit.id,
        criado_em: itemToEdit.criado_em,
        alterado_em: itemToEdit.alterado_em
      });
      setModalMode('edit'); setIsModalOpen(true);
    } else if (selectedItems.length > 1) {
      setModalMode('batch-edit'); setBatchToggles({ status: false, tipo: false, metodo_pagamento: false }); 
      handleOpenCreate(); 
      setModalMode('batch-edit'); 
    }
  };

  const handleSaveTransaction = async (e) => {
    e.preventDefault(); setIsSaving(true);
    try {
      const payload = { ...formData };
      payload.valor = parseFloat(payload.valor.toString().replace(',', '.'));
      if (!payload.data_pagamento) payload.data_pagamento = null;

      if (modalMode === 'create') { 
        await api.post('/finance/', payload); 
        toast.success("Transação salva com sucesso!"); 
      } 
      else if (modalMode === 'edit') { 
        await api.put(`/finance/${selectedItems[0]}`, payload, { params: { tenant_id: formData.tenant_id } }); 
        toast.success("Transação atualizada!"); 
        setSelectedItems([]); 
      } 
      else if (modalMode === 'batch-edit') {
        const batchPayload = {}; 
        if (batchToggles.status) batchPayload.status = formData.status; 
        if (batchToggles.tipo) batchPayload.tipo = formData.tipo;
        if (batchToggles.metodo_pagamento) batchPayload.metodo_pagamento = formData.metodo_pagamento;

        if (Object.keys(batchPayload).length === 0) { toast.error("Selecione um campo para alterar."); setIsSaving(false); return; }
        
        const loadingToast = toast.loading(`Atualizando ${selectedItems.length} registros...`);
        for (const itemId of selectedItems) { await api.put(`/finance/${itemId}`, batchPayload, { params: { tenant_id: formData.tenant_id } }); }
        toast.success("Edição em lote concluída!", { id: loadingToast }); setSelectedItems([]);
      }
      setIsModalOpen(false); fetchData(); 
    } catch (err) { 
      const errorMsg = err.response?.data?.detail || "Erro ao salvar transação.";
      toast.error(typeof errorMsg === 'string' ? errorMsg : "Erro nos campos"); 
    } finally { setIsSaving(false); }
  };

  const handleQuickDelete = async () => {
    const count = selectedItems.length;
    if (count === 0) return;
    if (!window.confirm(`ATENÇÃO: Deseja EXCLUIR DEFINITIVAMENTE ${count} transação(ões)? Esta ação não pode ser desfeita.`)) return;
    const loadingToast = toast.loading("Excluindo...");
    try {
      for (const itemId of selectedItems) {
        await api.delete(`/finance/${itemId}`);
      }
      toast.success("Exclusão concluída.", { id: loadingToast });
      setSelectedItems([]);
      fetchData();
    } catch (err) { toast.error("Erro na exclusão.", { id: loadingToast }); }
  };

  const toggleColumn = (colName) => setVisibleColumns(prev => ({ ...prev, [colName]: !prev[colName] }));
  const totalActiveRules = queryBuilder.groups.reduce((acc, g) => acc + g.rules.filter(r => r.value).length, 0);

  const formatDate = (isoString) => {
    if(!isoString) return '-';
    const dateParts = isoString.substring(0, 10).split('-');
    if(dateParts.length === 3) return `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;
    return new Date(isoString).toLocaleString('pt-BR');
  };
  const formatMoney = (value) => value ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value) : '-';

  return (
    <Layout>
      <div className="p-8 max-w-7xl mx-auto flex flex-col gap-6">
        <Toaster position="top-right" />

        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={modalMode === 'create' ? "Nova Transação" : modalMode === 'edit' ? "Editar Transação" : "Edição em Lote"}>
          <form onSubmit={handleSaveTransaction} className="space-y-6 max-h-[75vh] overflow-y-auto px-1 pb-2">
            
            {modalMode === 'batch-edit' && (
              <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg text-sm text-blue-800 flex items-start gap-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <p>Você está editando <strong>{selectedItems.length} transações</strong> simultaneamente. Marque apenas os campos que deseja sobrescrever.</p>
              </div>
            )}

            {modalMode !== 'batch-edit' && (
              <fieldset className="border border-gray-200 p-4 rounded-xl bg-gray-50/50">
                <legend className="text-sm font-bold text-gray-700 px-2 uppercase tracking-wider">Dados da Transação</legend>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                    <input required className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" placeholder="Ex: Pagamento Consulta Dr. João" value={formData.descricao} onChange={e => setFormData({...formData, descricao: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Valor (R$)</label>
                    <input required type="number" step="0.01" className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" placeholder="0.00" value={formData.valor} onChange={e => setFormData({...formData, valor: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Data de Vencimento</label>
                    <input required type="date" className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" value={formData.data_vencimento} onChange={e => setFormData({...formData, data_vencimento: e.target.value, data_pagamento: e.target.value})} />
                  </div>
                </div>
              </fieldset>
            )}

            <fieldset className="border border-gray-200 p-4 rounded-xl bg-gray-50/50">
              <legend className="text-sm font-bold text-gray-700 px-2 uppercase tracking-wider">Classificação e Status</legend>
              <div className="flex flex-col gap-4 mt-2">
                
                <div className={`p-3 rounded-lg border w-full ${modalMode === 'batch-edit' && !batchToggles.tipo ? 'bg-gray-100 border-gray-200' : 'bg-white border-gray-300'}`}>
                  {modalMode === 'batch-edit' ? <label className="flex items-center gap-2 mb-2 font-semibold text-gray-700 cursor-pointer"><input type="checkbox" checked={batchToggles.tipo} onChange={e => setBatchToggles({...batchToggles, tipo: e.target.checked})} className="rounded text-blue-600" />Tipo</label> : <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Transação</label>}
                  <select disabled={modalMode === 'batch-edit' && !batchToggles.tipo} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none bg-white disabled:bg-gray-50" value={formData.tipo} onChange={e => setFormData({...formData, tipo: e.target.value})}>
                    <option value="RECEITA">Receita (Entrada)</option>
                    <option value="DESPESA">Despesa (Saída)</option>
                  </select>
                </div>

                <div className={`p-3 rounded-lg border w-full ${modalMode === 'batch-edit' && !batchToggles.status ? 'bg-gray-100 border-gray-200' : 'bg-white border-gray-300'}`}>
                  {modalMode === 'batch-edit' ? <label className="flex items-center gap-2 mb-2 font-semibold text-gray-700 cursor-pointer"><input type="checkbox" checked={batchToggles.status} onChange={e => setBatchToggles({...batchToggles, status: e.target.checked})} className="rounded text-blue-600" />Status</label> : <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>}
                  <select disabled={modalMode === 'batch-edit' && !batchToggles.status} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none bg-white disabled:bg-gray-50" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                    <option value="PAGO">Pago</option>
                    <option value="PENDENTE">Pendente</option>
                    <option value="ATRASADO">Atrasado</option>
                    <option value="CANCELADO">Cancelado</option>
                  </select>
                </div>

                <div className={`p-3 rounded-lg border w-full ${modalMode === 'batch-edit' && !batchToggles.metodo_pagamento ? 'bg-gray-100 border-gray-200' : 'bg-white border-gray-300'}`}>
                  {modalMode === 'batch-edit' ? <label className="flex items-center gap-2 mb-2 font-semibold text-gray-700 cursor-pointer"><input type="checkbox" checked={batchToggles.metodo_pagamento} onChange={e => setBatchToggles({...batchToggles, metodo_pagamento: e.target.checked})} className="rounded text-blue-600" />Forma Pagto.</label> : <label className="block text-sm font-medium text-gray-700 mb-1">Forma de Pagto.</label>}
                  <select disabled={modalMode === 'batch-edit' && !batchToggles.metodo_pagamento} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none bg-white disabled:bg-gray-50" value={formData.metodo_pagamento} onChange={e => setFormData({...formData, metodo_pagamento: e.target.value})}>
                    <option value="PIX">Pix</option>
                    <option value="DINHEIRO">Dinheiro</option>
                    <option value="CARTAO_CREDITO">Cartão de Crédito</option>
                    <option value="CARTAO_DEBITO">Cartão de Débito</option>
                    <option value="TRANSFERENCIA">Transferência</option>
                    <option value="BOLETO">Boleto</option>
                    <option value="CONVENIO">Convênio</option>
                    <option value="OUTRO">Outro</option>
                  </select>
                </div>

              </div>
              
              {modalMode !== 'batch-edit' && formData.status === 'PAGO' && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Data em que foi pago/recebido</label>
                    <input type="date" className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" value={formData.data_pagamento || ''} onChange={e => setFormData({...formData, data_pagamento: e.target.value})} />
                </div>
              )}
            </fieldset>

            {modalMode === 'edit' && editingAuditData && (
              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="flex items-center gap-2 text-gray-500 mb-3"><Info className="w-4 h-4" /><span className="text-xs font-bold uppercase tracking-wider">Auditoria do Registro</span></div>
                <div className="grid grid-cols-2 gap-y-2 text-xs text-gray-500 bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <div><span className="font-semibold">ID no Banco:</span> {editingAuditData.id}</div>
                  <div><span className="font-semibold">Criado em:</span> {formatDate(editingAuditData.criado_em)}</div>
                  <div className="col-span-2"><span className="font-semibold">Última alteração:</span> {formatDate(editingAuditData.alterado_em)}</div>
                </div>
              </div>
            )}

            <div className="sticky bottom-0 bg-white pt-4 pb-2 border-t mt-4 border-gray-100 flex gap-3 z-10">
              <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors">Cancelar</button>
              <button type="submit" disabled={isSaving} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg flex justify-center items-center gap-2 font-bold hover:bg-blue-700 transition-colors">
                {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-4 h-4" />} 
                {modalMode === 'create' ? 'Salvar Lançamento' : modalMode === 'edit' ? 'Salvar Alterações' : 'Aplicar em Lote'}
              </button>
            </div>
          </form>
        </Modal>

        {/* 🌟 CABEÇALHO COM OS BOTÕES DE FILTRO RÁPIDO */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 mb-2">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Fluxo de Caixa</h1>
            <p className="text-gray-500 mt-1">Controle de receitas, despesas, contas a pagar e a receber.</p>
          </div>
          <div className="flex items-center gap-1 bg-gray-200/60 p-1.5 rounded-xl border border-gray-200/50 shadow-inner">
            <button onClick={() => setPeriodFilter('hoje')} className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${periodFilter === 'hoje' ? 'bg-white text-blue-700 shadow border border-gray-200' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/50'}`}>
              <Calendar className="w-3.5 h-3.5" /> Hoje
            </button>
            <button onClick={() => setPeriodFilter('semana')} className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${periodFilter === 'semana' ? 'bg-white text-blue-700 shadow border border-gray-200' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/50'}`}>
              <Calendar className="w-3.5 h-3.5" /> Semana
            </button>
            <button onClick={() => setPeriodFilter('mes')} className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${periodFilter === 'mes' ? 'bg-white text-blue-700 shadow border border-gray-200' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/50'}`}>
              <Calendar className="w-3.5 h-3.5" /> Mês
            </button>
            <button onClick={() => setPeriodFilter('tudo')} className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${periodFilter === 'tudo' ? 'bg-white text-blue-700 shadow border border-gray-200' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/50'}`}>
              <Filter className="w-3.5 h-3.5" /> Outro
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-green-500 relative overflow-hidden">
            <DollarSign className="absolute right-4 top-6 w-12 h-12 text-green-100 opacity-50" />
            <p className="text-sm text-gray-500 font-bold mb-1 uppercase tracking-wider">Receitas (Pagas)</p>
            <p className="text-3xl font-black text-gray-800">{formatMoney(totais.receitas)}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-red-500 relative overflow-hidden">
            <DollarSign className="absolute right-4 top-6 w-12 h-12 text-red-100 opacity-50" />
            <p className="text-sm text-gray-500 font-bold mb-1 uppercase tracking-wider">Despesas (Pagas)</p>
            <p className="text-3xl font-black text-gray-800">{formatMoney(totais.despesas)}</p>
          </div>
          <div className={`bg-white p-6 rounded-xl shadow-sm border border-gray-100 border-l-4 relative overflow-hidden ${totais.saldo >= 0 ? 'border-l-blue-500' : 'border-l-red-600'}`}>
            <Activity className={`absolute right-4 top-6 w-12 h-12 opacity-30 ${totais.saldo >= 0 ? 'text-blue-200' : 'text-red-200'}`} />
            <p className="text-sm text-gray-500 font-bold mb-1 uppercase tracking-wider">Saldo do Período</p>
            <p className={`text-3xl font-black ${totais.saldo >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
              {formatMoney(totais.saldo)}
            </p>
          </div>
        </div>

        <div className="flex flex-col">
          <div className={`bg-white p-4 rounded-t-xl shadow-sm border border-gray-200 flex gap-4 items-center justify-between ${showFilters ? 'border-b-0 rounded-b-none' : ''}`}>
            <div className="relative flex-1 max-w-md flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input type="text" placeholder="Pesquisa rápida (Descrição, ID)..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm" />
              </div>
              <button onClick={() => { setShowFilters(!showFilters); if(!showFilters && queryBuilder.groups.length === 0) addGroup(); setPeriodFilter('tudo'); }} className={`p-2 rounded-lg border transition-colors flex items-center gap-2 ${showFilters || totalActiveRules > 0 ? 'bg-blue-50 border-blue-200 text-blue-700' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
                <Filter className="w-5 h-5" />
                {totalActiveRules > 0 && <span className="bg-blue-600 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">{totalActiveRules}</span>}
              </button>
            </div>

            <div className="flex items-center gap-2">
              {selectedItems.length > 0 && (
                <div className="flex items-center gap-2 mr-2 pr-4 border-r border-gray-200 animate-in fade-in">
                  <span className="text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1.5 rounded-md">{selectedItems.length}</span>
                  <button onClick={handleOpenEdit} className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg" title="Editar"><Edit2 className="w-5 h-5" /></button>
                  <button onClick={handleQuickDelete} className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg" title="Excluir"><Trash2 className="w-5 h-5" /></button>
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
                <button onClick={handleOpenCreate} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 font-medium shadow-sm"><Plus className="w-5 h-5" /> Nova Transação</button>
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
                        const isNumericCol = ['valor'].includes(rule.column);
                        const isDateCol = ['data_vencimento', 'data_pagamento', 'criado_em'].includes(rule.column);
                        const isSelectCol = ['tipo', 'status', 'metodo_pagamento'].includes(rule.column);
                        
                        return (
                          <div key={rule.id} className="flex gap-3 items-center">
                            <span className="text-xs font-bold text-blue-400 w-8 text-center">{ruleIndex === 0 ? '►' : group.logic === 'AND' ? 'E' : 'OU'}</span>
                            
                            <select className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-white" value={rule.column} onChange={e => updateRuleColumn(group.id, rule.id, e.target.value)}>
                              {Object.keys(visibleColumns).map(col => (<option key={col} value={col}>{col === 'id' ? 'ID' : col.replace(/_/g, ' ')}</option>))}
                            </select>
                            
                            <select className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-white" value={rule.operator} onChange={e => updateRule(group.id, rule.id, 'operator', e.target.value)}>
                              {isNumericCol || isDateCol ? (
                                <>
                                  <option value="equals">É igual a</option>
                                  <option value="greater_than">Maior que (&gt;)</option>
                                  <option value="less_than">Menor que (&lt;)</option>
                                  {isNumericCol && <><option value="greater_equals">Maior/igual (&gt;=)</option><option value="less_equals">Menor/igual (&lt;=)</option></>}
                                </>
                              ) : (
                                <>
                                  <option value="contains">Contém</option>
                                  <option value="equals">É exatamente</option>
                                </>
                              )}
                            </select>
                            
                            {isSelectCol ? (
                              <select className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-white" value={rule.value} onChange={e => updateRule(group.id, rule.id, 'value', e.target.value)}>
                                <option value="">Selecione...</option>
                                {rule.column === 'tipo' && <><option value="RECEITA">Receita</option><option value="DESPESA">Despesa</option></>}
                                {rule.column === 'status' && <><option value="PAGO">Pago</option><option value="PENDENTE">Pendente</option><option value="ATRASADO">Atrasado</option><option value="CANCELADO">Cancelado</option></>}
                                {rule.column === 'metodo_pagamento' && <><option value="PIX">Pix</option><option value="DINHEIRO">Dinheiro</option><option value="CARTAO_CREDITO">Cartão de Crédito</option><option value="CARTAO_DEBITO">Cartão de Débito</option><option value="TRANSFERENCIA">Transferência</option><option value="BOLETO">Boleto</option><option value="CONVENIO">Convênio</option><option value="OUTRO">Outro</option></>}
                              </select>
                            ) : isDateCol ? (
                              <input type="date" className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" value={rule.value} onChange={e => updateRule(group.id, rule.id, 'value', e.target.value)} />
                            ) : (
                              <input type={isNumericCol ? "number" : "text"} step={isNumericCol ? "0.01" : undefined} className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" placeholder="Digite o valor..." value={rule.value} onChange={e => updateRule(group.id, rule.id, 'value', e.target.value)} />
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
            {isLoading ? (
              <div className="flex justify-center items-center p-12 text-gray-500"><Loader2 className="w-8 h-8 animate-spin" /></div>
            ) : (
              <table className="w-full text-left min-w-[1000px]">
                <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 text-sm uppercase sticky top-0 z-0">
                  <tr>
                    <th className="px-6 py-4 w-12"><input type="checkbox" onChange={e => e.target.checked ? setSelectedItems(paginatedTransactions.map(s => s.id)) : setSelectedItems([])} checked={selectedItems.length > 0 && selectedItems.length === paginatedTransactions.length} /></th>
                    {Object.keys(visibleColumns).map(col => visibleColumns[col] && <th key={col} className="px-6 py-4 capitalize font-semibold tracking-wider whitespace-nowrap">{col === 'id' ? 'ID' : col.replace(/_/g, ' ')}</th>)}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {paginatedTransactions.length === 0 ? (
                     <tr><td colSpan={15} className="px-6 py-12 text-center text-gray-500 font-medium">Nenhum registro financeiro encontrado.</td></tr>
                  ) : (
                    paginatedTransactions.map((t) => (
                      <tr key={t.id} className={`hover:bg-blue-50/50 transition-colors ${selectedItems.includes(t.id) ? 'bg-blue-50' : ''}`}>
                        <td className="px-6 py-4"><input type="checkbox" checked={selectedItems.includes(t.id)} onChange={() => setSelectedItems(prev => prev.includes(t.id) ? prev.filter(id => id !== t.id) : [...prev, t.id])} /></td>
                        {visibleColumns.id && <td className="px-6 py-4 text-gray-400 font-mono text-xs">{t.id}</td>}
                        
                        {visibleColumns.data_vencimento && <td className="px-6 py-4 text-gray-700 whitespace-nowrap">{formatDate(t.data_vencimento)}</td>}
                        {visibleColumns.descricao && <td className="px-6 py-4 font-bold text-gray-900">{t.descricao}</td>}
                        
                        {visibleColumns.tipo && (
                          <td className="px-6 py-4">
                            <span className={`px-2 py-0.5 rounded text-xs font-bold ${t.tipo === 'RECEITA' ? 'text-green-700 bg-green-100' : 'text-red-700 bg-red-100'}`}>{t.tipo}</span>
                          </td>
                        )}
                        
                        {visibleColumns.status && (
                          <td className="px-6 py-4">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold shadow-sm border ${
                              t.status === 'PAGO' ? 'bg-blue-100 text-blue-700 border-blue-200' : 
                              t.status === 'PENDENTE' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' : 
                              'bg-gray-100 text-gray-700 border-gray-200'
                            }`}>{t.status}</span>
                          </td>
                        )}

                        {visibleColumns.metodo_pagamento && <td className="px-6 py-4 text-gray-600 text-sm whitespace-nowrap">{t.metodo_pagamento ? t.metodo_pagamento.replace('_', ' ') : '-'}</td>}
                        
                        {visibleColumns.valor && <td className={`px-6 py-4 font-bold whitespace-nowrap ${t.tipo === 'RECEITA' ? 'text-green-600' : 'text-red-600'}`}>{t.tipo === 'DESPESA' ? '- ' : '+ '}{formatMoney(t.valor)}</td>}
                        
                        {visibleColumns.data_pagamento && <td className="px-6 py-4 text-gray-500 text-sm whitespace-nowrap">{formatDate(t.data_pagamento)}</td>}
                        {visibleColumns.criado_em && <td className="px-6 py-4 text-gray-500 text-xs whitespace-nowrap">{formatDate(t.criado_em)}</td>}
                        {visibleColumns.alterado_em && <td className="px-6 py-4 text-gray-500 text-xs whitespace-nowrap">{formatDate(t.alterado_em)}</td>}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
        
        {/* FOOTER METRICS AND PAGINATION */}
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
            <div className="font-medium">{filteredTransactions.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredTransactions.length)} de {filteredTransactions.length}</div>
            <div className="flex items-center gap-1">
              <button disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)} className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"><ChevronLeft className="w-5 h-5 text-gray-600" /></button>
              <button disabled={currentPage * itemsPerPage >= filteredTransactions.length} onClick={() => setCurrentPage(prev => prev + 1)} className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"><ChevronRight className="w-5 h-5 text-gray-600" /></button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
