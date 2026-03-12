import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { jwtDecode } from 'jwt-decode';
import { Toaster, toast } from 'react-hot-toast';
import Layout from '../components/Layout';
import Modal from '../components/Modal';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, CreditCard, Handshake, Plus, Edit2, Trash2, 
  Save, Loader2, AlertCircle, CheckCircle2, Percent, DollarSign, ListOrdered
} from 'lucide-react';

export default function BillingSettings() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('fees'); // 'fees' | 'agreements'
  
  const [fees, setFees] = useState([]);
  const [agreements, setAgreements] = useState([]);
  const [servicesList, setServicesList] = useState([]); // Lista de serviços do sistema
  const [isLoading, setIsLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [isSaving, setIsSaving] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  // 🌟 NOVO: Estados para o Modal de Tabela de Preços
  const [isPriceModalOpen, setIsPriceModalOpen] = useState(false);
  const [selectedAgreementName, setSelectedAgreementName] = useState('');
  const [servicePrices, setServicePrices] = useState({}); // { service_id: valor }

  const [formData, setFormData] = useState({});

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('medsched_token');
      if (!token) return;
      const decoded = jwtDecode(token);
      const tenantId = decoded.tenant_id || localStorage.getItem('selected_tenant_id');

      const [feesRes, agreementsRes, servicesRes] = await Promise.all([
        api.get('/billing/fees', { params: { tenant_id: tenantId } }),
        api.get('/billing/agreements', { params: { tenant_id: tenantId } }),
        api.get('/services/', { params: { tenant_id: tenantId } }) // Busca os serviços
      ]);

      setFees(feesRes.data);
      setAgreements(agreementsRes.data);
      setServicesList(servicesRes.data.filter(s => s.status === 'ativo'));
    } catch (error) {
      toast.error("Erro ao carregar configurações.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleOpenModal = (mode, item = null) => {
    setModalMode(mode);
    setSelectedId(item?.id || null);
    
    let tenantId = '';
    try {
        const decoded = jwtDecode(localStorage.getItem('medsched_token'));
        tenantId = decoded.tenant_id || localStorage.getItem('selected_tenant_id');
    } catch(e) {}

    if (activeTab === 'fees') {
      setFormData(item ? { ...item } : { metodo_pagamento: 'CARTAO_CREDITO', tipo_taxa: 'PERCENTUAL', valor_taxa: 0, repassar_ao_cliente: true, tenant_id: tenantId });
    } else {
      setFormData(item ? { ...item } : { nome: '', ativo: true, tenant_id: tenantId });
    }
    
    setIsModalOpen(true);
  };

  // 🌟 NOVO: Abre a Tabela de Preços da Parceria
  const handleOpenPriceModal = async (agreement) => {
    setSelectedId(agreement.id);
    setSelectedAgreementName(agreement.nome);
    setIsPriceModalOpen(true);
    
    // Busca os preços já salvos para este convênio no backend
    try {
      const response = await api.get(`/billing/agreements/${agreement.id}/prices`);
      const pricesMap = {};
      response.data.forEach(item => {
        pricesMap[item.service_id] = item.valor_acordado;
      });
      setServicePrices(pricesMap);
    } catch (err) {
      toast.error("Erro ao carregar tabela de preços.");
    }
  };

  // 🌟 NOVO: Salva a Tabela de Preços
  const handleSavePrices = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const token = localStorage.getItem('medsched_token');
      const decoded = jwtDecode(token);
      const tenantId = decoded.tenant_id || localStorage.getItem('selected_tenant_id');

      // Formata os dados para o backend (apenas serviços que tiveram o preço preenchido)
      const pricesPayload = Object.keys(servicePrices)
        .filter(serviceId => servicePrices[serviceId] !== '' && servicePrices[serviceId] !== undefined)
        .map(serviceId => ({
          service_id: serviceId,
          valor_acordado: parseFloat(servicePrices[serviceId].toString().replace(',', '.'))
        }));

      await api.post(`/billing/agreements/${selectedId}/prices`, {
        tenant_id: tenantId,
        prices: pricesPayload
      });

      toast.success("Tabela de preços atualizada!");
      setIsPriceModalOpen(false);
    } catch (err) {
      toast.error("Erro ao salvar preços.");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePriceChange = (serviceId, value) => {
    setServicePrices(prev => ({ ...prev, [serviceId]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload = { ...formData };
      const endpoint = activeTab === 'fees' ? '/billing/fees' : '/billing/agreements';
      
      if (activeTab === 'fees') payload.valor_taxa = parseFloat(payload.valor_taxa.toString().replace(',', '.'));

      if (modalMode === 'create') {
        await api.post(endpoint, payload);
        toast.success(activeTab === 'fees' ? "Taxa configurada!" : "Parceria criada!");
      } else {
        await api.put(`${endpoint}/${selectedId}`, payload);
        toast.success("Atualizado com sucesso!");
      }
      setIsModalOpen(false); fetchData();
    } catch (err) {
      const msg = err.response?.data?.detail || "Erro ao salvar.";
      toast.error(typeof msg === 'string' ? msg : "Verifique os dados informados.");
    } finally { setIsSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Tem certeza que deseja remover esta configuração?")) return;
    const toastId = toast.loading("Removendo...");
    try {
      const endpoint = activeTab === 'fees' ? '/billing/fees' : '/billing/agreements';
      await api.delete(`${endpoint}/${id}`);
      toast.success("Removido com sucesso!", { id: toastId });
      fetchData();
    } catch (err) { toast.error("Erro ao remover.", { id: toastId }); }
  };

  const formatMetodo = (metodo) => metodo.replace('_', ' ');

  return (
    <Layout>
      <div className="p-8 max-w-5xl mx-auto flex flex-col gap-6">
        <Toaster position="top-right" />
        
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/configuracoes')} className="p-2 bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors shadow-sm"><ArrowLeft className="w-5 h-5" /></button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Regras de Faturamento</h1>
            <p className="text-gray-500 text-sm mt-1">Configure taxas de maquininhas, boletos e tabela de convênios/parcerias.</p>
          </div>
        </div>

        <div className="flex gap-2 border-b border-gray-200 pb-px">
          <button onClick={() => setActiveTab('fees')} className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'fees' ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-t-lg'} `}><CreditCard className="w-4 h-4" /> Taxas de Pagamento</button>
          <button onClick={() => setActiveTab('agreements')} className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'agreements' ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-t-lg'} `}><Handshake className="w-4 h-4" /> Parcerias e Convênios</button>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <h2 className="font-bold text-gray-700 flex items-center gap-2">{activeTab === 'fees' ? 'Maquininhas e Taxas Bancárias' : 'Lista de Contratos de Parceria'}</h2>
            <button onClick={() => handleOpenModal('create')} className="bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 flex items-center gap-1.5 text-sm font-bold shadow-sm"><Plus className="w-4 h-4" /> {activeTab === 'fees' ? 'Nova Regra de Taxa' : 'Nova Parceria'}</button>
          </div>

          {activeTab === 'fees' && (
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 text-xs uppercase tracking-wider">
                <tr><th className="px-6 py-3">Método de Pagamento</th><th className="px-6 py-3">Custo / Taxa</th><th className="px-6 py-3">Repasse ao Cliente</th><th className="px-6 py-3 text-right">Ações</th></tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isLoading ? <tr><td colSpan={4} className="py-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400" /></td></tr> : 
                 fees.length === 0 ? <tr><td colSpan={4} className="py-8 text-center text-gray-500">Nenhuma taxa configurada.</td></tr> :
                 fees.map(fee => (
                  <tr key={fee.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3 font-bold text-gray-800">{formatMetodo(fee.metodo_pagamento)}</td>
                    <td className="px-6 py-3"><span className="flex items-center gap-1 font-medium text-gray-600">{fee.tipo_taxa === 'PERCENTUAL' ? <Percent className="w-3.5 h-3.5 text-blue-500" /> : <DollarSign className="w-3.5 h-3.5 text-green-500" />}{Number(fee.valor_taxa).toFixed(2)} {fee.tipo_taxa === 'PERCENTUAL' ? '%' : 'Reais'}</span></td>
                    <td className="px-6 py-3">{fee.repassar_ao_cliente ? <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-amber-100 text-amber-700 border border-amber-200"><AlertCircle className="w-3 h-3" /> Cliente Paga</span> : <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-green-100 text-green-700 border border-green-200"><CheckCircle2 className="w-3 h-3" /> Empresa Absorve</span>}</td>
                    <td className="px-6 py-3 text-right">
                      <button onClick={() => handleOpenModal('edit', fee)} className="p-1.5 text-gray-400 hover:text-blue-600 rounded"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(fee.id)} className="p-1.5 text-gray-400 hover:text-red-600 rounded"><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeTab === 'agreements' && (
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 text-xs uppercase tracking-wider">
                <tr><th className="px-6 py-3">Nome da Parceria / Convênio</th><th className="px-6 py-3">Status</th><th className="px-6 py-3 text-right">Ações</th></tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isLoading ? <tr><td colSpan={3} className="py-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400" /></td></tr> : 
                 agreements.length === 0 ? <tr><td colSpan={3} className="py-8 text-center text-gray-500">Nenhum contrato cadastrado.</td></tr> :
                 agreements.map(agr => (
                  <tr key={agr.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3 font-bold text-gray-800">{agr.nome}</td>
                    <td className="px-6 py-3"><span className={`px-2 py-1 rounded text-xs font-bold ${agr.ativo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{agr.ativo ? 'ATIVO' : 'INATIVO'}</span></td>
                    <td className="px-6 py-3 text-right">
                      {/* 🌟 NOVO: Botão para abrir Tabela de Preços Específicos */}
                      <button onClick={() => handleOpenPriceModal(agr)} title="Configurar Tabela de Preços" className="p-1.5 text-gray-400 hover:text-green-600 rounded"><ListOrdered className="w-4 h-4" /></button>
                      <button onClick={() => handleOpenModal('edit', agr)} className="p-1.5 text-gray-400 hover:text-blue-600 rounded"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(agr.id)} className="p-1.5 text-gray-400 hover:text-red-600 rounded"><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* MODAL DE CADASTRO BÁSICO */}
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={activeTab === 'fees' ? (modalMode === 'create' ? "Nova Regra de Taxa" : "Editar Regra") : (modalMode === 'create' ? "Nova Parceria" : "Editar Parceria")}>
          <form onSubmit={handleSave} className="space-y-4 pt-2">
            {activeTab === 'fees' ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Método de Pagamento</label>
                  <select disabled={modalMode === 'edit'} className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none bg-white disabled:bg-gray-100" value={formData.metodo_pagamento || ''} onChange={e => setFormData({...formData, metodo_pagamento: e.target.value})}>
                    <option value="CARTAO_CREDITO">Cartão de Crédito</option><option value="CARTAO_DEBITO">Cartão de Débito</option><option value="BOLETO">Boleto Bancário</option><option value="PIX">Pix</option><option value="DINHEIRO">Dinheiro</option><option value="TRANSFERENCIA">Transferência</option><option value="CONVENIO">Convênio / Parceria</option><option value="OUTRO">Outro</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Natureza da Taxa</label><select className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none bg-white" value={formData.tipo_taxa || ''} onChange={e => setFormData({...formData, tipo_taxa: e.target.value})}><option value="PERCENTUAL">Percentual (%)</option><option value="FIXO">Valor Fixo (R$)</option></select></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Custo</label><input required type="number" step="0.01" min="0" className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" value={formData.valor_taxa === undefined ? '' : formData.valor_taxa} onChange={e => setFormData({...formData, valor_taxa: e.target.value})} /></div>
                </div>
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg mt-2">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input type="checkbox" checked={formData.repassar_ao_cliente || false} onChange={e => setFormData({...formData, repassar_ao_cliente: e.target.checked})} className="mt-1 rounded text-blue-600" />
                    <div><span className="block text-sm font-bold text-blue-900">Repassar custo ao cliente no Agendamento</span><span className="block text-xs text-blue-700 mt-0.5">Se marcado, soma ao preço base. Se desmarcado, a empresa absorve.</span></div>
                  </label>
                </div>
              </>
            ) : (
              <>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Nome da Parceria / Convênio / Contrato</label><input required type="text" placeholder="Ex: Gympass, Porto Seguro..." className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" value={formData.nome || ''} onChange={e => setFormData({...formData, nome: e.target.value})} /></div>
                <div className="pt-2"><label className="flex items-center gap-2 font-medium text-gray-700 cursor-pointer"><input type="checkbox" checked={formData.ativo ?? true} onChange={e => setFormData({...formData, ativo: e.target.checked})} className="rounded text-blue-600" /> Contrato Ativo</label></div>
              </>
            )}
            <div className="border-t border-gray-100 pt-4 mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium">Cancelar</button>
              <button type="submit" disabled={isSaving} className="px-6 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2 font-bold hover:bg-blue-700">{isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Salvar</button>
            </div>
          </form>
        </Modal>

        {/* 🌟 NOVO MODAL: TABELA DE PREÇOS DO CONVÊNIO */}
        <Modal isOpen={isPriceModalOpen} onClose={() => setIsPriceModalOpen(false)} title={`Tabela de Preços: ${selectedAgreementName}`}>
          <form onSubmit={handleSavePrices} className="space-y-4 pt-2 max-h-[70vh] flex flex-col">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-gray-600 mb-2">
              Defina o valor pago por esta parceria para cada serviço. Deixe em branco caso o convênio não cubra o procedimento.
            </div>
            
            <div className="overflow-y-auto border border-gray-200 rounded-lg flex-1">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                  <tr>
                    <th className="px-4 py-2 text-gray-600">Serviço (Base)</th>
                    <th className="px-4 py-2 text-gray-600 w-40 text-right">Valor Especial (R$)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {servicesList.length === 0 ? (
                    <tr><td colSpan={2} className="p-4 text-center text-gray-500">Nenhum serviço ativo encontrado no sistema.</td></tr>
                  ) : (
                    servicesList.map(serv => (
                      <tr key={serv.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <p className="font-bold text-gray-800">{serv.nome}</p>
                          <p className="text-xs text-gray-400">Preço Base: R$ {serv.preco ? Number(serv.preco).toFixed(2) : '0.00'}</p>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <input 
                            type="number" 
                            step="0.01" 
                            min="0"
                            placeholder="R$ 0,00"
                            className="w-full px-3 py-1.5 border border-gray-300 rounded outline-none focus:ring-2 focus:ring-blue-500 text-right font-medium text-blue-700"
                            value={servicePrices[serv.id] !== undefined ? servicePrices[serv.id] : ''}
                            onChange={(e) => handlePriceChange(serv.id, e.target.value)}
                          />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="border-t border-gray-100 pt-4 flex justify-end gap-3">
              <button type="button" onClick={() => setIsPriceModalOpen(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium">Cancelar</button>
              <button type="submit" disabled={isSaving} className="px-6 py-2 bg-green-600 text-white rounded-lg flex items-center gap-2 font-bold hover:bg-green-700">
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Salvar Preços
              </button>
            </div>
          </form>
        </Modal>

      </div>
    </Layout>
  );
}
