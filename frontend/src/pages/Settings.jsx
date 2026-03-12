import React from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { Settings2, CreditCard, Shield, Bell, ArrowRight } from 'lucide-react';

export default function Settings() {
  const navigate = useNavigate();

  const menuItems = [
    {
      title: "Regras de Faturamento",
      description: "Taxas de maquininhas, bancos e gestão de convênios/parcerias.",
      icon: <CreditCard className="w-6 h-6" />,
      path: "/configuracoes/faturamento",
      active: true
    },
    {
      title: "Segurança e Acesso",
      description: "Controle de permissões por perfil e logs de auditoria.",
      icon: <Shield className="w-6 h-6" />,
      path: "/configuracoes/seguranca",
      active: false
    },
    {
      title: "Notificações",
      description: "Configurações de avisos por WhatsApp, E-mail e SMS.",
      icon: <Bell className="w-6 h-6" />,
      path: "/configuracoes/notificacoes",
      active: false
    }
  ];

  return (
    <Layout>
      <div className="p-8 max-w-5xl mx-auto flex flex-col gap-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Settings2 className="w-8 h-8 text-blue-600" /> 
            Configurações
          </h1>
          <p className="text-gray-500 mt-1 text-lg">Administração geral e regras de negócio do sistema.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {menuItems.map((item, index) => (
            <button
              key={index}
              onClick={() => item.active && navigate(item.path)}
              className={`group p-6 bg-white border rounded-2xl text-left transition-all flex items-start gap-5 ${
                item.active 
                ? 'border-gray-200 hover:border-blue-500 hover:shadow-md cursor-pointer' 
                : 'border-gray-100 opacity-60 cursor-not-allowed'
              }`}
            >
              <div className={`p-3 rounded-xl transition-colors ${
                item.active ? 'bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white' : 'bg-gray-50 text-gray-400'
              }`}>
                {item.icon}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-gray-900">{item.title}</h3>
                  {item.active && <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500 transform group-hover:translate-x-1 transition-all" />}
                </div>
                <p className="text-sm text-gray-500 mt-1 leading-relaxed">{item.description}</p>
                {!item.active && <span className="inline-block mt-2 text-[10px] font-bold bg-gray-100 text-gray-500 px-2 py-0.5 rounded uppercase">Em Breve</span>}
              </div>
            </button>
          ))}
        </div>
      </div>
    </Layout>
  );
}
