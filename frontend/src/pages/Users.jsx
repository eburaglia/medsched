import React, { useEffect, useState, useMemo } from 'react';
import api from '../services/api';
import { jwtDecode } from 'jwt-decode';
import { Toaster, toast } from 'react-hot-toast';
import Modal from '../components/Modal';
import { 
  UserPlus, Mail, Shield, UserCheck, Loader2, AlertCircle, 
  Search, Download, Edit2, Trash2, Settings2, UploadCloud, Clock, Save, UserX, CheckSquare
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
  const [modalMode, setModalMode] = useState('create'); // 'create', 'edit', 'batch-edit'
  const [isSaving, setIsSaving] = useState(false);
  
  // Toggles para saber quais campos sobrescrever na edição em lote
  const [batchToggles, setBatchToggles] = useState({ papel: false, status: false });

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
    link.download = `medsched_usuarios_${new Date().toISOString().split('T')[0]}.csv`;
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
    } catch (err) {
      toast.error("Erro na inativação.", { id: loadingToast });
    }
  };

  const handleOpenCreate = () => {
    setShowAddMenu(false);
    setModalMode('create');
    setFormData({ nome: '', email: '', papel: 'PROFISSIONAL', senha: '', status: 'ATIVO', tenant_id: jwtDecode(localStorage.getItem('medsched_token')).tenant_id });
    setIsModalOpen(true);
  };

  // 1. EDIÇÃO INTELIGENTE (Detecta se é 1 ou Vários)
  const handleOpenEdit = () => {
    if (selectedUsers.length === 1) {
      const userToEdit = users.find(u => u.id === selectedUsers[0]);
      setFormData({
        nome: userToEdit.nome, email: userToEdit.email, papel: userToEdit.papel || userToEdit.role,
        status: userToEdit.status, senha: '', tenant_id: userToEdit.tenant_id
      });
      setModalMode('edit');
      setIsModalOpen(true);
    } else if (selectedUsers.length > 1) {
      setModalMode('batch-edit');
      setBatchToggles({ papel: false, status: false });
      setFormData({ nome: '', email: '', papel: 'PROFISSIONAL', senha: '', status: 'ATIVO', tenant_id: jwtDecode(localStorage.getItem('medsched_token')).tenant_id });
      setIsModalOpen(true);
    }
  };

  // 2. SALVAR MODO LOTE
  const handleSaveUser = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (modalMode === 'create') {
        await api.post('/users/', { ...formData });
        toast.success("Usuário criado com sucesso!");
      } else if (modalMode === 'edit') {
        await api.put(`/users/${selectedUsers[0]}`, { nome: formData.nome, papel: formData.papel, status: formData.status }, { params: { tenant_id: formData.tenant_id } });
        toast.success("Usuário atualizado!");
        setSelectedUsers([]);
      } else if (modalMode === 'batch-edit') {
        // Monta o Payload apenas com o que o admin marcou para sobrescrever
        const payload = {};
        if (batchToggles.papel) payload.papel = formData.papel;
        if (batchToggles.status) payload.status = formData.status;

        if (Object.keys(payload).length === 0) {
          toast.error("Selecione pelo menos um campo para alterar.");
          setIsSaving(false);
          return;
        }

        const loadingToast = toast.loading(`Atualizando ${selectedUsers.length} registros...`);
        for (const userId of selectedUsers) {
          await api.put(`/users/${userId}`, payload, { params: { tenant_id: formData.tenant_id } });
        }
        toast.success("Edição em lote concluída!", { id: loadingToast });
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

  return (
    <div className="p-8 max-w-7xl mx-auto flex flex-col h-[calc(100vh-4rem)]">
      <Toaster position="top-right" />

      {/* TÍTULO DINÂMICO DO MODAL */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={modalMode === 'create' ? "Novo Usuário" : modalMode === 'edit' ? "Editar Usuário" : "Edição em Lote"}
      >
        <form onSubmit={handleSaveUser} className="space-y-4">
          
          {modalMode === 'batch-edit' && (
            <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg text-sm text-blue-800 flex items-start gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p>Você está editando <strong>{selectedUsers.length} usuários</strong> simultaneamente. Marque apenas os campos que deseja sobrescrever.</p>
            </div>
          )}

          {/* Oculta Nome, E-mail e Senha na edição em lote */}
          {modalMode !== 'batch-edit' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700">Nome</label>
                <input required className="w-full px-4 py-2 border rounded-lg" value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">E-mail</label>
                <input required disabled={modalMode === 'edit'} className={`w-full px-4 py-2 border rounded-lg ${modalMode === 'edit' ? 'bg-gray-100' : ''}`} value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
              </div>
              {modalMode === 'create' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Senha</label>
                  <input required type="password" minLength={8} className="w-full px-4 py-2 border rounded-lg" value={formData.senha} onChange={e => setFormData({...formData, senha: e.target.value})} />
                </div>
              )}
            </>
          )}

          <div className={`grid ${modalMode === 'batch-edit' ? 'grid-cols-1' : 'grid-cols-2'} gap-4`}>
            {/* Bloco Cargo */}
            <div className={`border p-3 rounded-lg ${modalMode === 'batch-edit' && !batchToggles.papel ? 'bg-gray-50 border-gray-200' : 'border-gray-300'}`}>
              {modalMode === 'batch-edit' ? (
                <label className="flex items-center gap-2 mb-2 font-semibold text-gray-700 cursor-pointer">
                  <input type="checkbox" checked={batchToggles.papel} onChange={e => setBatchToggles({...batchToggles, papel: e.target.checked})} className="rounded text-blue-600 w-4 h-4" />
                  Sobrescrever Cargo
                </label>
              ) : <label className="block text-sm font-medium text-gray-700 mb-1">Cargo</label>}
              <select disabled={modalMode === 'batch-edit' && !batchToggles.papel} className="w-full px-4 py-2 border rounded-lg bg-white disabled:bg-gray-100" value={formData.papel} onChange={e => setFormData({...formData, papel: e.target.value})}>
                <option value="TENANT_ADMIN">Admin</option>
                <option value="PROFISSIONAL">Profissional</option>
                <option value="CLIENTE">Cliente</option>
              </select>
            </div>

            {/* Bloco Status (Não aparece na criação) */}
            {modalMode !== 'create' && (
              <div className={`border p-3 rounded-lg ${modalMode === 'batch-edit' && !batchToggles.status ? 'bg-gray-50 border-gray-200' : 'border-gray-300'}`}>
                {modalMode === 'batch-edit' ? (
                  <label className="flex items-center gap-2 mb-2 font-semibold text-gray-700 cursor-pointer">
                    <input type="checkbox" checked={batchToggles.status} onChange={e => setBatchToggles({...batchToggles, status: e.target.checked})} className="rounded text-blue-600 w-4 h-4" />
                    Sobrescrever Status
                  </label>
                ) : <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>}
                <select disabled={modalMode === 'batch-edit' && !batchToggles.status} className="w-full px-4 py-2 border rounded-lg bg-white disabled:bg-gray-100" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                  <option value="ATIVO">Ativo</option>
                  <option value="PENDENTE">Pendente</option>
                  <option value="INATIVO">Inativo</option>
                </select>
              </div>
            )}
          </div>

          <button type="submit" disabled={isSaving} className="w-full mt-4 bg-blue-600 text-white py-2 rounded-lg flex justify-center items-center gap-2">
            {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-4 h-4" />} 
            {modalMode === 'create' ? 'Salvar Novo' : modalMode === 'edit' ? 'Salvar Alteração' : 'Aplicar em Lote'}
          </button>
        </form>
      </Modal>

      <h1 className="text-3xl font-bold text-gray-900 mb-6">Usuários</h1>

      <div className="bg-white p-4 rounded-t-xl shadow-sm border border-gray-200 flex gap-4 items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Buscar..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg outline-none" />
        </div>

        <div className="flex items-center gap-2">
          {selectedUsers.length > 0 && (
            <div className="flex items-center gap-2 mr-2 pr-4 border-r border-gray-200">
              <span className="text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1.5 rounded-md">{selectedUsers.length}</span>
              <button onClick={handleOpenEdit} className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 className="w-5 h-5" /></button>
              <button onClick={handleQuickInactivate} className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg"><UserX className="w-5 h-5" /></button>
            </div>
          )}

          <button onClick={() => setShowColumnMenu(!showColumnMenu)} className="p-2 border border-gray-200 rounded-lg"><Settings2 className="w-5 h-5 text-gray-600" /></button>
          <button onClick={handleExportCSV} className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600"><Download className="w-5 h-5" /></button>

          <div className="relative">
            <button onClick={() => setShowAddMenu(!showAddMenu)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2">
              <UserPlus className="w-5 h-5" /> Adicionar
            </button>
            {showAddMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 shadow-xl rounded-xl z-20 py-1">
                <button onClick={handleOpenCreate} className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-blue-50"><UserPlus className="w-4 h-4 mr-2" /> Novo Registro</button>
                <button onClick={() => setShowAddMenu(false)} className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-blue-50"><UploadCloud className="w-4 h-4 mr-2" /> Importar CSV</button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white flex-1 border border-gray-200 border-t-0 rounded-b-xl overflow-auto shadow-sm relative">
        <table className="w-full text-left min-w-[800px]">
          <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 text-sm uppercase sticky top-0 z-10">
            <tr>
              <th className="px-6 py-4 w-12"><input type="checkbox" onChange={e => e.target.checked ? setSelectedUsers(filteredUsers.map(u => u.id)) : setSelectedUsers([])} checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0} /></th>
              {Object.keys(visibleColumns).map(col => visibleColumns[col] && <th key={col} className="px-6 py-4 capitalize">{col}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredUsers.map((user) => (
              <tr key={user.id} className={`hover:bg-blue-50/50 transition-colors ${selectedUsers.includes(user.id) ? 'bg-blue-50' : ''}`}>
                <td className="px-6 py-4"><input type="checkbox" checked={selectedUsers.includes(user.id)} onChange={() => setSelectedUsers(prev => prev.includes(user.id) ? prev.filter(id => id !== user.id) : [...prev, user.id])} /></td>
                {visibleColumns.nome && <td className="px-6 py-4 font-medium text-gray-900">{user.nome}</td>}
                {visibleColumns.email && <td className="px-6 py-4 text-gray-600">{user.email}</td>}
                {visibleColumns.role && <td className="px-6 py-4 text-xs font-semibold">{user.papel || user.role}</td>}
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
    </div>
  );
}
