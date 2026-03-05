import React, { useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import api from '../services/api';
import { LayoutDashboard, Users, Calendar, UserRound, Settings, FileText, LogOut, ChevronLeft, Menu } from 'lucide-react';

export default function Layout({ children }) {
  const [role, setRole] = useState('');
  const [userName, setUserName] = useState('Carregando...');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [themeColor, setThemeColor] = useState('#0f172a');

  useEffect(() => {
    const token = localStorage.getItem('medsched_token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        let tokenRole = decoded.papel || decoded.role || '';

        if (decoded.sub) {
          api.get(`/users/${decoded.sub}`, { params: { tenant_id: decoded.tenant_id } })
            .then(response => {
              const nomeCompleto = response.data.nome || 'Usuário';
              const partesNome = nomeCompleto.split(' ');
              const nomeCurto = partesNome.length > 1 ? `${partesNome[0]} ${partesNome[partesNome.length - 1]}` : nomeCompleto;
              setUserName(nomeCurto);

              const dbRole = response.data.papel || response.data.role || tokenRole || 'CLIENTE';
              setRole(String(dbRole).toUpperCase());
            })
            .catch(() => {
              setUserName('Usuário (Acesso Restrito)');
              setRole('CLIENTE'); 
            });
        }

        const cachedColor = localStorage.getItem('tenant_theme_color');
        if (cachedColor) {
          setThemeColor(cachedColor);
        } else {
          api.get(`/tenants/${decoded.tenant_id}`)
            .then(response => {
              if (response.data && response.data.cor_primaria) {
                setThemeColor(response.data.cor_primaria);
                localStorage.setItem('tenant_theme_color', response.data.cor_primaria);
              }
            })
            .catch(() => {});
        }
      } catch (e) {
        console.error("Token inválido");
      }
    }
  }, []);

  // MATRIZ DE PERMISSÕES DO SISTEMA (Alterado de 'Pacientes' para 'Clientes')
  const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard', roles: ['TENANT_ADMIN', 'PROFISSIONAL'] },
    { name: 'Agenda', icon: Calendar, path: '/agenda', roles: ['TENANT_ADMIN', 'PROFISSIONAL', 'CLIENTE'] },
    { name: 'Clientes', icon: UserRound, path: '/pacientes', roles: ['TENANT_ADMIN', 'PROFISSIONAL'] },
    { name: 'Usuários', icon: Users, path: '/usuarios', roles: ['TENANT_ADMIN'] },
    { name: 'Relatórios', icon: FileText, path: '/relatorios', roles: ['TENANT_ADMIN'] },
    { name: 'Configurações', icon: Settings, path: '/configuracoes', roles: ['TENANT_ADMIN'] },
  ];

  const allowedMenus = menuItems.filter(item => item.roles.includes(role));

  const handleLogout = () => {
    localStorage.removeItem('medsched_token');
    localStorage.removeItem('tenant_theme_color');
    window.location.href = '/login';
  };

  return (
    <div className="flex h-screen bg-gray-50 font-sans">
      <aside 
        className={`${isCollapsed ? 'w-20' : 'w-64'} text-slate-200 flex flex-col shadow-xl z-20 transition-all duration-300 relative`}
        style={{ backgroundColor: themeColor }}
      >
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-8 bg-blue-600 text-white rounded-full p-1 shadow-lg hover:bg-blue-700 transition-colors z-30"
          style={{ border: `2px solid ${themeColor}` }} 
          title={isCollapsed ? "Expandir Menu" : "Recolher Menu"}
        >
          {isCollapsed ? <Menu className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>

        <div className={`p-6 border-b border-white/10 flex items-center ${isCollapsed ? 'justify-center px-0' : 'gap-3'}`}>
          <div className="w-8 h-8 bg-white/20 rounded-lg flex-shrink-0 flex items-center justify-center text-white font-bold shadow-lg backdrop-blur-sm">M</div>
          {!isCollapsed && <span className="text-xl font-bold text-white tracking-wide truncate">MedSched</span>}
        </div>
        
        <nav className="flex-1 py-6 px-3 space-y-1.5 overflow-y-auto overflow-x-hidden">
          {allowedMenus.map((item) => {
            const isActive = window.location.pathname === item.path || (window.location.pathname === '/' && item.path === '/usuarios'); 
            return (
              <a 
                key={item.name} 
                href={item.path} 
                title={isCollapsed ? item.name : ""}
                className={`flex items-center gap-3 py-3 rounded-lg transition-all font-medium whitespace-nowrap ${isCollapsed ? 'justify-center px-0' : 'px-4'} ${isActive ? 'bg-white/20 text-white shadow-md' : 'hover:bg-black/10 hover:text-white'}`}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {!isCollapsed && <span>{item.name}</span>}
              </a>
            );
          })}
        </nav>

        <div 
          className={`p-4 border-t border-white/10 flex flex-col ${isCollapsed ? 'items-center' : ''}`}
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.15)' }}
        >
          {!isCollapsed ? (
            <div className="mb-4 px-2 overflow-hidden">
              <p className="text-sm font-bold text-white truncate" title={userName}>{userName}</p>
              <p className="text-xs text-white/70 font-medium truncate uppercase tracking-wider">
                {role ? role.replace('_', ' ') : '...'}
              </p>
            </div>
          ) : (
            <div className="mb-4 w-8 h-8 rounded-full bg-black/20 border border-white/10 flex items-center justify-center text-xs font-bold text-white" title={`${userName} (${role.replace('_', ' ')})`}>
              {userName.charAt(0).toUpperCase()}
            </div>
          )}
          
          <button 
            onClick={handleLogout} 
            title="Sair do sistema"
            className={`flex items-center justify-center gap-2 py-2 text-sm font-bold text-white/70 hover:text-white hover:bg-black/20 rounded-lg transition-colors border border-white/10 ${isCollapsed ? 'w-10 px-0' : 'w-full px-4'}`}
          >
            <LogOut className="w-4 h-4 flex-shrink-0" /> 
            {!isCollapsed && <span>SAIR</span>}
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto bg-gray-50 relative">
        {children}
      </main>
    </div>
  );
}
