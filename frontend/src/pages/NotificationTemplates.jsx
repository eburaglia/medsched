import React, { useEffect, useState, useMemo } from 'react';
import api from '../services/api';
import { Toaster, toast } from 'react-hot-toast';
import Modal from '../components/Modal';
import Layout from '../components/Layout';
import { 
  Mail, MessageSquare, Smartphone, BellRing, Edit3, 
  Save, Loader2, Info, CheckCircle2, XCircle, Plus, Filter
} from 'lucide-react';

export default function NotificationTemplates() {
  const [templates, setTemplates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // 👇 DRCODE: Estado para o filtro de canal
  const [filterChannel, setFilterChannel] = useState('all');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('edit'); 
  const [editingTemplate, setEditingTemplate] = useState(null);

  const fetchTemplates = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/notifications/templates');
      setTemplates(res.data);
    } catch (err) {
      toast.error("Erro ao carregar os templates de notificação.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  // 👇 DRCODE: Lógica que filtra os templates de acordo com o Select
  const filteredTemplates = useMemo(() => {
    if (filterChannel === 'all') return templates;
    return templates.filter(t => t.canal === filterChannel);
  }, [templates, filterChannel]);

  const handleOpenCreate = () => {
    setEditingTemplate({
      nome: '',
      canal: 'email',
      assunto: '',
      conteudo: '',
      ativo: true
    });
    setModalMode('create');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (template) => {
    setEditingTemplate({
      id: template.id,
      nome: template.nome,
      assunto: template.assunto || '',
      conteudo: template.conteudo || '',
      ativo: template.ativo,
      canal: template.canal
    });
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleToggleActive = async (template) => {
    const toastId = toast.loading(template.ativo ? "Inativando template..." : "Ativando template...");
    try {
      await api.put(`/notifications/templates/${template.id}`, {
        ativo: !template.ativo
      });
      toast.success(template.ativo ? "Template inativado!" : "Template ativado com sucesso!", { id: toastId });
      fetchTemplates(); 
    } catch (err) {
      toast.error("Erro ao alterar o status do template.", { id: toastId });
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!editingTemplate.conteudo.trim()) return toast.error("O conteúdo da mensagem não pode ficar vazio.");
    if (!editingTemplate.nome.trim()) return toast.error("Dê um nome para este template.");

    setIsSaving(true);
    try {
      if (modalMode === 'create') {
        const codigo_interno = `custom_${editingTemplate.nome.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now()}`;
        const payload = {
          codigo_interno,
          nome: editingTemplate.nome,
          canal: editingTemplate.canal,
          assunto: editingTemplate.assunto || null,
          conteudo: editingTemplate.conteudo,
          ativo: editingTemplate.ativo
        };
        await api.post('/notifications/templates', payload);
        toast.success("Template criado com sucesso!");
      } else {
        const payload = {
          nome: editingTemplate.nome,
          assunto: editingTemplate.assunto || null,
          conteudo: editingTemplate.conteudo,
          ativo: editingTemplate.ativo
        };
        await api.put(`/notifications/templates/${editingTemplate.id}`, payload);
        toast.success("Template atualizado com sucesso!");
      }

      setIsModalOpen(false);
      fetchTemplates(); 
    } catch (err) {
      let msg = "Erro ao salvar o template.";
      if (err.response?.data?.detail) {
        msg = typeof err.response.data.detail === 'string' ? err.response.data.detail : "Erro de validação.";
      }
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const getChannelIcon = (canal) => {
    switch(canal) {
      case 'email': return <Mail className="w-5 h-5 text-blue-500" />;
      case 'whatsapp': return <MessageSquare className="w-5 h-5 text-green-500" />;
      case 'telegram': return <Smartphone className="w-5 h-5 text-sky-500" />;
      case 'in_app': return <BellRing className="w-5 h-5 text-amber-500" />;
      default: return <BellRing className="w-5 h-5 text-slate-500" />;
    }
  };

  const getChannelName = (canal) => {
    switch(canal) {
      case 'email': return 'E-mail';
      case 'whatsapp': return 'WhatsApp';
      case 'telegram': return 'Telegram';
      case 'in_app': return 'Notificação In-App';
      default: return canal;
    }
  };

  return (
    <Layout>
      <div className="p-8 max-w-6xl mx-auto flex flex-col gap-6">
        <Toaster position="top-right" />
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Mensageria e Notificações</h1>
            <p className="text-slate-500 mt-1">Configure os textos e regras de disparo automático para seus clientes.</p>
          </div>
          
          {/* 👇 DRCODE: Área de Filtro e Criação agrupada */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Filter className="h-4 w-4 text-slate-400" />
              </div>
              <select 
                className="pl-9 pr-8 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 shadow-sm appearance-none cursor-pointer"
                value={filterChannel}
                onChange={(e) => setFilterChannel(e.target.value)}
              >
                <option value="all">Todos os Canais</option>
                <option value="email">E-mail</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="telegram">Telegram</option>
                <option value="in_app">Sistema (In-App)</option>
              </select>
            </div>

            <button onClick={handleOpenCreate} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-blue-200 flex items-center gap-2 transition-all">
              <Plus className="w-4 h-4" /> Novo Template
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center p-20">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : templates.length === 0 ? (
          <div className="bg-white p-10 rounded-xl border border-slate-200 text-center shadow-sm">
            <BellRing className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-700">Nenhum template cadastrado</h3>
            <p className="text-slate-500 text-sm mt-1">Clique em "Novo Template" para criar o seu primeiro modelo de mensagem.</p>
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="bg-slate-50 p-10 rounded-xl border border-dashed border-slate-300 text-center">
            <Filter className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-600">Nenhum resultado para este filtro</h3>
            <p className="text-slate-500 text-sm mt-1">Você não possui templates configurados para este canal.</p>
            <button onClick={() => setFilterChannel('all')} className="mt-4 text-blue-600 font-bold text-sm hover:underline">
              Limpar Filtro
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map(template => (
              <div key={template.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col transition-all hover:shadow-md hover:border-blue-200">
                <div className="p-5 flex-1">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-100">
                      {getChannelIcon(template.canal)}
                      <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">{getChannelName(template.canal)}</span>
                    </div>
                    
                    <button 
                      onClick={() => handleToggleActive(template)}
                      title={template.ativo ? "Clique para desativar este disparo" : "Clique para ativar este disparo"}
                      className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-md border transition-colors cursor-pointer ${
                        template.ativo 
                          ? 'text-green-700 bg-green-50 border-green-200 hover:bg-green-100' 
                          : 'text-slate-500 bg-slate-50 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {template.ativo ? <CheckCircle2 className="w-3 h-3"/> : <XCircle className="w-3 h-3"/>}
                      {template.ativo ? 'ATIVO' : 'INATIVO'}
                    </button>

                  </div>
                  <h3 className="font-bold text-slate-800 text-lg leading-tight">{template.nome}</h3>
                  <p className="text-sm text-slate-500 mt-2 line-clamp-3">
                    {template.conteudo}
                  </p>
                </div>
                <div className="bg-slate-50 p-3 border-t border-slate-100 flex gap-2">
                  <button 
                    onClick={() => handleOpenEdit(template)}
                    className="flex-1 flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 hover:text-blue-600 hover:border-blue-300 font-bold text-sm py-2 rounded-lg transition-colors shadow-sm"
                  >
                    <Edit3 className="w-4 h-4" /> Configurar Mensagem
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* MODAL MANTIDO EXATAMENTE IGUAL... */}
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={modalMode === 'create' ? "Criar Novo Template" : "Configurar Template"}>
          {editingTemplate && (
            <form onSubmit={handleSave} className="flex flex-col gap-4 max-h-[80vh] overflow-y-auto pr-2">
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg flex items-start gap-3 shrink-0">
                <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-bold mb-1">Variáveis Dinâmicas Suportadas:</p>
                  <ul className="list-disc pl-4 space-y-0.5 text-xs opacity-90 font-medium">
                    <li><code className="bg-blue-100 px-1 rounded text-blue-900">{"{{cliente_nome}}"}</code> - Nome do cliente</li>
                    <li><code className="bg-blue-100 px-1 rounded text-blue-900">{"{{servico_nome}}"}</code> - Nome do serviço executado</li>
                    <li><code className="bg-blue-100 px-1 rounded text-blue-900">{"{{data_hora}}"}</code> - Data e hora do agendamento</li>
                    <li><code className="bg-blue-100 px-1 rounded text-blue-900">{"{{empresa_nome}}"}</code> - O nome da sua empresa</li>
                  </ul>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Nome de Exibição do Template *</label>
                  <input 
                    type="text" 
                    required 
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm" 
                    placeholder="Ex: Aviso de Férias"
                    value={editingTemplate.nome} 
                    onChange={e => setEditingTemplate({...editingTemplate, nome: e.target.value})} 
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Canal de Disparo</label>
                  <select 
                    disabled={modalMode === 'edit'} 
                    className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm disabled:bg-slate-100" 
                    value={editingTemplate.canal} 
                    onChange={e => setEditingTemplate({...editingTemplate, canal: e.target.value})}
                  >
                    <option value="email">E-mail</option>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="telegram">Telegram</option>
                    <option value="in_app">Notificação no Sistema (In-App)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-200">
                <label className="text-sm font-bold text-slate-700 cursor-pointer select-none">Ativar este disparo automático?</label>
                <div className="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in">
                  <input 
                    type="checkbox" 
                    id="toggle-ativo" 
                    checked={editingTemplate.ativo} 
                    onChange={e => setEditingTemplate({...editingTemplate, ativo: e.target.checked})}
                    className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer transition-transform duration-200 ease-in-out"
                    style={{ transform: editingTemplate.ativo ? 'translateX(100%)' : 'translateX(0)', borderColor: editingTemplate.ativo ? '#2563eb' : '#cbd5e1' }}
                  />
                  <label htmlFor="toggle-ativo" className={`toggle-label block overflow-hidden h-6 rounded-full bg-slate-300 cursor-pointer ${editingTemplate.ativo ? 'bg-blue-600' : ''}`}></label>
                </div>
              </div>

              {(editingTemplate.canal === 'email' || editingTemplate.canal === 'in_app') && (
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Assunto / Título da Notificação *</label>
                  <input 
                    type="text" 
                    required 
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm" 
                    value={editingTemplate.assunto} 
                    onChange={e => setEditingTemplate({...editingTemplate, assunto: e.target.value})} 
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Corpo da Mensagem *</label>
                <textarea 
                  required 
                  rows={6}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 resize-none font-mono text-sm" 
                  value={editingTemplate.conteudo} 
                  onChange={e => setEditingTemplate({...editingTemplate, conteudo: e.target.value})} 
                />
                <p className="text-xs text-slate-500 mt-1 font-medium">No caso de e-mails, o cabeçalho e rodapé (com o logo) serão anexados automaticamente a este texto.</p>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-200 mt-2 shrink-0">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-2 border border-slate-300 text-slate-600 font-bold rounded-lg hover:bg-slate-50">
                  Cancelar
                </button>
                <button type="submit" disabled={isSaving} className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg flex justify-center items-center gap-2 shadow-sm">
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Salvar Template
                </button>
              </div>
            </form>
          )}
        </Modal>
      </div>
    </Layout>
  );
}
