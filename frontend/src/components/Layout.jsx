import React, { useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import api from '../services/api';
import { Toaster, toast } from 'react-hot-toast';
import Modal from './Modal';
import { 
  LayoutDashboard, Users, Calendar, UserRound, Settings, FileText, LogOut, 
  ChevronLeft, Menu, BriefcaseMedical, Box, Building2, Globe, DollarSign, 
  ShieldAlert, Loader2, KeyRound, Save 
} from 'lucide-react';

export default function Layout({ children }) {
  const [role, setRole] = useState('');
  const [userName, setUserName] = useState('Carregando...');
  const [userId, setUserId] = useState(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  // Controle de Cores e FOUC (Piscar)
  const [themeColor, setThemeColor] = useState('#0f172a'); 
  const [isThemeLoaded, setIsThemeLoaded] = useState(false);
  
  const [tenants, setTenants] = useState([]);
  const [selectedTenant, setSelectedTenant] = useState(localStorage.getItem('selected_tenant_id') || '');

  // ESTADOS DA TROCA DE SENHA OBRIGATÓRIA
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ senhaAtual: '', novaSenha: '', confirmarNovaSenha: '' });
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
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
                setThemeColor('#1e1e1e');
                setIsThemeLoaded(true);
                api.get('/tenants').then(res => setTenants(res.data)).catch(() => {});
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
                        document.documentElement.style.setProperty('--cor-primaria', corPrimaria);
                    }
                } catch(e) {}
            }
        } catch (e) {
            console.error("Erro no token", e);
        } finally {
            // Atraso sutil para garantir que o CSS aplique a cor antes de renderizar a tela, matando o piscar.
            setTimeout(() => setIsThemeLoaded(true), 100);
        }
    };
    fetchUserDataAndTheme();
  }, [selectedTenant]);

  const handleTenantChange = (e) => {
    const id = e.target.value;
    if (id === "") {
      localStorage.removeItem('selected_tenant_id');
    } else {
      localStorage.setItem('selected_tenant_id', id);
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
    { name: 'Gestão de Clínicas', icon: Building2, path: '/tenants', roles: ['SUPER_ADMIN', 'SYSTEM_ADMIN'] },
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
      
      {/* MODAL DE TROCA DE SENHA VOLUNTÁRIA/OBRIGATÓRIA */}
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
        className={`${isCollapsed ? 'w-20' : 'w-64'} text-slate-200 flex flex-col shadow-xl z-20 transition-all duration-300 relative`}
        style={{ backgroundColor: themeColor }}
      >
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)} 
          className="absolute -right-3 top-8 text-white rounded-full p-1 shadow-lg z-30"
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
              <Globe className="w-3 h-3" /> Visão da Clínica
            </label>
            <select 
              value={selectedTenant}
              onChange={handleTenantChange}
              className="w-full bg-white/10 border border-white/20 rounded px-2 py-1.5 text-xs text-white outline-none focus:bg-white/20 transition-all cursor-pointer"
            >
              <option value="" className="text-gray-900">-- Visão Global --</option>
              {tenants.map(t => (
                <option key={t.id} value={t.id} className="text-gray-900">{t.nome_fantasia || t.razao_social}</option>
              ))}
            </select>
          </div>
        )}
        
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {allowedMenus.map((item) => (
            <a key={item.name} href={item.path} className={`flex items-center gap-3 py-2.5 px-4 rounded-lg transition-all ${window.location.pathname === item.path ? 'bg-white/20 text-white shadow-md' : 'hover:bg-black/10 text-white/80 hover:text-white'}`}>
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!isCollapsed && <span className="text-sm font-medium">{item.name}</span>}
            </a>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10 bg-black/20 flex flex-col gap-2">
          <div className="mb-2 px-2">
            <p className="text-sm font-bold text-white truncate">{userName}</p>
            <p className="text-[10px] text-white/50 uppercase tracking-widest">{role.replace('_', ' ')}</p>
          </div>
          
          {/* DRCODE: Botão de Trocar Senha Voluntária do próprio usuário no Menu */}
          {!isCollapsed && (
             <button onClick={() => setIsChangePasswordModalOpen(true)} className="w-full flex items-center gap-2 py-2 px-3 text-xs font-bold text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-all text-left">
                <KeyRound className="w-4 h-4" /> Alterar minha Senha
             </button>
          )}

          <button onClick={() => { localStorage.clear(); window.location.href = '/login'; }} className="w-full flex items-center justify-center gap-2 py-2 text-xs font-bold text-white/70 hover:text-white hover:bg-white/10 rounded-lg border border-white/10 transition-all mt-1">
            <LogOut className="w-4 h-4" /> {!isCollapsed && "SAIR"}
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto bg-gray-50">
        {children}
      </main>
    </div>
  );
}
