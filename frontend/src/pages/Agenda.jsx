import React, { useEffect, useState, useMemo } from 'react';
import api from '../services/api';
import { jwtDecode } from 'jwt-decode';
import { Toaster, toast } from 'react-hot-toast';
import Modal from '../components/Modal';
import Layout from '../components/Layout';
import { 
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, 
  User, Loader2, Save, CalendarDays, Download, Edit2, Lock, 
  RefreshCw, CheckCircle2, AlertTriangle, List
} from 'lucide-react';

export default function Agenda() {
  const [appointments, setAppointments] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [professionals, setProfessionals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  
  const [isDailyModalOpen, setIsDailyModalOpen] = useState(false);
  const [selectedDailyCell, setSelectedDailyCell] = useState(null);

  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedProfessional, setSelectedProfessional] = useState('');

  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceRule, setRecurrenceRule] = useState({ frequencia: 'SEMANAL', quantidade_sessoes: 4 });
  const [projection, setProjection] = useState(null);
  const [isProjecting, setIsProjecting] = useState(false);

  const [formData, setFormData] = useState({
    customer_id: '', profissional_id: '', data_hora_inicio: '',
    data_hora_fim: '', status: 'pendente', observacoes_internas: '', tenant_id: ''
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('medsched_token');
      if (!token) return;
      const decoded = jwtDecode(token);
      const tenantId = decoded.tenant_id;

      const [appRes, custRes, profRes] = await Promise.all([
        api.get('/appointments/', { params: { tenant_id: tenantId } }),
        api.get('/customers/', { params: { tenant_id: tenantId } }),
        api.get('/users/', { params: { tenant_id: tenantId } })
      ]);

      setAppointments(appRes.data);
      setCustomers(custRes.data.filter(c => c.status?.toLowerCase() === 'ativo'));
      setProfessionals(profRes.data.filter(u => 
        u.status?.toUpperCase() === 'ATIVO' && 
        ['PROFISSIONAL', 'TENANT_ADMIN'].includes(u.papel || u.role)
      ));
    } catch (err) {
      toast.error("Erro ao sincronizar dados da agenda.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  const today = () => setCurrentDate(new Date());

  const filteredAppointments = useMemo(() => {
    if (!selectedProfessional) return appointments;
    return appointments.filter(app => app.profissional_id === selectedProfessional);
  }, [appointments, selectedProfessional]);

  const calendarCells = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();
    const cells = [];

    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      const prevDate = new Date(year, month - 1, daysInPrevMonth - i);
      cells.push({ type: 'prev', day: daysInPrevMonth - i, date: prevDate, id: `prev-${i}`, appointments: [] });
    }
    
    for (let d = 1; d <= daysInMonth; d++) {
      const cellDate = new Date(year, month, d);
      const dayAppointments = filteredAppointments.filter(app => {
        const appDate = new Date(app.data_hora_inicio);
        return appDate.getDate() === d && appDate.getMonth() === month && appDate.getFullYear() === year;
      });
      dayAppointments.sort((a, b) => new Date(a.data_hora_inicio) - new Date(b.data_hora_inicio));
      cells.push({ type: 'current', day: d, date: cellDate, appointments: dayAppointments, id: `curr-${d}` });
    }
    
    const remainingCells = 42 - cells.length;
    for (let d = 1; d <= remainingCells; d++) {
      const nextDate = new Date(year, month + 1, d);
      cells.push({ type: 'next', day: d, date: nextDate, id: `next-${d}`, appointments: [] });
    }
    
    return cells;
  }, [currentDate, filteredAppointments]);

  const handleOpenCreate = (date = null) => {
    setModalMode('create');
    setEditingId(null);
    setIsRecurring(false);
    setProjection(null);

    let start = new Date();
    if (date) { start = new Date(date); start.setHours(9, 0, 0); }
    let end = new Date(start); end.setHours(start.getHours() + 1);

    const format = (d) => {
        d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
        return d.toISOString().slice(0, 16);
    };

    setFormData({
      customer_id: '', profissional_id: selectedProfessional || jwtDecode(localStorage.getItem('medsched_token')).sub,
      data_hora_inicio: format(start), data_hora_fim: format(end),
      status: 'pendente', observacoes_internas: '', tenant_id: jwtDecode(localStorage.getItem('medsched_token')).tenant_id
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (app) => {
    if (app.status === 'concluido') { toast.error("Registros concluídos não podem ser editados."); return; }
    const format = (iso) => {
        const d = new Date(iso);
        d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
        return d.toISOString().slice(0, 16);
    };
    setModalMode('edit');
    setEditingId(app.id);
    setIsRecurring(false);
    setFormData({ ...app, data_hora_inicio: format(app.data_hora_inicio), data_hora_fim: format(app.data_hora_fim), observacoes_internas: app.observacoes_internas || '' });
    setIsModalOpen(true);
  };

  const handleProjectRecurrence = async () => {
    if (!formData.customer_id || !formData.profissional_id) { toast.error("Selecione o Cliente e o Profissional primeiro."); return; }
    setIsProjecting(true);
    try {
        const payload = {
            customer_id: formData.customer_id, profissional_id: formData.profissional_id,
            data_hora_inicio_base: new Date(formData.data_hora_inicio).toISOString(), data_hora_fim_base: new Date(formData.data_hora_fim).toISOString(),
            frequencia: recurrenceRule.frequencia, quantidade_sessoes: recurrenceRule.quantidade_sessoes, tenant_id: formData.tenant_id
        };
        const res = await api.post('/appointments/recorrencia/projecao', payload);
        setProjection(res.data);
    } catch (err) { toast.error("Erro ao simular recorrência."); } finally { setIsProjecting(false); }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const startIso = new Date(formData.data_hora_inicio).toISOString();
      const endIso = new Date(formData.data_hora_fim).toISOString();

      if (isRecurring && projection) {
          const batchPayload = {
              agendamentos: projection.sessoes.map(s => ({
                  customer_id: formData.customer_id, profissional_id: formData.profissional_id,
                  data_hora_inicio: s.data_hora_inicio, data_hora_fim: s.data_hora_fim,
                  status: formData.status, observacoes_internas: formData.observacoes_internas, tenant_id: formData.tenant_id
              }))
          };
          await api.post('/appointments/recorrencia/lote', batchPayload);
          toast.success(`${projection.quantidade_solicitada} agendamentos criados!`);
      } else {
          const payload = { ...formData, data_hora_inicio: startIso, data_hora_fim: endIso };
          if (modalMode === 'create') await api.post('/appointments/', payload);
          else await api.put(`/appointments/${editingId}`, payload, { params: { tenant_id: formData.tenant_id } });
          toast.success("Agenda atualizada!");
      }

      setIsModalOpen(false);
      if (isDailyModalOpen) setIsDailyModalOpen(false);
      fetchData();
    } catch (err) { toast.error("Erro ao salvar os registros."); } finally { setIsSaving(false); }
  };

  const handleExportDailyCSV = () => {
    if (!selectedDailyCell || selectedDailyCell.appointments.length === 0) return;
    const csvRows = ['Horário,Status,Profissional,Cliente,Observações'];
    selectedDailyCell.appointments.forEach(app => {
      const time = new Date(app.data_hora_inicio).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
      const customer = customers.find(c => c.id === app.customer_id)?.nome || 'Cliente';
      const professional = professionals.find(p => p.id === app.profissional_id)?.nome || 'Prof';
      csvRows.push(`"${time}","${app.status}","${professional}","${customer}","${app.observacoes_internas || ''}"`);
    });
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Agenda_${selectedDailyCell.date.toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const getSolidStatusStyle = (status) => {
    switch(status?.toLowerCase()) {
      case 'confirmado': return { backgroundColor: '#3b82f6', color: '#ffffff', borderColor: '#2563eb' };
      case 'concluido': return { backgroundColor: '#10b981', color: '#ffffff', borderColor: '#059669' };
      case 'cancelado_cliente': case 'cancelado_profissional': case 'no_show': return { backgroundColor: '#64748b', color: '#ffffff', borderColor: '#475569' };
      default: return { backgroundColor: '#f59e0b', color: '#ffffff', borderColor: '#d97706' };
    }
  };

  const getCustomerName = (id) => customers.find(c => c.id === id)?.nome || 'Cliente';
  const getProfName = (id) => professionals.find(p => p.id === id)?.nome || 'Profissional';

  const todayAtMidnight = new Date();
  todayAtMidnight.setHours(0, 0, 0, 0);

  return (
    <Layout>
      <div className="flex flex-col h-screen bg-white">
        <Toaster position="top-right" />

        <header className="flex flex-wrap items-center justify-between px-8 py-4 border-b border-slate-200 bg-white gap-4 flex-shrink-0">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-50 rounded-lg"><CalendarDays className="w-6 h-6 text-blue-600" /></div>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">Agenda</h1>
            </div>
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 ml-4">
                <button onClick={prevMonth} className="p-1.5 hover:bg-white rounded-md text-slate-600"><ChevronLeft className="w-4 h-4" /></button>
                <button onClick={today} className="px-3 py-1 text-xs font-bold text-slate-700 hover:bg-white rounded-md uppercase">MÊS</button>
                <button onClick={nextMonth} className="p-1.5 hover:bg-white rounded-md text-slate-600"><ChevronRight className="w-4 h-4" /></button>
            </div>
            <h2 className="text-lg font-bold text-slate-800 ml-2">{monthNames[currentDate.getMonth()]} <span className="text-slate-400 font-medium">{currentDate.getFullYear()}</span></h2>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 focus-within:ring-2 focus-within:ring-blue-500">
              <User className="w-4 h-4 text-slate-400 mr-2" />
              <select className="bg-transparent outline-none text-sm font-bold text-slate-700 w-48 truncate" value={selectedProfessional} onChange={e => setSelectedProfessional(e.target.value)}>
                <option value="">Todos os Profissionais</option>
                {professionals.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
              </select>
            </div>
            <button onClick={() => handleOpenCreate()} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-blue-200 flex items-center gap-2">
              <Plus className="w-4 h-4" /> NOVO AGENDAMENTO
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto bg-slate-50/50 p-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
            <div className="border-b border-slate-200 bg-slate-50 sticky top-0 z-10 grid grid-cols-7">
              {weekDays.map(day => (<div key={day} className="py-3 text-center text-xs font-bold text-slate-500 uppercase">{day}</div>))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gridAutoRows: 'minmax(130px, 1fr)' }}>
              {isLoading ? (
                <div className="col-span-7 py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
              ) : (
                calendarCells.map((cell) => {
                  const isToday = cell.type === 'current' && cell.date.toDateString() === new Date().toDateString();
                  const isMuted = cell.type !== 'current';
                  const isPast = cell.date < todayAtMidnight;
                  const totalAppts = cell.appointments.length;
                  const completedAppts = cell.appointments.filter(a => a.status === 'concluido').length;
                  
                  return (
                    <div 
                      key={cell.id} 
                      onClick={() => !isMuted && (setSelectedDailyCell(cell), setIsDailyModalOpen(true))}
                      className={`p-2 flex flex-col group transition-all border-r border-b border-slate-200 ${isMuted ? 'opacity-40 grayscale' : 'cursor-pointer bg-white hover:bg-slate-50'} ${isToday ? 'ring-2 ring-inset ring-blue-500 z-10' : ''}`}
                      style={isMuted ? {backgroundImage: 'repeating-linear-gradient(45deg, #f8fafc, #f8fafc 6px, #f1f5f9 6px, #f1f5f9 12px)'} : {}}
                    >
                      <div className="flex justify-between items-start">
                        <span className={`text-sm font-bold w-7 h-7 flex items-center justify-center rounded-lg ${isToday ? 'bg-blue-600 text-white' : 'text-slate-600'}`}>{cell.day}</span>
                        {!isMuted && <button onClick={(e) => {e.stopPropagation(); handleOpenCreate(cell.date)}} className="opacity-0 group-hover:opacity-100 p-1 hover:bg-blue-100 rounded text-blue-600"><Plus className="w-4 h-4" /></button>}
                      </div>
                      <div className="flex-1"></div>
                      {!isMuted && totalAppts > 0 && (
                        <div className="flex flex-col gap-1 w-full">
                          <div className="text-[11px] px-2 py-1 rounded border border-slate-200" style={{backgroundColor: '#EDE8D0'}}>Agendados = <strong>{totalAppts}</strong></div>
                          {completedAppts > 0 && <div className="text-[11px] px-2 py-1 rounded border border-[#76d676]" style={{backgroundColor: '#88E788'}}>Concluídos = <strong>{completedAppts}</strong></div>}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <Modal isOpen={isDailyModalOpen} onClose={() => setIsDailyModalOpen(false)} title={`Dia ${selectedDailyCell?.date?.toLocaleDateString('pt-BR')}`}>
          <div className="flex justify-end mb-4">
            <button onClick={handleExportDailyCSV} className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-bold border border-slate-300">
                <Download className="w-4 h-4" /> Exportar CSV
            </button>
          </div>
          <div className="border border-slate-200 rounded-xl overflow-auto max-h-[50vh]">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] sticky top-0">
                <tr><th className="px-4 py-3">Horário</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Profissional</th><th className="px-4 py-3">Cliente</th><th className="px-4 py-3 text-center">Ação</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {selectedDailyCell?.appointments.map(app => (
                  <tr key={app.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-bold">{new Date(app.data_hora_inicio).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                    <td className="px-4 py-3"><span className="px-2 py-1 rounded text-[10px] font-bold uppercase border" style={getSolidStatusStyle(app.status)}>{app.status.replace('_', ' ')}</span></td>
                    <td className="px-4 py-3 text-slate-600">{getProfName(app.profissional_id)}</td>
                    <td className="px-4 py-3 font-bold text-slate-900">{getCustomerName(app.customer_id)}</td>
                    <td className="px-4 py-3 text-center">
                        {app.status === 'concluido' ? <Lock className="w-4 h-4 text-slate-300 mx-auto" /> : <button onClick={() => handleOpenEdit(app)} className="text-blue-600 p-1 hover:bg-blue-50 rounded"><Edit2 className="w-4 h-4" /></button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Modal>

        {/* MODAL PRINCIPAL: CONTAINER FLEX PARA FIXAR RODAPÉ E SCROLLAR CONTEÚDO */}
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={modalMode === 'create' ? "Agendar Serviço" : "Detalhes"}>
          <form onSubmit={handleSave} className="flex flex-col max-h-[75vh]">
            
            {/* CORPO DO FORMULÁRIO SCROLLÁVEL */}
            <div className="overflow-y-auto pr-2 space-y-4 pb-2" style={{ maxHeight: 'calc(75vh - 80px)' }}>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Cliente</label>
                    <select required className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none" value={formData.customer_id} onChange={e => setFormData({...formData, customer_id: e.target.value})}>
                      <option value="">Selecionar cliente...</option>
                      {customers.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Profissional</label>
                    <select required className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none" value={formData.profissional_id} onChange={e => setFormData({...formData, profissional_id: e.target.value})}>
                      <option value="">Selecionar profissional...</option>
                      {professionals.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase">Início</label>
                    <input required type="datetime-local" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl" value={formData.data_hora_inicio} onChange={e => setFormData({...formData, data_hora_inicio: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase">Término</label>
                    <input required type="datetime-local" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl" value={formData.data_hora_fim} onChange={e => setFormData({...formData, data_hora_fim: e.target.value})} />
                  </div>

                  {modalMode === 'create' && (
                    <div className="col-span-2 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <RefreshCw className={`w-4 h-4 ${isRecurring ? 'text-blue-600' : 'text-slate-400'}`} />
                                <span className="text-sm font-bold text-slate-700">Este serviço se repete?</span>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer" checked={isRecurring} onChange={e => {setIsRecurring(e.target.checked); if(!e.target.checked) setProjection(null);}} />
                                <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-blue-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                            </label>
                        </div>

                        {isRecurring && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase">Frequência</label>
                                        <select className="w-full bg-white border border-slate-200 px-3 py-2 rounded-lg text-sm" value={recurrenceRule.frequencia} onChange={e => setRecurrenceRule({...recurrenceRule, frequencia: e.target.value})}>
                                            <option value="DIARIA">Diário</option>
                                            <option value="SEMANAL">Semanal</option>
                                            <option value="QUINZENAL">Quinzenal</option>
                                            <option value="MENSAL">Mensal</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase">Qtd. Sessões</label>
                                        <input type="number" min="2" max="50" className="w-full bg-white border border-slate-200 px-3 py-2 rounded-lg text-sm" value={recurrenceRule.quantidade_sessoes} onChange={e => setRecurrenceRule({...recurrenceRule, quantidade_sessoes: parseInt(e.target.value)})} />
                                    </div>
                                </div>
                                
                                <button type="button" onClick={handleProjectRecurrence} disabled={isProjecting} className="w-full bg-slate-200 hover:bg-slate-300 text-slate-700 py-2 rounded-lg text-xs font-bold flex justify-center items-center gap-2">
                                    {isProjecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <List className="w-4 h-4" />} Projetar Datas Futuras
                                </button>

                                {projection && (
                                    <div className="mt-4 space-y-2 max-h-40 overflow-y-auto pr-2 border-t pt-4 border-slate-200">
                                        <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">Conferência ({projection.quantidade_disponivel}/{projection.quantidade_solicitada} livres):</p>
                                        {projection.sessoes.map(s => (
                                            <div key={s.indice} className={`flex items-center justify-between p-2 rounded-lg border ${s.disponivel ? 'bg-green-50 border-green-100 text-green-700' : 'bg-red-50 border-red-100 text-red-700'}`}>
                                                <span className="text-xs font-bold">{s.indice}ª - {new Date(s.data_hora_inicio).toLocaleDateString()} {new Date(s.data_hora_inicio).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                                {s.disponivel ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle title={s.conflito_detalhe} className="w-4 h-4" />}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                  )}

                  <div className="col-span-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Status</label>
                    <select className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                      <option value="pendente">⏳ PENDENTE</option>
                      <option value="confirmado">🔵 CONFIRMADO</option>
                      <option value="concluido">🟢 CONCLUÍDO</option>
                      <option value="cancelado_cliente">🔴 CANCELADO PELO CLIENTE</option>
                    </select>
                  </div>
                </div>
            </div>

            {/* RODAPÉ FIXO NA BASE DO MODAL */}
            <div className="flex gap-3 pt-4 border-t border-slate-200 mt-2 shrink-0 bg-white">
              <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50">Cancelar</button>
              <button type="submit" disabled={isSaving || (isRecurring && !projection)} className={`flex-[2] px-4 py-2.5 rounded-xl text-sm font-bold shadow-lg flex justify-center items-center gap-2 ${isRecurring ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-blue-600 hover:bg-blue-700'} text-white`}>
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {modalMode === 'create' ? (isRecurring ? 'Criar Lote Recorrente' : 'Agendar Agora') : 'Atualizar Dados'}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </Layout>
  );
}
