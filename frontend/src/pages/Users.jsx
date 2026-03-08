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
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); 
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState({ 
    nome: '', email: '', papel: 'PROFISSIONAL', senha: '', status: 'ATIVO', tenant_id: '',
    cpf: '', telefone: '', endereco_cep: '', endereco_logradouro: '', endereco_numero: '', endereco_bairro: '', endereco_cidade: '', endereco_estado: '', observacoes: ''
  });

  const [isCheckingCEP, setIsCheckingCEP] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedHistoryUser, setSelectedHistoryUser] = useState(null);
  const [userAppointments, setUserAppointments] = useState([]);
  const [historyFilters, setHistoryFilters] = useState({ dataInicio: '', dataFim: '' });

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('medsched_token');
      if (!token) return;
      const decoded = jwtDecode(token);
      const [resUsers, resCust] = await Promise.all([
          api.get('/users/', { params: { tenant_id: decoded.tenant_id } }),
          api.get('/customers/', { params: { tenant_id: decoded.tenant_id } })
      ]);
      setUsers(resUsers.data);
      setCustomers(resCust.data);
      if (modalMode === 'create') setFormData(prev => ({ ...prev, tenant_id: decoded.tenant_id }));
    } catch (err) {
      toast.error("Erro ao carregar dados.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleCEPLookup = async (cep) => {
    const cleanCEP = cep.replace(/\D/g, '');
    setFormData(prev => ({ ...prev, endereco_cep: cleanCEP }));
    if (cleanCEP.length === 8) {
      setIsCheckingCEP(true);
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cleanCEP}/json/`);
        const data = await response.json();
        if (!data.erro) {
          setFormData(prev => ({
            ...prev,
            endereco_logradouro: data.logradouro,
            endereco_bairro: data.bairro,
            endereco_cidade: data.localidade,
            endereco_estado: data.uf
          }));
        }
      } catch (err) {} finally { setIsCheckingCEP(false); }
    }
  };

  const openHistoryModal = async (user) => {
      setSelectedHistoryUser(user);
      setIsHistoryModalOpen(true);
      try {
          const tenantId = jwtDecode(localStorage.getItem('medsched_token')).tenant_id;
          const res = await api.get('/appointments/', { params: { tenant_id: tenantId } });
          const myApps = res.data.filter(app => app.profissional_id === user.id).sort((a,b) => new Date(a.data_hora_inicio) - new Date(b.data_hora_inicio));
          setUserAppointments(myApps);
      } catch (err) { toast.error("Erro."); }
  };

  const handleSaveUser = async (e) => {
    e.preventDefault(); setIsSaving(true);
    try {
      const payload = { ...formData };
      if (modalMode === 'edit') delete payload.senha;
      Object.keys(payload).forEach(key => { if (payload[key] === '') payload[key] = null; });
      if (modalMode === 'create') await api.post('/users/', payload);
      else await api.put(`/users/${selectedUsers[0]}`, payload, { params: { tenant_id: formData.tenant_id } });
      setIsModalOpen(false); fetchUsers();
      toast.success("Usuário salvo!");
    } catch (err) { toast.error("Erro."); } finally { setIsSaving(false); }
  };

  return (
    <Layout>
      <div className="p-8 max-w-7xl mx-auto flex flex-col gap-6">
        <Toaster position="top-right" />

        <Modal isOpen={isHistoryModalOpen} onClose={() => setIsHistoryModalOpen(false)} title={`Agenda: ${selectedHistoryUser?.nome}`}>
            <div className="border rounded-xl overflow-auto max-h-[50vh]">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b uppercase text-[10px] font-bold text-slate-500">
                        <tr><th className="px-4 py-3">Data</th><th className="px-4 py-3">Cliente</th><th className="px-4 py-3">Status</th></tr>
                    </thead>
                    <tbody className="divide-y bg-white">
                        {userAppointments.map(app => (
                            <tr key={app.id}>
                                <td className="px-4 py-3 font-medium">{new Date(app.data_hora_inicio).toLocaleString('pt-BR')}</td>
                                <td className="px-4 py-3">{customers.find(c => c.id === app.customer_id)?.nome}</td>
                                <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold">{app.status}</span></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Modal>

        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={modalMode === 'create' ? "Novo Usuário" : "Editar Usuário"}>
          <form onSubmit={handleSaveUser} className="space-y-6 max-h-[75vh] overflow-y-auto px-1 pb-2">
            <fieldset className="border border-gray-200 p-4 rounded-xl bg-gray-50/50">
              <legend className="text-sm font-bold text-gray-700 px-2 uppercase tracking-wider">Informações Básicas</legend>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                <div className="md:col-span-2"><label className="block text-xs font-bold text-gray-500 mb-1">Nome Completo</label><input required className="w-full px-4 py-2 border rounded-lg" value={formData.nome || ''} onChange={e => setFormData({...formData, nome: e.target.value})} /></div>
                <div><label className="block text-xs font-bold text-gray-500 mb-1">E-mail</label><input required type="email" className="w-full px-4 py-2 border rounded-lg" value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value})} /></div>
                <div><label className="block text-xs font-bold text-gray-500 mb-1">Cargo</label><select className="w-full px-4 py-2 border rounded-lg" value={formData.papel} onChange={e => setFormData({...formData, papel: e.target.value})}><option value="PROFISSIONAL">Profissional</option><option value="TENANT_ADMIN">Administrador</option></select></div>
                {modalMode === 'create' && <div className="md:col-span-2"><label className="block text-xs font-bold text-gray-500 mb-1">Senha</label><input required type="password" minLength={8} className="w-full px-4 py-2 border rounded-lg" value={formData.senha} onChange={e => setFormData({...formData, senha: e.target.value})} /></div>}
              </div>
            </fieldset>

            <fieldset className="border border-gray-200 p-4 rounded-xl bg-blue-50/30">
              <legend className="text-sm font-bold text-blue-700 px-2 uppercase tracking-wider flex items-center gap-2"><MapPin className="w-4 h-4" /> Endereço Profissional</legend>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                <div className="relative">
                    <label className="block text-xs font-bold text-gray-500 mb-1">CEP</label>
                    <input className="w-full px-4 py-2 border border-blue-200 rounded-lg font-bold" placeholder="00000-000" value={formData.endereco_cep || ''} onChange={e => handleCEPLookup(e.target.value)} />
                    {isCheckingCEP && <Loader2 className="w-4 h-4 animate-spin absolute right-3 top-8 text-blue-500" />}
                </div>
                <div className="md:col-span-2"><label className="block text-xs font-bold text-gray-500 mb-1">Logradouro</label><input readOnly className="w-full px-4 py-2 border bg-gray-100 rounded-lg" value={formData.endereco_logradouro || ''} /></div>
                <div><label className="block text-xs font-bold text-gray-500 mb-1">Número</label><input required className="w-full px-4 py-2 border border-blue-400 rounded-lg" value={formData.endereco_numero || ''} onChange={e => setFormData({...formData, endereco_numero: e.target.value})} /></div>
                <div><label className="block text-xs font-bold text-gray-500 mb-1">Bairro</label><input readOnly className="w-full px-4 py-2 border bg-gray-100 rounded-lg" value={formData.endereco_bairro || ''} /></div>
                <div><label className="block text-xs font-bold text-gray-500 mb-1">Cidade</label><input readOnly className="w-full px-4 py-2 border bg-gray-100 rounded-lg" value={formData.endereco_cidade || ''} /></div>
              </div>
            </fieldset>

            <div className="sticky bottom-0 bg-white pt-4 flex gap-3">
              <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-2 border rounded-lg">Cancelar</button>
              <button type="submit" disabled={isSaving || isCheckingCEP} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-bold flex justify-center items-center gap-2">
                {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-4 h-4" />} Salvar
              </button>
            </div>
          </form>
        </Modal>

        <header className="flex justify-between items-center">
            <div><h1 className="text-3xl font-bold text-gray-900">Usuários</h1><p className="text-gray-500">Gestão de equipe e permissões.</p></div>
            <button onClick={() => { setModalMode('create'); setIsModalOpen(true); }} className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2"><Plus className="w-5 h-5" /> Novo Usuário</button>
        </header>

        <div className="bg-white border rounded-xl overflow-hidden">
            <table className="w-full text-left">
                <thead className="bg-gray-50 border-b text-xs uppercase font-bold text-gray-500">
                    <tr><th className="px-6 py-4">Ações</th><th className="px-6 py-4">Nome</th><th className="px-6 py-4">Email</th><th className="px-6 py-4">Papel</th></tr>
                </thead>
                <tbody className="divide-y">
                    {users.map(u => (
                        <tr key={u.id} className="hover:bg-slate-50">
                            <td className="px-6 py-4 flex gap-2">
                                <button onClick={() => openHistoryModal(u)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="Agenda"><CalendarDays className="w-4 h-4" /></button>
                                <button onClick={() => { setSelectedUsers([u.id]); setModalMode('edit'); setIsModalOpen(true); }} className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all" title="Editar"><Edit2 className="w-4 h-4" /></button>
                            </td>
                            <td className="px-6 py-4 font-bold text-gray-900">{u.nome}</td>
                            <td className="px-6 py-4 text-gray-600">{u.email}</td>
                            <td className="px-6 py-4"><span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold">{u.papel}</span></td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </div>
    </Layout>
  );
}
