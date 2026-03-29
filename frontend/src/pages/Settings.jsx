import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import api from '../services/api';
import Layout from '../components/Layout';
import PerformanceBadge from '../components/PerformanceBadge'; // 👇 Importamos o componente
import { Settings2, CreditCard, Shield, Bell, ArrowRight, Palette, Save, Plug } from 'lucide-react';

export default function Settings() {
  const navigate = useNavigate();
  
  const [corPrimaria, setCorPrimaria] = useState('#0f172a');
  const [tenantId, setTenantId] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  const [perfMetrics, setPerfMetrics] = useState({ network: 0, server: 0, browser: 0, api: 0, total: 0 });

  // Guardando os dados inteiros do Tenant para o PUT
  const [fullTenantData, setFullTenantData] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('medsched_token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        const selectedTenant = localStorage.getItem('selected_tenant_id');
        const targetId = selectedTenant || decoded.tenant_id;

        if (targetId) {
          setTenantId(targetId);
          
          const startTime = performance.now(); // Inicia o cronômetro
          
          api.get(`/tenants/${targetId}`).then(res => {
            const endTime = performance.now(); // Fim da API
            
            setFullTenantData(res.data);
            
            const configVisuais = res.data.configuracoes_visuais || {};
            if (configVisuais.cor_primaria) {
              setCorPrimaria(configVisuais.cor_primaria);
            }

            // Calcula a performance do render
            requestAnimationFrame(() => {
              const renderTime = performance.now();
              const apiTotal = Math.round(endTime - startTime);
              const serverEstimate = Math.round(apiTotal * 0.35);
              const networkEstimate = apiTotal - serverEstimate;
              const browserEstimate = Math.round(renderTime - endTime);
              
              setPerfMetrics({
                server: serverEstimate,
                network: networkEstimate,
                browser: browserEstimate,
                api: apiTotal,
                total: apiTotal + browserEstimate
              });
            });

          }).catch(console.error);
        }
      } catch (e) {
        console.error("Erro ao decodificar token");
      }
    }
  }, []);

  const salvarCores = async () => {
    if (!tenantId || !fullTenantData) return;
    setIsSaving(true);
    
    try {
      const dadosAtualizados = {
        ...fullTenantData,
        configuracoes_visuais: { cor_primaria: corPrimaria }
      };

      await api.put(`/tenants/${tenantId}`, dadosAtualizados);
      window.location.reload(); 
    } catch (error) {
      console.error("Erro ao salvar cores", error);
      alert("Erro ao salvar as configurações visuais.");
    } finally {
      setIsSaving(false);
    }
  };

  const menuItems = [
    {
      title: "Regras de Faturamento",
      description: "Taxas de maquininhas, bancos e gestão de convênios/parcerias.",
      icon: <CreditCard className="w-6 h-6" />,
      path: "/configuracoes/faturamento",
      active: true
    },
    // 👇 DRCODE: Novo Botão de Templates de Notificação
    {
      title: "Mensageria e Templates",
      description: "Configure os textos de e-mail, WhatsApp e avisos automáticos do sistema.",
      icon: <Bell className="w-6 h-6" />,
      path: "/configuracoes/notificacoes",
      active: true
    },
    // 👇 DRCODE: Novo Botão de Integrações
    {
      title: "Integrações Externas",
      description: "Conecte seu servidor de E-mail (SMTP), API do WhatsApp e Bot do Telegram.",
      icon: <Plug className="w-6 h-6" />,
      path: "/configuracoes/integracoes",
      active: true
    },
    {
      title: "Segurança e Acesso",
      description: "Controle de permissões por perfil e logs de auditoria.",
      icon: <Shield className="w-6 h-6" />,
      path: "/configuracoes/seguranca",
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

        <div className="mt-4 bg-white border border-gray-200 rounded-2xl p-6 md:p-8 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-6">
            <Palette className="w-6 h-6 text-blue-600" />
            Identidade Visual
          </h2>
          <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Cor Principal do Sistema</label>
              <p className="text-sm text-gray-500 mb-4">Esta cor será aplicada no menu lateral e nos botões de destaque para customizar o ambiente com a marca da sua clínica.</p>
              
              <div className="flex items-center gap-4">
                <input
                  type="color"
                  value={corPrimaria}
                  onChange={(e) => setCorPrimaria(e.target.value)}
                  className="w-16 h-16 p-1 rounded-lg cursor-pointer border border-gray-300 shadow-sm hover:shadow transition-all"
                />
                <div className="text-sm font-mono bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600">
                  {corPrimaria.toUpperCase()}
                </div>
              </div>
            </div>
            
            <button
              onClick={salvarCores}
              disabled={isSaving || !fullTenantData}
              className="flex items-center gap-2 bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-5 h-5" />
              {isSaving ? "Salvando..." : "Salvar Configuração"}
            </button>
          </div>
        </div>

        {/* 👇 DRCODE: Nosso novo componente de performance adicionado no rodapé */}
        <div className="flex justify-between items-center text-xs text-gray-500 pt-2 pb-8 border-t border-gray-200 mt-4">
          <PerformanceBadge metrics={perfMetrics} />
        </div>

      </div>
    </Layout>
  );
}
