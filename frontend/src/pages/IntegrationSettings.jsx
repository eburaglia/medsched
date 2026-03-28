import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Toaster, toast } from 'react-hot-toast';
import Layout from '../components/Layout';
import { Mail, MessageSquare, Smartphone, Save, Loader2, Info, Server, Key, User } from 'lucide-react';

export default function IntegrationSettings() {
  const [activeTab, setActiveTab] = useState('smtp');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Estados dos formulários (serão convertidos para JSON)
  const [smtpConfig, setSmtpConfig] = useState({ host: '', port: '587', user: '', password: '', from_email: '', from_name: 'ServiceSched', use_tls: true });
  const [wppConfig, setWppConfig] = useState({ api_url: '', api_key: '', instance_name: '' });
  const [tgConfig, setTgConfig] = useState({ bot_token: '' });

  const fetchConfigs = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/integrations/');
      res.data.forEach(integration => {
        if (integration.provider === 'smtp') setSmtpConfig(prev => ({ ...prev, ...integration.config_data }));
        if (integration.provider === 'whatsapp') setWppConfig(prev => ({ ...prev, ...integration.config_data }));
        if (integration.provider === 'telegram') setTgConfig(prev => ({ ...prev, ...integration.config_data }));
      });
    } catch (err) {
      toast.error("Erro ao carregar configurações de integração.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchConfigs();
  }, []);

  const handleSave = async (provider) => {
    setIsSaving(true);
    const toastId = toast.loading("Salvando configurações...");
    try {
      let config_data = {};
      if (provider === 'smtp') config_data = smtpConfig;
      if (provider === 'whatsapp') config_data = wppConfig;
      if (provider === 'telegram') config_data = tgConfig;

      await api.put(`/integrations/${provider}`, {
        provider,
        config_data,
        ativo: true
      });
      toast.success("Integração salva com sucesso!", { id: toastId });
    } catch (err) {
      toast.error("Erro ao salvar configuração.", { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Layout>
      <div className="p-8 max-w-4xl mx-auto flex flex-col gap-6">
        <Toaster position="top-right" />
        
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Integrações de Disparo</h1>
          <p className="text-slate-500 mt-1">Configure os canais de comunicação para envio de mensagens automáticas.</p>
        </div>

        {/* TAB NAVIGATION */}
        <div className="flex bg-slate-200/50 p-1 rounded-xl w-full sm:w-fit">
          <button onClick={() => setActiveTab('smtp')} className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'smtp' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            <Mail className="w-4 h-4" /> Servidor de E-mail
          </button>
          <button onClick={() => setActiveTab('whatsapp')} className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'whatsapp' ? 'bg-white text-green-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            <MessageSquare className="w-4 h-4" /> API do WhatsApp
          </button>
          <button onClick={() => setActiveTab('telegram')} className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'telegram' ? 'bg-white text-sky-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            <Smartphone className="w-4 h-4" /> Bot do Telegram
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center p-10"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            {/* ABA SMTP */}
            {activeTab === 'smtp' && (
              <div className="p-6 flex flex-col gap-6">
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg flex items-start gap-3">
                  <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-blue-800">
                    Insira as credenciais do seu servidor SMTP (SendGrid, Mailgun, Amazon SES, Locaweb, etc). É através desta conta que seus clientes receberão os lembretes.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="md:col-span-3">
                    <label className="block text-sm font-bold text-slate-700 mb-1 flex items-center gap-2"><Server className="w-4 h-4"/> Servidor SMTP (Host)</label>
                    <input type="text" placeholder="ex: smtp.mailgun.org" className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" value={smtpConfig.host} onChange={e => setSmtpConfig({...smtpConfig, host: e.target.value})} />
                  </div>
                  <div className="md:col-span-1">
                    <label className="block text-sm font-bold text-slate-700 mb-1">Porta</label>
                    <input type="text" placeholder="587 ou 465" className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" value={smtpConfig.port} onChange={e => setSmtpConfig({...smtpConfig, port: e.target.value})} />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1 flex items-center gap-2"><User className="w-4 h-4"/> Usuário de Autenticação</label>
                    <input type="text" className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" value={smtpConfig.user} onChange={e => setSmtpConfig({...smtpConfig, user: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1 flex items-center gap-2"><Key className="w-4 h-4"/> Senha do SMTP</label>
                    <input type="password" placeholder="••••••••" className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" value={smtpConfig.password} onChange={e => setSmtpConfig({...smtpConfig, password: e.target.value})} />
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">E-mail do Remetente (From)</label>
                    <input type="email" placeholder="contato@suaclinica.com" className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" value={smtpConfig.from_email} onChange={e => setSmtpConfig({...smtpConfig, from_email: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Nome do Remetente</label>
                    <input type="text" placeholder="Clínica Exemplo" className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" value={smtpConfig.from_name} onChange={e => setSmtpConfig({...smtpConfig, from_name: e.target.value})} />
                  </div>
                </div>

                <div className="flex justify-end pt-4 mt-2 border-t border-slate-100">
                  <button onClick={() => handleSave('smtp')} disabled={isSaving} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-bold shadow-md flex items-center gap-2 transition-all">
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Salvar Configuração de E-mail
                  </button>
                </div>
              </div>
            )}

            {/* ABA WHATSAPP */}
            {activeTab === 'whatsapp' && (
              <div className="p-6 flex flex-col gap-6">
                 <div className="bg-green-50 border border-green-200 p-4 rounded-lg flex items-start gap-3">
                  <Info className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-green-800">
                    Integração via API (Ex: Evolution API, Z-API, W-API). Insira a URL do seu provedor e o token de acesso.
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Base URL da API</label>
                  <input type="url" placeholder="https://api.seuservidor.com/v1/" className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500" value={wppConfig.api_url} onChange={e => setWppConfig({...wppConfig, api_url: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Nome da Instância / ID da Conexão</label>
                  <input type="text" placeholder="ex: clinica_matriz" className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500" value={wppConfig.instance_name} onChange={e => setWppConfig({...wppConfig, instance_name: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Global API Key / Token de Acesso</label>
                  <input type="password" placeholder="••••••••••••" className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500" value={wppConfig.api_key} onChange={e => setWppConfig({...wppConfig, api_key: e.target.value})} />
                </div>
                <div className="flex justify-end pt-4 border-t border-slate-100">
                  <button onClick={() => handleSave('whatsapp')} disabled={isSaving} className="bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-lg font-bold shadow-md flex items-center gap-2 transition-all">
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Salvar Integração WhatsApp
                  </button>
                </div>
              </div>
            )}

            {/* ABA TELEGRAM */}
            {activeTab === 'telegram' && (
              <div className="p-6 flex flex-col gap-6">
                 <div className="bg-sky-50 border border-sky-200 p-4 rounded-lg flex items-start gap-3">
                  <Info className="w-5 h-5 text-sky-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-sky-800">
                    Crie um bot no Telegram através do <strong>@BotFather</strong> e cole o Token de Acesso HTTP gerado abaixo.
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Bot Token (HTTP API)</label>
                  <input type="password" placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz..." className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-sky-500" value={tgConfig.bot_token} onChange={e => setTgConfig({...tgConfig, bot_token: e.target.value})} />
                </div>
                <div className="flex justify-end pt-4 border-t border-slate-100">
                  <button onClick={() => handleSave('telegram')} disabled={isSaving} className="bg-sky-600 hover:bg-sky-700 text-white px-6 py-2.5 rounded-lg font-bold shadow-md flex items-center gap-2 transition-all">
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Salvar Bot do Telegram
                  </button>
                </div>
              </div>
            )}

          </div>
        )}
      </div>
    </Layout>
  );
}
