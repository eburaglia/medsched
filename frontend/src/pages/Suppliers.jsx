import React, { useEffect, useState, useMemo } from 'react';
import api from '../services/api';
import { jwtDecode } from 'jwt-decode';
import { Toaster, toast } from 'react-hot-toast';
import Modal from '../components/Modal';
import Layout from '../components/Layout';
import { Truck, Plus, Search, Edit2, Trash2, Save, Loader2, MapPin, Phone, Mail, Building } from 'lucide-react';

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); 
  const [isSaving, setIsSaving] = useState(false);
  const [isCheckingCEP, setIsCheckingCEP] = useState(false);

  const [formData, setFormData] = useState({
    id: '', nome_razao: '', nome_fantasia: '', cnpj: '', email: '', telefone: '', contato_nome: '',
    endereco_cep: '', endereco_logradouro: '', endereco_numero: '', endereco_bairro: '', endereco_cidade: '', endereco_estado: '',
    observacoes: '', status: 'ATIVO', tenant_id: ''
  });

  const getActiveTenantId = () => {
    const token = localStorage.getItem('medsched_token');
    if (!token) return null;
    const decoded = jwtDecode(token);
    return decoded.tenant_id || localStorage.getItem('selected_tenant_id');
  };

  const fetchSuppliers = async () => {
    setIsLoading(true);
    try {
      const tenantId = getActiveTenantId();
      if (!tenantId) return;
      const res = await api.get('/suppliers/', { params: { tenant_id: tenantId } });
      setSuppliers(res.data);
    } catch (err) {
      toast.error("Erro ao carregar fornecedores.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchSuppliers(); }, []);

  const handleCEPLookup = async (cep) => {
    const cleanCEP = cep.replace(/\D/g, '');
    setFormData(prev => ({ ...prev, endereco_cep: cleanCEP }));
    if (cleanCEP.length === 8) {
      setIsCheckingCEP(true);
      try {
        const response = await api.get(`/utils/cep/${cleanCEP}`);
        const data = response.data;
        setFormData(prev => ({
          ...prev, endereco_logradouro: data.logradouro || '', endereco_bairro: data.bairro || '',
          endereco_cidade: data.localidade || '', endereco_estado: data.uf || ''
        }));
        toast.success("Endereço localizado com sucesso!");
      } catch (err) { toast.error("CEP não encontrado."); } finally { setIsCheckingCEP(false); }
    }
  };

  const handleOpenCreate = () => {
    setModalMode('create');
    setFormData({
      id: '', nome_razao: '', nome_fantasia: '', cnpj: '', email: '', telefone: '', contato_nome: '',
      endereco_cep: '', endereco_logradouro: '', endereco_numero: '', endereco_bairro: '', endereco_cidade: '', endereco_estado: '',
      observacoes: '', status: 'ATIVO', tenant_id: getActiveTenantId()
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (supplier) => {
    setModalMode('edit');
    setFormData({ ...supplier, tenant_id: getActiveTenantId() });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload = { ...formData };
      if (modalMode === 'create') {
        await api.post('/suppliers/', payload);
        toast.success("Fornecedor registado com sucesso!");
      } else {
        await api.put(`/suppliers/${formData.id}`, payload, { params: { tenant_id: formData.tenant_id } });
        toast.success("Fornecedor atualizado!");
      }
      setIsModalOpen(false);
      fetchSuppliers();
    } catch (err) {
      toast.error("Erro ao guardar dados do fornecedor.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Deseja realmente eliminar este fornecedor?")) return;
    try {
      await api.delete(`/suppliers/${id}`, { params: { tenant_id: getActiveTenantId() } });
      toast.success("Fornecedor eliminado.");
      fetchSuppliers();
    } catch (err) {
      toast.error("Erro ao eliminar fornecedor.");
    }
  };

  const filteredSuppliers = useMemo(() => {
    if (!searchTerm) return suppliers;
    const lower = searchTerm.toLowerCase();
    return suppliers.filter(s => 
      (s.nome_razao && s.nome_razao.toLowerCase().includes(lower)) || 
      (s.nome_fantasia && s.nome_fantasia.toLowerCase().includes(lower)) ||
      (s.cnpj && s.cnpj.includes(lower)) ||
      (s.contato_nome && s.contato_nome.toLowerCase().includes(lower))
    );
  }, [suppliers, searchTerm]);

  return (
    <Layout>
      <div className="p-8 max-w-6xl mx-auto flex flex-col gap-6">
        <Toaster position="top-right" />

        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={modalMode === 'create' ? "Novo Fornecedor" : "Editar Fornecedor"}>
          <form onSubmit={handleSave} className="space-y-5 max-h-[75vh] overflow-y-auto px-1">
            
            <fieldset className="border border-slate-200 p-4 rounded-xl bg-slate-50/50">
              <legend className="text-sm font-bold text-slate-700 px-2 flex items-center gap-2"><Building className="w-4 h-4"/> Dados da Empresa</legend>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-slate-700 mb-1">Razão Social *</label>
                  <input required className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" value={formData.nome_razao || ''} onChange={e => setFormData({...formData, nome_razao: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Nome Fantasia</label>
                  <input className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" value={formData.nome_fantasia || ''} onChange={e => setFormData({...formData, nome_fantasia: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">CNPJ</label>
                  <input className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" placeholder="00.000.000/0000-00" value={formData.cnpj || ''} onChange={e => setFormData({...formData, cnpj: e.target.value})} />
                </div>
                <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-slate-700 mb-1">Status</label>
                    <select className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                        <option value="ATIVO">Ativo</option>
                        <option value="INATIVO">Inativo</option>
                    </select>
                </div>
              </div>
            </fieldset>

            <fieldset className="border border-slate-200 p-4 rounded-xl bg-slate-50/50 mt-4">
              <legend className="text-sm font-bold text-slate-700 px-2 flex items-center gap-2"><Phone className="w-4 h-4"/> Contato de Vendas</legend>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-slate-700 mb-1">Pessoa de Contato (Vendedor)</label>
                  <input className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" placeholder="Ex: João Silva" value={formData.contato_nome || ''} onChange={e => setFormData({...formData, contato_nome: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">E-mail para Cotações</label>
                  <input type="email" className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" placeholder="vendas@fornecedor.com" value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Telefone / WhatsApp</label>
                  <input className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" value={formData.telefone || ''} onChange={e => setFormData({...formData, telefone: e.target.value})} />
                </div>
              </div>
            </fieldset>

            <fieldset className="border border-slate-200 p-4 rounded-xl bg-slate-50/50 mt-4">
              <legend className="text-sm font-bold text-slate-700 px-2 flex items-center gap-2"><MapPin className="w-4 h-4"/> Loradouro</legend>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                <div className="relative md:col-span-1">
                    <label className="block text-xs font-bold text-slate-700 mb-1">CEP</label>
                    <input className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500" value={formData.endereco_cep || ''} onChange={e => handleCEPLookup(e.target.value)} />
                    {isCheckingCEP && <Loader2 className="w-4 h-4 animate-spin absolute right-2 top-7 text-blue-500" />}
                </div>
                <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">Endereço</label>
                    <input className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500" value={formData.endereco_logradouro || ''} onChange={e => setFormData({...formData, endereco_logradouro: e.target.value})} />
                </div>
                <div className="md:col-span-1">
                    <label className="block text-xs font-bold text-slate-700 mb-1">Número</label>
                    <input className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500" value={formData.endereco_numero || ''} onChange={e => setFormData({...formData, endereco_numero: e.target.value})} />
                </div>
                <div className="md:col-span-1">
                    <label className="block text-xs font-bold text-slate-700 mb-1">Bairro</label>
                    <input className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500" value={formData.endereco_bairro || ''} onChange={e => setFormData({...formData, endereco_bairro: e.target.value})} />
                </div>
                <div className="md:col-span-1 grid grid-cols-2 gap-2">
                    <div className="col-span-2"><label className="block text-xs font-bold text-slate-700 mb-1">Cidade/UF</label><div className="flex gap-2"><input className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500" value={formData.endereco_cidade || ''} onChange={e => setFormData({...formData, endereco_cidade: e.target.value})} /><input className="w-16 px-2 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 uppercase text-center" maxLength={2} placeholder="UF" value={formData.endereco_estado || ''} onChange={e => setFormData({...formData, endereco_estado: e.target.value.toUpperCase()})} /></div></div>
                </div>
              </div>
            </fieldset>

            <div className="mt-4">
              <label className="block text-sm font-bold text-slate-700 mb-1">Observações Internas</label>
              <textarea rows={3} className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 resize-none" placeholder="Prazos de entrega, condições de pagamento..." value={formData.observacoes || ''} onChange={e => setFormData({...formData, observacoes: e.target.value})} />
            </div>

            <div className="flex gap-3 pt-4 border-t border-slate-200 mt-4">
              <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-2 border border-slate-300 rounded-lg font-bold text-slate-600 hover:bg-slate-50">Cancelar</button>
              <button type="submit" disabled={isSaving} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg flex justify-center items-center gap-2 font-bold hover:bg-blue-700">
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Salvar Fornecedor
              </button>
            </div>
          </form>
        </Modal>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
              <Truck className="w-8 h-8 text-blue-600" /> Fornecedores
            </h1>
            <p className="text-slate-500 mt-1">Gestão de parceiros e fornecimento para a clínica.</p>
          </div>
          <button onClick={handleOpenCreate} className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold shadow-md hover:bg-blue-700 flex items-center gap-2 transition-all">
            <Plus className="w-5 h-5" /> Novo Fornecedor
          </button>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-200 bg-slate-50">
            <div className="relative max-w-md">
              <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="text" placeholder="Pesquisar fornecedor..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-white border-b border-slate-200 text-slate-500 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-6 py-4 font-bold">Empresa / Razão Social</th>
                  <th className="px-6 py-4 font-bold">Contacto</th>
                  <th className="px-6 py-4 font-bold text-center">Status</th>
                  <th className="px-6 py-4 font-bold text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr><td colSpan="4" className="text-center py-12"><Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto" /></td></tr>
                ) : filteredSuppliers.length === 0 ? (
                  <tr><td colSpan="4" className="text-center py-12 text-slate-500 font-medium">Nenhum fornecedor encontrado.</td></tr>
                ) : (
                  filteredSuppliers.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-900">{s.nome_fantasia || s.nome_razao}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{s.cnpj ? `CNPJ: ${s.cnpj}` : ''}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-semibold text-slate-700">{s.contato_nome || 'Não informado'}</p>
                        <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                            {s.telefone && <span className="flex items-center gap-1"><Phone className="w-3 h-3"/> {s.telefone}</span>}
                            {s.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3"/> {s.email}</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${s.status === 'ATIVO' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {s.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleOpenEdit(s)} className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(s.id)} className="p-1.5 text-red-600 hover:bg-red-100 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}
