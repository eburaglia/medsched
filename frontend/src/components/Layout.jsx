import React, { useState, useEffect, useRef } from 'react';
import { jwtDecode } from 'jwt-decode';
import api from '../services/api';
import { Toaster, toast } from 'react-hot-toast';
import Modal from './Modal';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Users, Calendar, UserRound, Settings, FileText, LogOut, 
  ChevronLeft, Menu, BriefcaseMedical, Box, Building2, Globe, DollarSign, 
  ShieldAlert, Loader2, KeyRound, Save, BellRing, Check, X
} from 'lucide-react';

export default function Layout({ children }) {
  const [role, setRole] = useState('');
  const [userName, setUserName] = useState('Carregando...');
  const [userId, setUserId] = useState(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  const location = useLocation();
  const navigate = useNavigate();
  
  const [themeColor, setThemeColor] = useState(localStorage.getItem('saved_theme_color') || '#0f172a'); 
  const [isThemeLoaded, setIsThemeLoaded] = useState(false);
  
  const [tenants, setTenants] = useState([]);
  const [selectedTenant, setSelectedTenant] = useState(localStorage.getItem('selected_tenant_id') || '');

  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ senhaAtual: '', novaSenha: '', confirmarNovaSenha: '' });
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // 👇 DRCODE: Estados do Sininho de Notificações
  const [notifications, setNotifications] = useState([]);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const notificationRef = useRef(null);

  useEffect(() => {
    const savedColor = localStorage.getItem('saved_theme_color');
    if (savedColor) {
        document.documentElement.style.setProperty('--cor-primaria', savedColor);
    }

    const fetchUserDataAndTheme = async () => {
        const token = localStorage.getItem('medsched_token');
        if (!token) return;

        try {
            const decoded = jwtDecode(token);
            setUserId(decoded.sub);
            const getNormalizedRole = (r) => String(r || 'CLIENTE').toUpperCase();
            let tokenRole = getNormalizedRole(decoded.papel || decoded.role);

            if (['SUPER_ADMIN', 'SYSTEM_ADMIN'].includes(tokenRole)) {
                setUserName('Administrador');
                setRole(tokenRole);
                const adminColor = '#1e1e1e';
                setThemeColor(adminColor);
                localStorage.setItem('saved_theme_color', adminColor);
                document.documentElement.style.setProperty('--cor-primaria', adminColor);
                setIsThemeLoaded(true);
                api.get('/tenants').then(res => setTenants(res.data)).catch(() => {});
                fetchNotifications(); // Busca as notificações pro Admin
                return;
            }

            if (decoded.sub) {
                try {
                    const response = await api.get(`/users/${decoded.sub}`, { params: { tenant_id: decoded.tenant_id } });
                    setUserName(response.data.nome || 'Usuário');
                    setRole(getNormalizedRole(response.data.papel || tokenRole));
                } catch(e) {
                    setRole(tokenRole);
                    setUserName('Usuário');
                }
            }

            const targetTenant = decoded.tenant_id || selectedTenant;
            if (targetTenant) {
                try {
                    const res = await api.get(`/tenants/${targetTenant}`);
                    const configVisuais = res.data.configuracoes_visuais || {};
                    const corPrimaria = configVisuais.cor_primaria;
                    if (corPrimaria) {
                        setThemeColor(corPrimaria); 
                        localStorage.setItem('saved_theme_color', corPrimaria);
                        document.documentElement.style.setProperty('--cor-primaria', corPrimaria);
                    }
                } catch(e) {}
            }
            fetchNotifications(); // Busca as notificações para os usuários comuns
        } catch (e) {
            console.error("Erro no token", e);
        } finally {
            setIsThemeLoaded(true);
        }
    };
    fetchUserDataAndTheme();
  }, [selectedTenant]);

  // 👇 DRCODE: Lógica de Busca e Fechamento do Dropdown do Sininho
  const fetchNotifications = async () => {
    try {
        const res = await api.get('/notifications/in-app');
        setNotifications(res.data.filter(n => !n.lida)); // Guarda só as não lidas
    } catch (e) { console.error("Erro ao buscar notificações", e); }
  };

  const markAsRead = async (logId) => {
    try {
        await api.put(`/notifications/in-app/${logId}/read`);
        setNotifications(prev => prev.filter(n => n.id !== logId));
    } catch (e) { toast.error("Erro ao marcar como lida."); }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
        if (notificationRef.current && !notificationRef.current.contains(event.target)) {
            setIsNotificationOpen(false);
        }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleTenantChange = (e) => {
    const id = e.target.value;
    if (id === "") {
      localStorage.removeItem('selected_tenant_id');
      localStorage.removeItem('saved_theme_color');
    } else {
      localStorage.setItem('selected_tenant_id', id);
      const selectedT = tenants.find(t => t.id === id);
      if (selectedT && selectedT.configuracoes_visuais?.cor_primaria) {
          localStorage.setItem('saved_theme_color', selectedT.configuracoes_visuais.cor_primaria);
      } else {
          localStorage.removeItem('saved_theme_color');
      }
    }
    setSelectedTenant(id);
    window.location.reload(); 
  };

  const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard', roles: ['SYSTEM_ADMIN', 'SUPER_ADMIN', 'TENANT_ADMIN', 'GESTOR', 'PROFISSIONAL'] },
    { name: 'Agenda', icon: Calendar, path: '/agenda', roles: ['SYSTEM_ADMIN', 'SUPER_ADMIN', 'TENANT_ADMIN', 'GESTOR', 'PROFISSIONAL', 'CLIENTE'] },
    { name: 'Clientes', icon: UserRound, path: '/clientes', roles: ['SYSTEM_ADMIN', 'SUPER_ADMIN', 'TENANT_ADMIN', 'GESTOR', 'PROFISSIONAL'] },
    { name: 'Financeiro', icon: DollarSign, path: '/finance', roles: ['SYSTEM_ADMIN', 'SUPER_ADMIN', 'TENANT_ADMIN', 'GESTOR'] },
    { name: 'Usuários', icon: Users, path: '/usuarios', roles: ['SYSTEM_ADMIN', 'SUPER_ADMIN', 'TENANT_ADMIN', 'GESTOR'] },
    { name: 'Serviços', icon: BriefcaseMedical, path: '/servicos', roles: ['SYSTEM_ADMIN', 'SUPER_ADMIN', 'TENANT_ADMIN', 'GESTOR'] },
    { name: 'Recursos', icon: Box, path: '/recursos', roles: ['SYSTEM_ADMIN', 'SUPER_ADMIN', 'TENANT_ADMIN', 'GESTOR'] },
    { name: 'Relatórios', icon: FileText, path: '/relatorios', roles: ['SYSTEM_ADMIN', 'SUPER_ADMIN', 'TENANT_ADMIN', 'GESTOR'] },
    { name: 'Configurações', icon: Settings, path: '/configuracoes', roles: ['SYSTEM_ADMIN', 'SUPER_ADMIN', 'TENANT_ADMIN'] },
    { name: 'Gestão Global', icon: Building2, path: '/tenants', roles: ['SUPER_ADMIN', 'SYSTEM_ADMIN'] },
    { name: 'Atendimentos', icon: FileText, path: '/atendimentos', roles: ['SYSTEM_ADMIN', 'SUPER_ADMIN', 'TENANT_ADMIN', 'GESTOR', 'PROFISSIONAL'] },
  ];

  const allowedMenus = menuItems.filter(item => item.roles.includes(role));

  const handleChangePasswordSubmit = async (e) => {
      e.preventDefault();
      if (passwordForm.novaSenha !== passwordForm.confirmarNovaSenha) {
          return toast.error("As novas senhas digitadas não coincidem.");
      }
      setIsChangingPassword(true);
      try {
          const payload = { senha_atual: passwordForm.senhaAtual, nova_senha: passwordForm.novaSenha };
          await api.post(`/users/${userId}/change-password`, payload);
          toast.success("Senha alterada com sucesso! Bem-vindo(a).");
          setIsChangePasswordModalOpen(false);
          setPasswordForm({ senhaAtual: '', novaSenha: '', confirmarNovaSenha: '' });
      } catch (err) {
          let msg = "Erro ao alterar a senha.";
          if (err.response?.data?.detail) {
              msg = typeof err.response.data.detail === 'string' ? err.response.data.detail : "Validação falhou.";
          }
          toast.error(msg);
      } finally {
          setIsChangingPassword(false);
      }
  };

  const handleLogout = () => {
      localStorage.clear();
      window.location.href = '/login';
  };

  // 👇 DRCODE: Vigia de Inatividade (60 minutos)
  useEffect(() => {
    let timeoutId;
    const INACTIVITY_TIME = 60 * 60 * 1000; // 60 minutos em milissegundos

    const resetTimer = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        // Se bater 60 minutos sem ninguém mexer, desloga por segurança
        localStorage.clear();
        // Redireciona e limpa cache da sessão
        window.location.href = '/login'; 
      }, INACTIVITY_TIME);
    };

    // Inicia o cronômetro assim que o Layout carrega
    resetTimer();

    // Eventos de teclado, mouse e tela touch que resetam o cronômetro
    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    events.forEach(event => window.addEventListener(event, resetTimer));

    // Limpeza da memória ao sair da tela
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      events.forEach(event => window.removeEventListener(event, resetTimer));
    };
  }, []);

  if (!isThemeLoaded) {
      return (
          <div className="h-screen w-screen bg-slate-50 flex flex-col items-center justify-center">
              <Loader2 className="w-10 h-10 animate-spin text-slate-400 mb-4" />
              <p className="text-slate-500 font-medium">Carregando ambiente...</p>
          </div>
      );
  }

  return (
    <div className="flex h-screen bg-gray-50 font-sans">
      <Toaster position="top-right" />
      
      <Modal isOpen={isChangePasswordModalOpen} onClose={() => setIsChangePasswordModalOpen(false)} title="Alterar Senha de Acesso">
          <form onSubmit={handleChangePasswordSubmit} className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg flex items-start gap-3">
                  <ShieldAlert className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-blue-800">
                      Mantenha sua conta segura. Se você recebeu uma <strong>senha temporária</strong>, insira ela no campo "Senha Atual" para registrar sua senha definitiva.
                  </p>
              </div>

              <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Senha Atual (ou Temporária)</label>
                  <input type="password" required className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" value={passwordForm.senhaAtual} onChange={e => setPasswordForm({...passwordForm, senhaAtual: e.target.value})} />
              </div>
              
              <div className="border-t border-slate-200 pt-4 mt-2">
                  <label className="block text-sm font-bold text-slate-700 mb-1">Nova Senha Definitiva</label>
                  <input type="password" required minLength={8} className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" placeholder="Mínimo de 8 caracteres" value={passwordForm.novaSenha} onChange={e => setPasswordForm({...passwordForm, novaSenha: e.target.value})} />
              </div>

              <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Confirme a Nova Senha</label>
                  <input type="password" required minLength={8} className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" value={passwordForm.confirmarNovaSenha} onChange={e => setPasswordForm({...passwordForm, confirmarNovaSenha: e.target.value})} />
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100">
                  <button type="button" onClick={() => setIsChangePasswordModalOpen(false)} className="flex-1 px-4 py-2 border border-slate-300 text-slate-600 font-bold rounded-lg hover:bg-slate-50 transition-colors">Cancelar</button>
                  <button type="submit" disabled={isChangingPassword} className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg flex items-center justify-center gap-2 transition-colors">
                      {isChangingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      Salvar Nova Senha
                  </button>
              </div>
          </form>
      </Modal>

      <aside 
        className={`${isCollapsed ? 'w-20' : 'w-64'} text-slate-200 flex flex-col shadow-xl z-30 transition-all duration-300 relative`}
        style={{ backgroundColor: themeColor }}
      >
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)} 
          className="absolute -right-3 top-8 text-white rounded-full p-1 shadow-lg z-40"
          style={{ backgroundColor: themeColor, filter: 'brightness(1.2)' }} 
        >
          {isCollapsed ? <Menu className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>

        <div className={`p-6 border-b border-white/10 flex items-center ${isCollapsed ? 'justify-center px-0' : 'gap-3'}`}>
          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center text-white font-bold">M</div>
          {!isCollapsed && <span className="text-xl font-bold text-white">ServiceSchedule</span>}
        </div>

        {!isCollapsed && (role === 'SUPER_ADMIN' || role === 'SYSTEM_ADMIN') && (
          <div className="px-4 py-4 border-b border-white/10 bg-black/10">
            <label className="text-[10px] uppercase font-bold text-white/50 flex items-center gap-1 mb-2">
              <Globe className="w-3 h-3" /> Visão Global
            </label>
            <select 
              value={selectedTenant}
              onChange={handleTenantChange}
              className="w-full bg-white/10 border border-white/20 rounded px-2 py-1.5 text-xs text-white outline-none focus:bg-white/20 transition-all cursor-pointer"
            >
              <option value="" className="text-gray-900">-- Todas as Instâncias --</option>
              {tenants.map(t => (
                <option key={t.id} value={t.id} className="text-gray-900">{t.nome_fantasia || t.razao_social}</option>
              ))}
            </select>
          </div>
        )}
        
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {allowedMenus.map((item) => (
            <Link 
              key={item.name} 
              to={item.path} 
              className={`flex items-center gap-3 py-2.5 px-4 rounded-lg transition-all ${location.pathname === item.path ? 'bg-white/20 text-white shadow-md' : 'hover:bg-black/10 text-white/80 hover:text-white'}`}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!isCollapsed && <span className="text-sm font-medium">{item.name}</span>}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10 bg-black/20 flex flex-col gap-2">
          <div className="mb-2 px-2">
            <p className="text-sm font-bold text-white truncate">{userName}</p>
            <p className="text-[10px] text-white/50 uppercase tracking-widest">{role.replace('_', ' ')}</p>
          </div>
          
          {!isCollapsed && (
             <button onClick={() => setIsChangePasswordModalOpen(true)} className="w-full flex items-center gap-2 py-2 px-3 text-xs font-bold text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-all text-left">
                <KeyRound className="w-4 h-4" /> Alterar minha Senha
             </button>
          )}

          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 py-2 text-xs font-bold text-white/70 hover:text-white hover:bg-white/10 rounded-lg border border-white/10 transition-all mt-1">
            <LogOut className="w-4 h-4" /> {!isCollapsed && "SAIR"}
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto bg-gray-50 flex flex-col relative z-10">
        
        {/* 👇 DRCODE: HEADER MINIMALISTA PARA O SININHO */}
        <header className="bg-white h-14 border-b border-slate-200 flex items-center justify-end px-6 sticky top-0 z-20 shadow-sm shrink-0">
            <div className="relative" ref={notificationRef}>
                <button 
                  onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                  className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors relative"
                >
                    <BellRing className="w-5 h-5" />
                    {notifications.length > 0 && (
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white animate-pulse"></span>
                    )}
                </button>

                {/* DROPDOWN DE MENSAGENS */}
                {isNotificationOpen && (
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                        <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex items-center justify-between">
                            <h3 className="text-sm font-bold text-slate-800">Notificações</h3>
                            {notifications.length > 0 && (
                                <span className="text-xs font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                                    {notifications.length} nova{notifications.length > 1 ? 's' : ''}
                                </span>
                            )}
                        </div>
                        
                        <div className="max-h-80 overflow-y-auto">
                            {notifications.length === 0 ? (
                                <div className="p-6 text-center text-slate-400">
                                    <Check className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                    <p className="text-sm font-medium">Nenhuma notificação nova.</p>
                                </div>
                            ) : (
                                <ul className="divide-y divide-slate-100">
                                    {notifications.map(notif => (
                                        <li key={notif.id} className="p-4 hover:bg-slate-50 transition-colors group relative">
                                            <div className="pr-6">
                                                <p className="text-xs font-bold text-slate-800 mb-1">{notif.assunto || "Mensagem do Sistema"}</p>
                                                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{notif.conteudo}</p>
                                                <p className="text-[10px] text-slate-400 mt-2 font-medium">
                                                    {new Date(notif.criado_em).toLocaleDateString('pt-BR')} às {new Date(notif.criado_em).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
                                                </p>
                                            </div>
                                            <button 
                                                onClick={() => markAsRead(notif.id)}
                                                className="absolute top-4 right-3 p-1 text-slate-300 hover:text-green-600 hover:bg-green-50 rounded opacity-0 group-hover:opacity-100 transition-all"
                                                title="Marcar como lida"
                                            >
                                                <Check className="w-4 h-4" />
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </header>

        {children}
      </main>
    </div>
  );
}
