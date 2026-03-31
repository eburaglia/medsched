import React, { useEffect, useState, useMemo } from 'react';
import api from '../services/api';
import { jwtDecode } from 'jwt-decode';
import { Toaster, toast } from 'react-hot-toast';
import Modal from '../components/Modal';
import Layout from '../components/Layout';
import PerformanceBadge from '../components/PerformanceBadge';
import { 
  Plus, Loader2, Search, Edit2, Trash2, Save, X, CalendarDays, MapPin, Flag, Building, Info
} from 'lucide-react';

export default function Holidays() {
  const [holidays, setHolidays] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [perfMetrics, setPerfMetrics] = useState({ network: 0, server: 0, browser: 0, api: 0, total: 0 });

  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); 
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState({ 
    id: '', nome: '', data: '', tipo: 'FEDERAL', havera_expediente: false, tenant_id: ''
  });

  const fetchHolidays = async () => {
    const startTime = performance.now();
    try {
      const token = localStorage.getItem('medsched_token');
      if (!token) return;
      const decoded = jwtDecode(token);
      const tenantId = decoded.tenant_id || localStorage.getItem('selected_tenant_id');
      
      const response = await api.get('/holidays/', { params: { tenant_id: tenantId } });
      const endTime = performance.now(); 
      
      setHolidays(response.data);
      if (modalMode === 'create') setFormData(prev => ({ ...prev, tenant_id: tenantId }));
      
      requestAnimationFrame(() => {
        const renderTime = performance.now();
        const apiTotal = Math.round(endTime - startTime);
        const serverEstimate = Math.round(apiTotal * 0.35);
        setPerfMetrics({
          server: serverEstimate, network: apiTotal - serverEstimate, browser: Math.round(renderTime - endTime),
          api: apiTotal, total: apiTotal + Math.round(renderTime - endTime)
        });
      });
    } catch (err) {
      toast.error("Erro ao buscar feriados");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchHolidays(); }, []);

  const filteredHolidays = useMemo(() => {
    if (!searchTerm) return holidays;
    const lowerSearch = searchTerm.toLowerCase();
    return holidays.filter(h => h.nome.toLowerCase().includes(lowerSearch) || h.tipo.toLowerCase().includes(lowerSearch));
  }, [holidays, searchTerm]);

  const handleOpenCreate = () => { 
    setModalMode('create'); 
    let tenantId = '';
    try {
        const decoded = jwtDecode(localStorage.getItem('medsched_token'));
        tenantId = decoded.tenant_id || localStorage.getItem('selected_tenant_id');
    }catch(e){}

    setFormData({ nome: '', data: '', tipo: 'FEDERAL', havera_expediente: false, tenant_id: tenantId }); 
    setIsModalOpen(true); 
  };

  const handleOpenEdit = (holiday) => {
    setModalMode('edit'); 
    setFormData({ 
      id: holiday.id, nome: holiday.nome, data: holiday.data, tipo: holiday.tipo, 
      havera_expediente: holiday.havera_expediente, tenant_id: holiday.tenant_id 
    });
    setIsModalOpen(true);
  };

  const handleSaveHoliday = async (e) => {
    e.preventDefault(); setIsSaving(true);
    try {
      const payload = { 
        nome: formData.nome, data: formData.data, tipo: formData.tipo, 
        havera_expediente: formData.havera_expediente, tenant_id: formData.tenant_id
      };

      if (modalMode === 'create') { 
        await api.post('/holidays/', payload); 
        toast.success("Feriado cadastrado com sucesso!"); 
      } else { 
        await api.put(`/holidays/${formData.id}`, payload, { params: { tenant_id: formData.tenant_id } }); 
        toast.success("Feriado atualizado!"); 
      }
      setIsModalOpen(false); 
      fetchHolidays(); 
    } catch (err) { 
      toast.error("Erro ao salvar feriado."); 
    } finally { setIsSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Deseja realmente excluir este feriado? A agenda voltará ao normal neste dia.")) return;
    const loadingToast = toast.loading("Excluindo...");
    try {
      const tenantId = formData.tenant_id || jwtDecode(localStorage.getItem('medsched_token')).tenant_id;
      await api.delete(`/holidays/${id}`, { params: { tenant_id: tenantId } });
      toast.success("Excluído com sucesso.", { id: loadingToast });
      fetchHolidays();
    } catch (err) { toast.error("Erro na exclusão.", { id: loadingToast }); }
  };

  const getTipoIcon = (tipo) => {
    switch(tipo) {
      case 'FEDERAL': return <Flag className="w-4 h-4 text-blue-600" />;
      case 'ESTADUAL': return <MapPin className="w-4 h-4 text-green-600" />;
      case 'MUNICIPAL': return <Building className="w-4 h-4 text-orange-600" />;
      default: return <CalendarDays className="w-4 h-4 text-purple-600" />;
    }
  };

  return (
    <Layout>
      <div className="p-8 max-w-5xl mx-auto flex flex-col gap-6">
        <Toaster position="top-right" />

        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={modalMode === 'create' ? "Novo Feriado" : "Editar Feriado"}>
          <form onSubmit={handleSaveHoliday} className="space-y-5">
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg flex items-start gap-3 mb-4">
              <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-blue-800">
                Feriados configurados sem expediente bloquearão automaticamente a agenda para novos agendamentos nesta data.
              </p>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Nome do Feriado</label>
              <input required type="text" placeholder="Ex: Natal, Confraternização..." className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Data</label>
                <input required type="date" className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" value={formData.data} onChange={e => setFormData({...formData, data: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Abrangência</label>
                <select className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" value={formData.tipo} onChange={e => setFormData({...formData, tipo: e.target.value})}>
                  <option value="FEDERAL">Federal / Nacional</option>
                  <option value="ESTADUAL">Estadual</option>
                  <option value="MUNICIPAL">Municipal</option>
                  <option value="AD-HOC">Ad-Hoc (Emenda/Específico)</option>
                </select>
              </div>
            </div>

            <div className="border-t border-slate-200 pt-4 mt-2">
              <label className="flex items-center gap-3 cursor-pointer p-3 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
                <div className="relative flex items-center">
                  <input type="checkbox" className="sr-only peer" checked={formData.havera_expediente} onChange={e => setFormData({...formData, havera_expediente: e.target.value === 'true'})} />
                  <div className={`w-11 h-6 bg-slate-200 rounded-full peer transition-all ${formData.havera_expediente ? 'bg-blue-600' : ''}`}></div>
                  <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-all ${formData.havera_expediente ? 'translate-x-5' : ''}`}></div>
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">Haverá expediente normal?</p>
                  <p className="text-xs text-slate-500">Se ativo, a empresa abrirá e a agenda funcionará normalmente.</p>
                </div>
              </label>
            </div>

            <div className="flex gap-3 pt-4 border-t border-slate-100">
              <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-2 border border-slate-300 rounded-lg font-bold text-slate-600 hover:bg-slate-50">Cancelar</button>
              <button type="submit" disabled={isSaving} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg flex justify-center items-center gap-2 font-bold hover:bg-blue-700">
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Salvar
              </button>
            </div>
          </form>
        </Modal>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
              <CalendarDays className="w-8 h-8 text-blue-600" /> Feriados e Expediente
            </h1>
            <p className="text-slate-500 mt-1">Gerencie os dias em que a empresa não terá atendimento.</p>
          </div>
          <button onClick={handleOpenCreate} className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold shadow-md hover:bg-blue-700 flex items-center gap-2 transition-all">
            <Plus className="w-5 h-5" /> Adicionar Data
          </button>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-200 bg-slate-50">
            <div className="relative max-w-md">
              <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="text" placeholder="Buscar feriado..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-white border-b border-slate-200 text-slate-500 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-6 py-4 font-bold">Data</th>
                  <th className="px-6 py-4 font-bold">Feriado</th>
                  <th className="px-6 py-4 font-bold">Tipo</th>
                  <th className="px-6 py-4 font-bold text-center">Expediente?</th>
                  <th className="px-6 py-4 font-bold text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr><td colSpan="5" className="text-center py-12"><Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto" /></td></tr>
                ) : filteredHolidays.length === 0 ? (
                  <tr><td colSpan="5" className="text-center py-12 text-slate-500 font-medium">Nenhum feriado cadastrado.</td></tr>
                ) : (
                  filteredHolidays.map((h) => (
                    <tr key={h.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-6 py-4 font-bold text-slate-700 whitespace-nowrap">
                        {new Date(h.data).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-900">{h.nome}</td>
                      <td className="px-6 py-4">
                        <span className="flex items-center gap-1.5 text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg w-fit">
                          {getTipoIcon(h.tipo)} {h.tipo}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${h.havera_expediente ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {h.havera_expediente ? 'Sim (Aberto)' : 'Não (Fechado)'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleOpenEdit(h)} className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(h.id)} className="p-1.5 text-red-600 hover:bg-red-100 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex justify-between items-center pt-2">
          <PerformanceBadge metrics={perfMetrics} />
        </div>

      </div>
    </Layout>
  );
}
