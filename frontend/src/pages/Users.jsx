import React, { useEffect, useState, useMemo } from 'react';
import api from '../services/api';
import { jwtDecode } from 'jwt-decode';
import { Toaster, toast } from 'react-hot-toast';
import Modal from '../components/Modal';
import { 
  UserPlus, Mail, Shield, UserCheck, Loader2, AlertCircle, 
  Search, Download, Edit2, Trash2, Settings2, UploadCloud, Clock, Save
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
  
  // Controle do Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' ou 'edit'
  const [isSaving, setIsSaving] = useState(false);
  
  // O Status foi adicionado ao formData para a edição
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
      
      // Apenas atualiza o tenant_id inicial se estiver criando
      if (modalMode === 'create') {
        setFormData(prev => ({ ...prev, tenant_id: decoded.tenant_id }));
      }
    } catch (err) {
      setError("Falha ao carregar usuários.");
    } finally {
      setIsLoading(false);
      setApiPing(Math.round(performance.now() - startTime));
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  // 1. Função para abrir o Modal de Criação (Limpa o formulário)
  const handleOpenCreate = () => {
    setShowAddMenu(false);
    setModalMode('create');
    const token = localStorage.getItem('medsched_token');
    const tenant_id = token ? jwtDecode(token).tenant_id : '';
    setFormData({ nome: '', email: '', papel: 'PROFISSIONAL', senha: '', status: 'ATIVO', tenant_id });
    setIsModalOpen(true);
  };

  // 2. Função para abrir o Modal de Edição (Preenche o formulário)
  const handleOpenEdit = () => {
    if (selectedUsers.length === 1) {
      const userToEdit = users.find(u => u.id === selectedUsers[0]);
      setFormData({
        nome: userToEdit.nome,
        email: userToEdit.email,
        papel: userToEdit.papel || userToEdit.role, // Fallback caso a API devolva 'role' em vez de 'papel'
        status: userToEdit.status,
        senha: '', // Senha não vai na edição
        tenant_id: userToEdit.tenant_id || jwtDecode(localStorage.getItem('medsched_token')).tenant_id
      });
      setModalMode('edit');
      setIsModalOpen(true);
    } else {
      toast("A edição em lote será implementada na próxima fase!", { icon: '🚧' });
    }
  };

  // 3. O Salvar agora entende se é POST ou PUT
  const handleSaveUser = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (modalMode === 'create') {
        await api.post('/users/', {
          nome: formData.nome,
          email: formData.email,
          papel: formData.papel,
          senha: formData.senha,
          tenant_id: formData.tenant_id,
          status: formData.status
        });
        toast.success("Usuário criado com sucesso!");
      } else {
        // Modo Edição (PUT)
        const userId = selectedUsers[0];
        await api.put(`/users/${userId}`, {
          nome: formData.nome,
          papel: formData.papel,
          status: formData.status
          // Note que E-mail e Senha não são enviados, conforme seu backend
        }, {
          params: { tenant_id: formData.tenant_id }
        });
        toast.success("Usuário atualizado com sucesso!");
        setSelectedUsers([]); // Limpa a seleção após editar
      }
      
      setIsModalOpen(false);
      fetchUsers(); 
    } catch (err) {
      console.error("🕵️ DETETIVE DE ERRO DA API:", err.response?.data);
      let msg = "Erro ao salvar usuário.";
      
      if (err.response?.data?.detail) {
        if (typeof err.response.data.detail === 'string') {
          msg = err.response.data.detail;
        } else if (Array.isArray(err.response.data.detail)) {
          const formatErrors = err.response.data.detail.map(e => `${e.loc[e.loc.length - 1]}: ${e.msg}`).join(' | ');
          msg = `Verifique os campos: ${formatErrors}`;
        }
      }
      toast.error(msg);
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

      {/* MODAL INTELIGENTE (Criação e Edição) */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={modalMode === 'create' ? "Novo Usuário" : "Editar Usuário"}
      >
        <form onSubmit={handleSaveUser} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
            <input 
              required
              minLength={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              value={formData.nome}
              onChange={e => setFormData({...formData, nome: e.target.value})}
              placeholder="Ex: Dr. Ricardo Silva"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">E-mail Profissional</label>
            <input 
              required
              type="email"
              disabled={modalMode === 'edit'} // Bloqueia e-mail na edição
              className={`w-full px-4 py-2 border rounded-lg outline-none transition-all ${modalMode === 'edit' ? 'bg-gray-100 text-gray-500 border-gray-200 cursor-not-allowed' : 'border-gray-300 focus:ring-2 focus:ring-blue-500'}`}
              value={formData.email}
              onChange={e => setFormData({...formData, email: e.target.value})}
              placeholder="ricardo@clinica.com"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cargo / Papel</label>
              <select 
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                value={formData.papel}
                onChange={e => setFormData({...formData, papel: e.target.value})}
              >
                <option value="TENANT_ADMIN">Admin da Clínica</option>
                <option value="PROFISSIONAL">Profissional / Médico</option>
                <option value="CLIENTE">Paciente / Cliente</option>
              </select>
            </div>
            
            {/* Se for Criação, mostra Senha. Se for Edição, mostra Status */}
            {modalMode === 'create' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Senha Inicial</label>
                <input 
                  required
                  type="password"
                  minLength={8}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  value={formData.senha}
                  onChange={e => setFormData({...formData, senha: e.target.value})}
                  placeholder="Mínimo 8 caracteres"
                />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select 
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 outline-none font-medium ${formData.status === 'ATIVO' ? 'border-green-300 text-green-700 bg-green-50 focus:ring-green-500' : 'border-red-300 text-red-700 bg-red-50 focus:ring-red-500'}`}
                  value={formData.status}
                  onChange={e => setFormData({...formData, status: e.target.value})}
                >
                  <option value="ATIVO">Ativo</option>
                  <option value="PENDENTE">Pendente</option>
                  <option value="INATIVO">Inativo (Bloqueado)</option>
                </select>
              </div>
            )}
          </div>
          
          <div className="pt-4 flex gap-3">
            <button 
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              disabled={isSaving}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-4 h-4" /> {modalMode === 'create' ? 'Salvar Novo' : 'Salvar Alteração'}</>}
            </button>
          </div>
        </form>
      </Modal>

      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Usuários</h1>
          <p className="text-gray-500 mt-1">Gestão de acessos da clínica.</p>
        </div>
      </div>

      {/* TOOLBAR */}
      <div className="bg-white p-4 rounded-t-xl shadow-sm border border-gray-200 border-b-0 flex flex-wrap gap-4 items-center justify-between">
        <div className="relative flex-1 min-w-[250px] max-w-md">
          <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Buscar por nome ou e-mail..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg outline-none" />
        </div>

        <div className="flex items-center gap-2">
          {/* Lógica do Menu de Ações na Toolbar */}
          {selectedUsers.length > 0 && (
            <div className="flex items-center gap-2 mr-2 pr-4 border-r border-gray-200">
              <span className="text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1.5 rounded-md">{selectedUsers.length} selecionado(s)</span>
              {/* O botão de Editar agora chama a função handleOpenEdit */}
              <button onClick={handleOpenEdit} className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Editar">
                <Edit2 className="w-5 h-5" />
              </button>
              <button className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Excluir">
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          )}

          <button onClick={() => setShowColumnMenu(!showColumnMenu)} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg border border-gray-200"><Settings2 className="w-5 h-5" /></button>
          
          {showColumnMenu && (
            <div className="absolute right-0 mt-48 w-48 bg-white border border-gray-200 shadow-lg rounded-xl z-20 py-2">
              {Object.keys(visibleColumns).map(col => (
                <label key={col} className="flex items-center px-4 py-2 hover:bg-gray-50 cursor-pointer text-sm capitalize">
                  <input type="checkbox" checked={visibleColumns[col]} onChange={() => toggleColumn(col)} className="rounded text-blue-600 mr-2" /> {col}
                </label>
              ))}
            </div>
          )}

          <div className="relative">
            <button onClick={() => setShowAddMenu(!showAddMenu)} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 shadow-sm font-medium transition-all">
              <UserPlus className="w-5 h-5" /> Adicionar
            </button>
            {showAddMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 shadow-lg rounded-xl z-20 py-1">
                {/* O botão de Novo agora chama a função handleOpenCreate */}
                <button onClick={handleOpenCreate} className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700">
                  <UserPlus className="w-4 h-4 mr-2" /> Novo Registro
                </button>
                <button onClick={() => setShowAddMenu(false)} className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700">
                  <UploadCloud className="w-4 h-4 mr-2" /> Importar em Lote
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* TABELA */}
      <div className="bg-white flex-1 border border-gray-200 rounded-b-xl overflow-auto shadow-sm relative">
        {isLoading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 bg-white/80 z-10"><Loader2 className="w-8 h-8 animate-spin mb-2 text-blue-600" /> Carregando base...</div>
        ) : (
          <table className="w-full text-left min-w-[800px]">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 text-sm uppercase sticky top-0 z-10">
              <tr>
                <th className="px-6 py-4 w-12"><input type="checkbox" onChange={e => e.target.checked ? setSelectedUsers(filteredUsers.map(u => u.id)) : setSelectedUsers([])} checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0} className="rounded text-blue-600" /></th>
                {visibleColumns.nome && <th className="px-6 py-4 font-semibold">Nome</th>}
                {visibleColumns.email && <th className="px-6 py-4 font-semibold">E-mail</th>}
                {visibleColumns.role && <th className="px-6 py-4 font-semibold">Cargo</th>}
                {visibleColumns.status && <th className="px-6 py-4 font-semibold">Status</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className={`hover:bg-blue-50/50 transition-colors ${selectedUsers.includes(user.id) ? 'bg-blue-50' : ''}`}>
                  <td className="px-6 py-4"><input type="checkbox" checked={selectedUsers.includes(user.id)} onChange={() => setSelectedUsers(prev => prev.includes(user.id) ? prev.filter(id => id !== user.id) : [...prev, user.id])} className="rounded text-blue-600" /></td>
                  {visibleColumns.nome && <td className="px-6 py-4 font-medium text-gray-900">{user.nome}</td>}
                  {visibleColumns.email && <td className="px-6 py-4 text-gray-600">{user.email}</td>}
                  {visibleColumns.role && <td className="px-6 py-4"><span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100">{user.papel || user.role}</span></td>}
                  {visibleColumns.status && <td className="px-6 py-4"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${user.status === 'ATIVO' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{user.status}</span></td>}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="mt-4 flex justify-between items-center text-xs text-gray-400">
        <div className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> <span>API Latency: {apiPing}ms</span></div>
        <div>Total: {users.length} registros.</div>
      </div>
    </div>
  );
}
