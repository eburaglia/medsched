import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import api from '../services/api';
import { Toaster, toast } from 'react-hot-toast';
import Layout from '../components/Layout';
import { Building2, Save, Loader2, ArrowLeft, MapPin, FileText, Lock, Facebook, Twitter, Instagram, Youtube, Globe, Share2, Layers } from 'lucide-react';

export default function CompanySettings() {
  const navigate = useNavigate();
  const [tenantId, setTenantId] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isCheckingCEP, setIsCheckingCEP] = useState(false);
  
  const [categoriasSistema, setCategoriasSistema] = useState({});
  
  const [formData, setFormData] = useState({
    nome: '', nome_fantasia: '', cnpj: '', inscricao_estadual: '', inscricao_municipal: '',
    categoria_principal: '', subcategoria: '',
    endereco_cep: '', endereco_logradouro: '', endereco_numero: '', endereco_bairro: '',
    endereco_cidade: '', endereco_estado: '',
    // 👇 DRCODE: Agora usamos "handle" (o @usuario) no frontend em vez da URL inteira
    facebook_handle: '', twitter_handle: '', instagram_handle: '', youtube_handle: '', tiktok_handle: ''
  });

  const [fullTenantData, setFullTenantData] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('medsched_token');
    if (token) {
      const decoded = jwtDecode(token);
      const tId = decoded.tenant_id;
      setTenantId(tId);
      fetchCategorias();
      fetchTenantData(tId);
    }
  }, []);

  const fetchCategorias = async () => {
    try {
      const res = await api.get('/utils/categorias');
      setCategoriasSistema(res.data);
    } catch (err) {
      console.error("Erro ao carregar categorias do sistema:", err);
      toast.error("Erro ao carregar lista de categorias.");
    }
  };

  // 👇 DRCODE: Função Ninja para recortar só o nome de usuário da URL que vem do banco
  const extractHandle = (url, domains) => {
    if (!url) return '';
    let handle = url;
    domains.forEach(domain => {
      if (url.includes(domain)) {
        handle = url.split(domain)[1].replace(/^\//, ''); // Pega tudo depois do domínio e remove a barra inicial
      }
    });
    return handle;
  };

  const fetchTenantData = async (id) => {
    try {
      const res = await api.get(`/tenants/${id}`);
      setFullTenantData(res.data);
      setFormData({
        nome: res.data.nome || '',
        nome_fantasia: res.data.nome_fantasia || '',
        cnpj: res.data.cnpj || '',
        inscricao_estadual: res.data.inscricao_estadual || '',
        inscricao_municipal: res.data.inscricao_municipal || '',
        categoria_principal: res.data.categoria_principal || '',
        subcategoria: res.data.subcategoria || '',
        endereco_cep: res.data.endereco_cep || '',
        endereco_logradouro: res.data.endereco_logradouro || '',
        endereco_numero: res.data.endereco_numero || '',
        endereco_bairro: res.data.endereco_bairro || '',
        endereco_cidade: res.data.endereco_cidade || '',
        endereco_estado: res.data.endereco_estado || '',
        // Extraindo os nomes de usuário limpos
        facebook_handle: extractHandle(res.data.facebook_url, ['facebook.com']),
        twitter_handle: extractHandle(res.data.twitter_url, ['x.com', 'twitter.com']),
        instagram_handle: extractHandle(res.data.instagram_url, ['instagram.com']),
        youtube_handle: extractHandle(res.data.youtube_url, ['youtube.com/@', 'youtube.com/c/', 'youtube.com']),
        tiktok_handle: extractHandle(res.data.tiktok_url, ['tiktok.com/@', 'tiktok.com'])
      });
    } catch (err) {
      toast.error("Erro ao carregar os dados da empresa.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCEPLookup = async (cep) => {
    const cleanCEP = cep.replace(/\D/g, '');
    setFormData(prev => ({ ...prev, endereco_cep: cleanCEP }));
    
    if (cleanCEP.length === 8) {
      setIsCheckingCEP(true);
      try {
        const response = await api.get(`/utils/cep/${cleanCEP}`);
        const data = response.data;
        setFormData(prev => ({
          ...prev,
          endereco_logradouro: data.logradouro || '',
          endereco_bairro: data.bairro || '',
          endereco_cidade: data.localidade || '',
          endereco_estado: data.uf || ''
        }));
        toast.success("Endereço localizado com sucesso!");
      } catch (err) { 
        toast.error("CEP não encontrado."); 
      } finally { 
        setIsCheckingCEP(false); 
      }
    }
  };

  // 👇 DRCODE: Função Ninja para montar a URL completa antes de mandar pro banco
  const buildUrl = (handle, base) => {
    if (!handle) return null;
    let clean = handle.trim().replace(/^@/, ''); // Remove o @ se o usuário digitou sem querer
    if (clean.startsWith('http')) return clean; // Se o cara colou a URL inteira por teimosia, aceitamos
    return `${base}${clean}`;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    const loadingToast = toast.loading("Salvando dados...");
    
    try {
      const payload = { 
        ...fullTenantData, 
        ...formData,
        // Montando as URLs completas para salvar
        facebook_url: buildUrl(formData.facebook_handle, 'https://facebook.com/'),
        twitter_url: buildUrl(formData.twitter_handle, 'https://x.com/'),
        instagram_url: buildUrl(formData.instagram_handle, 'https://instagram.com/'),
        youtube_url: buildUrl(formData.youtube_handle, 'https://youtube.com/@'),
        tiktok_url: buildUrl(formData.tiktok_handle, 'https://tiktok.com/@')
      };

      // Limpando os "handles" para não mandar lixo pro backend
      delete payload.facebook_handle;
      delete payload.twitter_handle;
      delete payload.instagram_handle;
      delete payload.youtube_handle;
      delete payload.tiktok_handle;

      await api.put(`/tenants/${tenantId}`, payload);
      toast.success("Dados da empresa atualizados com sucesso!", { id: loadingToast });
    } catch (err) {
      toast.error(err.response?.data?.detail || "Erro ao salvar os dados.", { id: loadingToast });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </Layout>
    );
  }

  const subcategoriasDisponiveis = formData.categoria_principal 
    ? categoriasSistema[formData.categoria_principal] || [] 
    : [];

  return (
    <Layout>
      <div className="p-8 max-w-4xl mx-auto flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4">
        <Toaster position="top-right" />
        
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/configuracoes')} className="p-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 text-slate-600 transition-colors shadow-sm">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
              <Building2 className="w-8 h-8 text-blue-600" /> 
              Dados da Empresa
            </h1>
            <p className="text-slate-500 mt-1">Informações fiscais, segmento de atuação e presença digital.</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
          
          <div className="p-8 space-y-8">
            {/* Seção 1: Identificação e Dados Fiscais */}
            <fieldset>
              <legend className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2 mb-4 border-b border-slate-100 pb-2 w-full">
                <FileText className="w-4 h-4 text-blue-600" /> Identificação e Dados Fiscais
              </legend>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">Razão Social <Lock className="w-3 h-3 text-slate-400"/></label>
                  <input required className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none bg-slate-50 text-slate-500 cursor-not-allowed font-medium" value={formData.nome} disabled title="Para alterar a Razão Social, contate o suporte." />
                  <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">A Razão Social é bloqueada no sistema. Contate o suporte para alterar.</p>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nome Fantasia</label>
                  <input className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" value={formData.nome_fantasia} onChange={e => setFormData({...formData, nome_fantasia: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">CNPJ</label>
                  <input className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" placeholder="00.000.000/0000-00" value={formData.cnpj} onChange={e => setFormData({...formData, cnpj: e.target.value})} />
                </div>
                <div className="hidden md:block"></div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Inscrição Estadual (IE)</label>
                  <input className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" placeholder="Isento ou Número" value={formData.inscricao_estadual} onChange={e => setFormData({...formData, inscricao_estadual: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Inscrição Municipal (IM)</label>
                  <input className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" value={formData.inscricao_municipal} onChange={e => setFormData({...formData, inscricao_municipal: e.target.value})} />
                </div>
              </div>
            </fieldset>

            {/* Seção Segmentação da Empresa */}
            <fieldset>
              <legend className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2 mb-4 border-b border-slate-100 pb-2 w-full">
                <Layers className="w-4 h-4 text-blue-600" /> Segmento de Atuação
              </legend>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 border border-slate-200 rounded-xl shadow-inner">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">1. Categoria Principal</label>
                  <select 
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 font-medium" 
                    value={formData.categoria_principal} 
                    onChange={e => setFormData({...formData, categoria_principal: e.target.value, subcategoria: ''})}
                  >
                    <option value="">Selecione o Macro Segmento...</option>
                    {Object.keys(categoriasSistema).map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">2. Natureza / Especialidade</label>
                  <select 
                    disabled={!formData.categoria_principal}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 font-medium disabled:bg-slate-100 disabled:text-slate-400" 
                    value={formData.subcategoria} 
                    onChange={e => setFormData({...formData, subcategoria: e.target.value})}
                  >
                    <option value="">Selecione a Especialidade...</option>
                    {subcategoriasDisponiveis.map(sub => (
                        <option key={sub} value={sub}>{sub}</option>
                    ))}
                  </select>
                </div>
              </div>
            </fieldset>

            {/* Seção Endereço */}
            <fieldset>
              <legend className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2 mb-4 border-b border-slate-100 pb-2 w-full">
                <MapPin className="w-4 h-4 text-blue-600" /> Endereço de Faturamento
              </legend>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative md:col-span-1">
                  <label className="block text-sm font-medium text-slate-700 mb-1">CEP</label>
                  <input className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" placeholder="00000-000" value={formData.endereco_cep} onChange={e => handleCEPLookup(e.target.value)} />
                  {isCheckingCEP && <Loader2 className="w-4 h-4 animate-spin absolute right-3 top-9 text-blue-500" />}
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Logradouro (Rua, Av)</label>
                  <input className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" value={formData.endereco_logradouro} onChange={e => setFormData({...formData, endereco_logradouro: e.target.value})} />
                </div>
                <div className="md:col-span-1">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Número</label>
                  <input className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" value={formData.endereco_numero} onChange={e => setFormData({...formData, endereco_numero: e.target.value})} />
                </div>
                <div className="md:col-span-1">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Bairro</label>
                  <input className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" value={formData.endereco_bairro} onChange={e => setFormData({...formData, endereco_bairro: e.target.value})} />
                </div>
                <div className="md:col-span-1"></div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Cidade</label>
                  <input className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" value={formData.endereco_cidade} onChange={e => setFormData({...formData, endereco_cidade: e.target.value})} />
                </div>
                <div className="md:col-span-1">
                  <label className="block text-sm font-medium text-slate-700 mb-1">UF</label>
                  <input className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 uppercase" maxLength={2} value={formData.endereco_estado} onChange={e => setFormData({...formData, endereco_estado: e.target.value.toUpperCase()})} />
                </div>
              </div>
            </fieldset>

            {/* 👇 DRCODE: Seção Redes Sociais - Com UI Inteligente */}
            <fieldset>
              <legend className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2 mb-4 border-b border-slate-100 pb-2 w-full">
                <Share2 className="w-4 h-4 text-blue-600" /> Presença Digital e Redes Sociais
              </legend>
              <p className="text-xs text-slate-500 mb-4">Adicione apenas o seu nome de usuário. O sistema montará o link correto para envio de notificações.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Facebook */}
                <div className="relative">
                  <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">Facebook</label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-slate-300 bg-slate-100 text-slate-500 text-xs font-semibold"><Facebook className="w-4 h-4 text-blue-600 mr-1.5" /> facebook.com/</span>
                    <input className="flex-1 w-full px-3 py-2 border border-slate-300 rounded-r-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm font-bold text-slate-700" placeholder="suaclinica" value={formData.facebook_handle} onChange={e => setFormData({...formData, facebook_handle: e.target.value})} />
                  </div>
                </div>

                {/* Instagram */}
                <div className="relative">
                  <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">Instagram</label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-slate-300 bg-slate-100 text-slate-500 text-xs font-semibold"><Instagram className="w-4 h-4 text-pink-600 mr-1.5" /> instagram.com/</span>
                    <input className="flex-1 w-full px-3 py-2 border border-slate-300 rounded-r-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm font-bold text-slate-700" placeholder="suaclinica" value={formData.instagram_handle} onChange={e => setFormData({...formData, instagram_handle: e.target.value})} />
                  </div>
                </div>

                {/* Twitter / X */}
                <div className="relative">
                  <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">X (Twitter)</label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-slate-300 bg-slate-100 text-slate-500 text-xs font-semibold"><Twitter className="w-4 h-4 text-slate-800 mr-1.5" /> x.com/</span>
                    <input className="flex-1 w-full px-3 py-2 border border-slate-300 rounded-r-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm font-bold text-slate-700" placeholder="suaclinica" value={formData.twitter_handle} onChange={e => setFormData({...formData, twitter_handle: e.target.value})} />
                  </div>
                </div>

                {/* YouTube */}
                <div className="relative">
                  <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">YouTube</label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-slate-300 bg-slate-100 text-slate-500 text-xs font-semibold"><Youtube className="w-4 h-4 text-red-600 mr-1.5" /> youtube.com/@</span>
                    <input className="flex-1 w-full px-3 py-2 border border-slate-300 rounded-r-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm font-bold text-slate-700" placeholder="suaclinica" value={formData.youtube_handle} onChange={e => setFormData({...formData, youtube_handle: e.target.value})} />
                  </div>
                </div>

                {/* TikTok */}
                <div className="relative">
                  <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">TikTok</label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-slate-300 bg-slate-100 text-slate-500 text-xs font-semibold"><Globe className="w-4 h-4 text-slate-900 mr-1.5" /> tiktok.com/@</span>
                    <input className="flex-1 w-full px-3 py-2 border border-slate-300 rounded-r-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm font-bold text-slate-700" placeholder="suaclinica" value={formData.tiktok_handle} onChange={e => setFormData({...formData, tiktok_handle: e.target.value})} />
                  </div>
                </div>

              </div>
            </fieldset>

          </div>

          <div className="bg-slate-50 p-6 border-t border-slate-200 flex justify-end">
            <button type="submit" disabled={isSaving || isCheckingCEP} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold shadow-md flex items-center gap-2 transition-all disabled:opacity-50">
              {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              Salvar Dados da Empresa
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
