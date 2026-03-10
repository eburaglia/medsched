import React, { useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import api from '../services/api';
import { LayoutDashboard, Users, Calendar, UserRound, Settings, FileText, LogOut, ChevronLeft, Menu, BriefcaseMedical, Box, Building2, Globe } from 'lucide-react';

export default function Layout({ children }) {
  const [role, setRole] = useState('');
  const [userName, setUserName] = useState('Carregando...');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [themeColor, setThemeColor] = useState('#0f172a');
  
  // Estados para o Seletor de Clínicas (Super Admin)
  const [tenants, setTenants] = useState([]);
  const [selectedTenant, setSelectedTenant] = useState(localStorage.getItem('selected_tenant_id') || '');

  useEffect(() => {
    const token = localStorage.getItem('medsched_token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        const getNormalizedRole = (r) => String(r || 'CLIENTE').toUpperCase();
        let tokenRole = getNormalizedRole(decoded.papel || decoded.role);

        if (['SUPER_ADMIN', 'SYSTEM_ADMIN'].includes(tokenRole)) {
           setUserName('Administrador');
           setRole(tokenRole);
           setThemeColor('#1e1e1e');
           
           // Super Admin: Busca a lista de todas as clínicas para o seletor
           api.get('/tenants').then(res => setTenants(res.data)).catch(() => {});
           return;
        }

        if (decoded.sub) {
          api.get(`/users/${decoded.sub}`, { params: { tenant_id: decoded.tenant_id } })
            .then(response => {
              setUserName(response.data.nome || 'Usuário');
              setRole(getNormalizedRole(response.data.papel || tokenRole));
            })
            .catch(() => {
              setRole(tokenRole);
              setUserName('Usuário');
            });
        }

        // Busca cor da clínica (Usuários normais ou se o Super Admin selecionou uma)
        const targetTenant = decoded.tenant_id || selectedTenant;
        if (targetTenant) {
          api.get(`/tenants/${targetTenant}`)
            .then(res => res.data.cor_primaria && setThemeColor(res.data.cor_primaria))
            .catch(() => {});
        }
      } catch (e) {
        console.error("Erro no token");
      }
    }
  }, [selectedTenant]);

  const handleTenantChange = (e) => {
    const id = e.target.value;
    if (id === "") {
      localStorage.removeItem('selected_tenant_id');
    } else {
      localStorage.setItem('selected_tenant_id', id);
    }
    setSelectedTenant(id);
    window.location.reload(); // Recarrega para aplicar a "máscara" em todos os componentes
  };

  const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard', roles: ['SYSTEM_ADMIN', 'SUPER_ADMIN', 'TENANT_ADMIN', 'GESTOR', 'PROFISSIONAL'] },
    { name: 'Agenda', icon: Calendar, path: '/agenda', roles: ['SYSTEM_ADMIN', 'SUPER_ADMIN', 'TENANT_ADMIN', 'GESTOR', 'PROFISSIONAL', 'CLIENTE'] },
    { name: 'Clientes', icon: UserRound, path: '/clientes', roles: ['SYSTEM_ADMIN', 'SUPER_ADMIN', 'TENANT_ADMIN', 'GESTOR', 'PROFISSIONAL'] },
    { name: 'Usuários', icon: Users, path: '/usuarios', roles: ['SYSTEM_ADMIN', 'SUPER_ADMIN', 'TENANT_ADMIN', 'GESTOR'] },
    { name: 'Serviços', icon: BriefcaseMedical, path: '/servicos', roles: ['SYSTEM_ADMIN', 'SUPER_ADMIN', 'TENANT_ADMIN', 'GESTOR'] },
    { name: 'Recursos', icon: Box, path: '/recursos', roles: ['SYSTEM_ADMIN', 'SUPER_ADMIN', 'TENANT_ADMIN', 'GESTOR'] },
    { name: 'Relatórios', icon: FileText, path: '/relatorios', roles: ['SYSTEM_ADMIN', 'SUPER_ADMIN', 'TENANT_ADMIN', 'GESTOR'] },
    { name: 'Configurações', icon: Settings, path: '/configuracoes', roles: ['SYSTEM_ADMIN', 'SUPER_ADMIN', 'TENANT_ADMIN'] },
    { name: 'Gestão de Clínicas', icon: Building2, path: '/tenants', roles: ['SUPER_ADMIN', 'SYSTEM_ADMIN'] },
  ];

  const allowedMenus = menuItems.filter(item => item.roles.includes(role));

  return (
    <div className="flex h-screen bg-gray-50 font-sans">
      <aside 
        className={`${isCollapsed ? 'w-20' : 'w-64'} text-slate-200 flex flex-col shadow-xl z-20 transition-all duration-300 relative`}
        style={{ backgroundColor: themeColor }}
      >
        <button onClick={() => setIsCollapsed(!isCollapsed)} className="absolute -right-3 top-8 bg-blue-600 text-white rounded-full p-1 shadow-lg z-30">
          {isCollapsed ? <Menu className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>

        <div className={`p-6 border-b border-white/10 flex items-center ${isCollapsed ? 'justify-center px-0' : 'gap-3'}`}>
          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center text-white font-bold">M</div>
          {!isCollapsed && <span className="text-xl font-bold text-white">MedSched</span>}
        </div>

        {/* SELETOR DE TENANT (Exclusivo Super Admin) */}
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

        <div className="p-4 border-t border-white/10 bg-black/20">
          <div className="mb-4 px-2">
            <p className="text-sm font-bold text-white truncate">{userName}</p>
            <p className="text-[10px] text-white/50 uppercase tracking-widest">{role.replace('_', ' ')}</p>
          </div>
          <button onClick={() => { localStorage.clear(); window.location.href = '/login'; }} className="w-full flex items-center justify-center gap-2 py-2 text-xs font-bold text-white/70 hover:text-white hover:bg-white/10 rounded-lg border border-white/10 transition-all">
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
