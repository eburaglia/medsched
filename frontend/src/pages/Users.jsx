import React, { useEffect, useState, useMemo } from 'react';
import api from '../services/api';
import { jwtDecode } from 'jwt-decode';
import { Toaster, toast } from 'react-hot-toast';
import Modal from '../components/Modal';
import { 
  UserPlus, Mail, Shield, UserCheck, Loader2, AlertCircle, 
  Search, Download, Edit2, Trash2, Settings2, UploadCloud, Clock, Save, UserX
} from 'lucide-react';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [apiPing, setApiPing] = useState(0);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [showColumnMenu, setShowColumnMenu] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); 
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    nome: '', email: '', papel: 'PROFISSIONAL', senha: '', status: 'ATIVO', tenant_id: ''
  });

  const [visibleColumns, setVisibleColumns] = useState({ nome: true, email: true, role: true, status: true });
  const [currentUserId, setCurrentUserId] = useState(null);

  const fetchUsers = async () => {
    const startTime = performance.now();
    try {
      const token = localStorage.getItem('medsched_token');
      if (!token) return;
      const decoded = jwtDecode(token);
      setCurrentUserId(decoded.sub);
      
      const response = await api.get('/users/', { params: { tenant_id: decoded.tenant_id } });
      setUsers(response.data);
      if (modalMode === 'create') setFormData(prev => ({ ...prev, tenant_id: decoded.tenant_id }));
    } catch (err) {
      setError("Falha ao carregar usuários.");
    } finally {
      setIsLoading(false);
      setApiPing(Math.round(performance.now() - startTime));
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  // 1. Inativação Rápida (Ação da Lixeira)
  const handleQuickInactivate = async () => {
    const count = selectedUsers.length;
    if (count === 0) return;

    const confirmMsg = count === 1 
      ? "Deseja realmente inativar este usuário? Ele perderá o acesso ao sistema." 
      : `Deseja inativar os ${count} usuários selecionados?`;

    if (!window.confirm(confirmMsg)) return;

    const loadingToast = toast.loading(count === 1 ? "Inativando..." : `Inativando ${count} registros...`);
    const token = localStorage.getItem('medsched_token');
    const tenantId = jwtDecode(token).tenant_id;

    try {
      // Processa cada inativação (em lote)
      for (const userId of selectedUsers) {
        // Proteção: Não deixa o usuário inativar a si mesmo por aqui
        if (userId === currentUserId) {
          toast.error("Você não pode inativar seu próprio acesso!", { id: loadingToast });
          continue;
        }

        await api.put(`/users/${userId}`, { status: "INATIVO" }, { params: { tenant_id: tenantId } });
      }

      toast.success(count === 1 ? "Usuário inativado." : "Usuários inativados com sucesso!", { id: loadingToast });
      setSelectedUsers([]);
      fetchUsers();
    } catch (err) {
      toast.error("Erro ao processar inativação.", { id: loadingToast });
    }
  };

  const handleOpenCreate = () => {
    setShowAddMenu(false);
    setModalMode('create');
    const token = localStorage.getItem('medsched_token');
    const tenant_id = token ? jwtDecode(token).tenant_id : '';
    setFormData({ nome: '', email: '', papel: 'PROFISSIONAL', senha: '', status: 'ATIVO', tenant_id });
    setIsModalOpen(true);
  };

  const handleOpenEdit = () => {
    if (selectedUsers.length === 1) {
      const userToEdit = users.find(u => u.id === selectedUsers[0]);
      setFormData({
        nome: userToEdit.nome,
        email: userToEdit.email,
        papel: userToEdit.papel || userToEdit.role,
        status: userToEdit.status,
        senha: '',
        tenant_id: userToEdit.tenant_id || jwtDecode(localStorage.getItem('medsched_token')).tenant_id
      });
      setModalMode('edit');
      setIsModalOpen(true);
    }
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (modalMode === 'create') {
        await api.post('/users/', { ...formData, status: formData.status });
        toast.success("Usuário criado com sucesso!");
      } else {
        const userId = selectedUsers[0];
        await api.put(`/users/${userId}`, { nome: formData.nome, papel: formData.papel, status: formData.status }, { params: { tenant_id: formData.tenant_id } });
        toast.success("Usuário atualizado!");
        setSelectedUsers([]);
      }
      setIsModalOpen(false);
      fetchUsers(); 
    } catch (err) {
      toast.error("Erro na operação.");
    } finally {
      setIsSaving(false);
    }
  };

  const filteredUsers = useMemo(() => {
    const lowerSearch = searchTerm.toLowerCase();
    return users.filter(u => u.nome.toLowerCase().includes(lowerSearch) || u.email.toLowerCase().includes(lowerSearch));
  }, [users, searchTerm]);

  const toggleColumn = (colName) => setVisibleColumns(prev => ({ ...prev, [colName]: !prev[colName] }));

  return (
    <div className="p-8 max-w-7xl mx-auto flex flex-col h-[calc(100vh-4rem)]">
      <Toaster position="top-right" />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={modalMode === 'create' ? "Novo Usuário" : "Editar Usuário"}>
        <form onSubmit={handleSaveUser} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
            <input required minLength={3} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all" value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
            <input required disabled={modalMode === 'edit'} className={`w-full px-4 py-2 border rounded-lg outline-none ${modalMode === 'edit' ? 'bg-gray-100' : 'focus:ring-2 focus:ring-blue-500'}`} value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cargo</label>
              <select className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white" value={formData.papel} onChange={e => setFormData({...formData, papel: e.target.value})}>
                <option value="TENANT_ADMIN">Admin</option>
                <option value="PROFISSIONAL">Profissional</option>
                <option value="CLIENTE">Cliente</option>
              </select>
            </div>
            {modalMode === 'create' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
                <input required type="password" minLength={8} className="w-full px-4 py-2 border border-gray-300 rounded-lg" value={formData.senha} onChange={e => setFormData({...formData, senha: e.target.value})} />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select className="w-full px-4 py-2 border rounded-lg" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                  <option value="ATIVO">Ativo</option>
                  <option value="INATIVO">Inativo</option>
                </select>
              </div>
            )}
          </div>
          <div className="pt-4 flex gap-3">
            <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg">Cancelar</button>
            <button type="submit" disabled={isSaving} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg flex justify-center items-center gap-2">
              {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-4 h-4" />} {modalMode === 'create' ? 'Salvar Novo' : 'Salvar Alteração'}
            </button>
          </div>
        </form>
      </Modal>

      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Usuários</h1>
      </div>

      <div className="bg-white p-4 rounded-t-xl shadow-sm border border-gray-200 border-b-0 flex gap-4 items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Buscar..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg outline-none" />
        </div>

        <div className="flex items-center gap-2">
          {selectedUsers.length > 0 && (
            <div className="flex items-center gap-2 mr-2 pr-4 border-r border-gray-200">
              <span className="text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1.5 rounded-md">{selectedUsers.length} selecionado(s)</span>
              <button onClick={handleOpenEdit} className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"><Edit2 className="w-5 h-5" /></button>
              {/* BOTÃO DE INATIVAÇÃO RÁPIDA */}
              <button onClick={handleQuickInactivate} className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-100 rounded-lg transition-colors" title="Inativar Usuário(s)">
                <UserX className="w-5 h-5" />
              </button>
            </div>
          )}

          <button onClick={() => setShowColumnMenu(!showColumnMenu)} className="p-2 border border-gray-200 rounded-lg"><Settings2 className="w-5 h-5 text-gray-600" /></button>
          
          <div className="relative">
            <button onClick={() => setShowAddMenu(!showAddMenu)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2">
              <UserPlus className="w-5 h-5" /> Adicionar
            </button>
            {showAddMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 shadow-xl rounded-xl z-20 py-1">
                <button onClick={handleOpenCreate} className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-blue-50"><UserPlus className="w-4 h-4 mr-2 text-blue-600" /> Novo Registro</button>
                <button onClick={() => setShowAddMenu(false)} className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-blue-50"><UploadCloud className="w-4 h-4 mr-2 text-blue-600" /> Importar CSV</button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white flex-1 border border-gray-200 rounded-b-xl overflow-auto shadow-sm relative">
        <table className="w-full text-left min-w-[800px]">
          <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 text-sm uppercase sticky top-0 z-10">
            <tr>
              <th className="px-6 py-4 w-12"><input type="checkbox" onChange={e => e.target.checked ? setSelectedUsers(filteredUsers.map(u => u.id)) : setSelectedUsers([])} checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0} /></th>
              {visibleColumns.nome && <th className="px-6 py-4">Nome</th>}
              {visibleColumns.email && <th className="px-6 py-4">E-mail</th>}
              {visibleColumns.role && <th className="px-6 py-4">Cargo</th>}
              {visibleColumns.status && <th className="px-6 py-4">Status</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredUsers.map((user) => (
              <tr key={user.id} className={`hover:bg-blue-50/50 transition-colors ${selectedUsers.includes(user.id) ? 'bg-blue-50' : ''}`}>
                <td className="px-6 py-4"><input type="checkbox" checked={selectedUsers.includes(user.id)} onChange={() => setSelectedUsers(prev => prev.includes(user.id) ? prev.filter(id => id !== user.id) : [...prev, user.id])} /></td>
                {visibleColumns.nome && <td className="px-6 py-4 font-medium text-gray-900">{user.nome}</td>}
                {visibleColumns.email && <td className="px-6 py-4 text-gray-600">{user.email}</td>}
                {visibleColumns.role && <td className="px-6 py-4 text-xs font-semibold text-gray-500">{user.papel || user.role}</td>}
                {visibleColumns.status && (
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${user.status === 'ATIVO' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{user.status}</span>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-4 flex justify-between items-center text-xs text-gray-400">
        <div className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> <span>API Latency: {apiPing}ms</span></div>
        <div>Total: {users.length} registros.</div>
      </div>
    </div>
  );
}
