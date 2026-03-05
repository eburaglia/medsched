import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Home, Calendar, Users, FileText, DollarSign, Settings, LogOut, 
  TrendingUp, Clock, Activity, ShieldCheck 
} from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState('ADMIN'); 

  useEffect(() => {
    const token = localStorage.getItem('medsched_token');
    if (!token) {
      navigate('/login');
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('medsched_token');
    navigate('/login');
  };

  const menuItems = [
    { name: 'Visão Geral', icon: Home, path: '/dashboard', roles: ['ADMIN', 'MEDICO', 'RECEPCAO'] },
    { name: 'Agenda', icon: Calendar, path: '/agenda', roles: ['ADMIN', 'MEDICO', 'RECEPCAO'] },
    { name: 'Pacientes', icon: Users, path: '/pacientes', roles: ['ADMIN', 'MEDICO', 'RECEPCAO'] },
    { name: 'Prontuários', icon: FileText, path: '/prontuarios', roles: ['ADMIN', 'MEDICO'] },
    { name: 'Financeiro', icon: DollarSign, path: '/financeiro', roles: ['ADMIN'] },
    { name: 'Usuários', icon: ShieldCheck, path: '/usuarios', roles: ['ADMIN'] }, // Nova opção adicionada
    { name: 'Configurações', icon: Settings, path: '/configuracoes', roles: ['ADMIN'] },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* SIDEBAR */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col justify-between">
        <div>
          <div className="h-16 flex items-center px-6 border-b border-gray-200">
            <div className="bg-blue-600 p-1.5 rounded-lg mr-3">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">MedSched</span>
          </div>

          <nav className="p-4 space-y-1">
            {menuItems.map((item) => {
              if (!item.roles.includes(userRole)) return null;
              const isActive = item.name === 'Visão Geral';
              return (
                <button
                  key={item.name}
                  onClick={() => navigate(item.path)}
                  className={`w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                    isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <item.icon className={`w-5 h-5 mr-3 ${isActive ? 'text-blue-700' : 'text-gray-400'}`} />
                  {item.name}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center mb-4 px-2">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold mr-3">
              A
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Admin</p>
              <p className="text-xs text-gray-500">{userRole}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="w-full flex items-center px-3 py-2 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 transition-colors">
            <LogOut className="w-5 h-5 mr-3" />
            Sair do Sistema
          </button>
        </div>
      </div>

      {/* ÁREA PRINCIPAL */}
      <div className="flex-1 overflow-auto">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center px-8">
          <h1 className="text-2xl font-semibold text-gray-900">Visão Geral</h1>
        </header>

        <main className="p-8 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Cards simplificados para brevidade */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center">
              <div className="bg-blue-50 p-4 rounded-lg mr-4"><Calendar className="w-6 h-6 text-blue-600" /></div>
              <div><p className="text-sm font-medium text-gray-500">Atendimentos Hoje</p><h3 className="text-2xl font-bold text-gray-900">8</h3></div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center">
              <div className="bg-orange-50 p-4 rounded-lg mr-4"><Clock className="w-6 h-6 text-orange-600" /></div>
              <div><p className="text-sm font-medium text-gray-500">Aguardando</p><h3 className="text-2xl font-bold text-gray-900">2</h3></div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center">
              <div className="bg-green-50 p-4 rounded-lg mr-4"><TrendingUp className="w-6 h-6 text-green-600" /></div>
              <div><p className="text-sm font-medium text-gray-500">Receita (Hoje)</p><h3 className="text-2xl font-bold text-gray-900">R$ 1.250</h3></div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center">
              <div className="bg-red-50 p-4 rounded-lg mr-4"><DollarSign className="w-6 h-6 text-red-600" /></div>
              <div><p className="text-sm font-medium text-gray-500">A Receber</p><h3 className="text-2xl font-bold text-gray-900">R$ 450</h3></div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-64 flex items-center justify-center text-gray-400">
            Próximos pacientes...
          </div>
        </main>
      </div>
    </div>
  );
}
