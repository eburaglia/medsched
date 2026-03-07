import React, { useEffect, useState, useMemo } from 'react';
import api from '../services/api';
import { jwtDecode } from 'jwt-decode';
import { Toaster, toast } from 'react-hot-toast';
import Modal from '../components/Modal';
import Layout from '../components/Layout';
import { 
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, 
  User, Loader2, Save, CalendarDays, Download, Edit2, Lock
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
    let start = new Date();
    if (date) { start = new Date(date); start.setHours(9, 0, 0); }
    let end = new Date(start); end.setHours(start.getHours() + 1);

    const format = (d) => {
        d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
        return d.toISOString().slice(0, 16);
    };

    setFormData({
      customer_id: '',
      profissional_id: selectedProfessional || jwtDecode(localStorage.getItem('medsched_token')).sub,
      data_hora_inicio: format(start),
      data_hora_fim: format(end),
      status: 'pendente',
      observacoes_internas: '',
      tenant_id: jwtDecode(localStorage.getItem('medsched_token')).tenant_id
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (app) => {
    if (app.status === 'concluido') {
        toast.error("Registros concluídos não podem ser editados.");
        return;
    }
    const format = (iso) => {
        const d = new Date(iso);
        d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
        return d.toISOString().slice(0, 16);
    };
    setModalMode('edit');
    setEditingId(app.id);
    setFormData({
      ...app,
      data_hora_inicio: format(app.data_hora_inicio),
      data_hora_fim: format(app.data_hora_fim),
      observacoes_internas: app.observacoes_internas || ''
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload = {
        ...formData,
        data_hora_inicio: new Date(formData.data_hora_inicio).toISOString(),
        data_hora_fim: new Date(formData.data_hora_fim).toISOString()
      };
      if (modalMode === 'create') await api.post('/appointments/', payload);
      else await api.put(`/appointments/${editingId}`, payload, { params: { tenant_id: formData.tenant_id } });
      
      toast.success("Agenda atualizada!");
      setIsModalOpen(false);
      if (isDailyModalOpen) setIsDailyModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error("Erro ao salvar o registro.");
    } finally { setIsSaving(false); }
  };

  const handleExportDailyCSV = () => {
    if (!selectedDailyCell || selectedDailyCell.appointments.length === 0) return;
    const csvRows = ['Horário,Status,Profissional,Cliente,Observações'];
    
    selectedDailyCell.appointments.forEach(app => {
      const time = new Date(app.data_hora_inicio).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
      const status = app.status ? String(app.status).toUpperCase() : 'N/A';
      const customer = customers.find(c => c.id === app.customer_id)?.nome || 'Cliente Desconhecido';
      const professional = professionals.find(p => p.id === app.profissional_id)?.nome || 'Profissional';
      const obs = app.observacoes_internas ? app.observacoes_internas.replace(/(\r\n|\n|\r)/gm, " ") : '';
      
      csvRows.push(`"${time}","${status}","${professional}","${customer}","${obs}"`);
    });

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Agenda_${selectedDailyCell.date.toISOString().split('T')[0]}.csv`;
    link.click();
    toast.success("Arquivo CSV baixado!");
  };

  const getSolidStatusStyle = (status) => {
    switch(status?.toLowerCase()) {
      case 'confirmado': return { backgroundColor: '#3b82f6', color: '#ffffff', borderColor: '#2563eb' };
      case 'concluido': return { backgroundColor: '#10b981', color: '#ffffff', borderColor: '#059669' };
      case 'cancelado_cliente':
      case 'cancelado_profissional':
      case 'no_show': return { backgroundColor: '#64748b', color: '#ffffff', borderColor: '#475569' };
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
                <div className="p-2 bg-blue-50 rounded-lg">
                    <CalendarDays className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                    <h1 className="text-xl font-bold text-slate-900 tracking-tight">Agenda</h1>
                </div>
            </div>

            <div className="h-8 w-px bg-slate-200 mx-2 hidden sm:block"></div>

            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
                <button onClick={prevMonth} className="p-1.5 hover:bg-white hover:shadow-sm rounded-md transition-all text-slate-600"><ChevronLeft className="w-4 h-4" /></button>
                <button onClick={today} className="px-3 py-1 text-xs font-bold text-slate-700 hover:bg-white hover:shadow-sm rounded-md transition-all uppercase">MÊS</button>
                <button onClick={nextMonth} className="p-1.5 hover:bg-white hover:shadow-sm rounded-md transition-all text-slate-600"><ChevronRight className="w-4 h-4" /></button>
            </div>
            
            <h2 className="text-lg font-bold text-slate-800 ml-2 min-w-[150px]">
              {monthNames[currentDate.getMonth()]} <span className="text-slate-400 font-medium">{currentDate.getFullYear()}</span>
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 focus-within:ring-2 focus-within:ring-blue-500 transition-all">
              <User className="w-4 h-4 text-slate-400 mr-2" />
              <select 
                className="bg-transparent outline-none text-sm font-bold text-slate-700 cursor-pointer w-48 truncate"
                value={selectedProfessional}
                onChange={e => setSelectedProfessional(e.target.value)}
              >
                <option value="">Todos os Profissionais</option>
                {professionals.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
              </select>
            </div>

            <button onClick={() => handleOpenCreate()} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-blue-200 transition-all transform active:scale-95 whitespace-nowrap">
              <Plus className="w-4 h-4 text-white" /> <span className="text-white">NOVO AGENDAMENTO</span>
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto bg-slate-50/50 p-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
            <div 
              className="border-b border-slate-200 bg-slate-50 sticky top-0 z-10"
              style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))' }}
            >
              {weekDays.map(day => (
                <div key={day} className="py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider truncate whitespace-nowrap">
                  {day}
                </div>
              ))}
            </div>

            <div 
              style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gridAutoRows: 'minmax(130px, 1fr)' }}
            >
              {isLoading ? (
                <div className="col-span-7 row-span-6 flex items-center justify-center min-h-[400px]">
                   <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                </div>
              ) : (
                calendarCells.map((cell) => {
                  const isToday = cell.type === 'current' && cell.date.toDateString() === new Date().toDateString();
                  const isMuted = cell.type !== 'current';
                  const isPast = cell.date < todayAtMidnight;
                  
                  let cellStyles = {};
                  let bgClasses = isToday 
                    ? 'ring-2 ring-inset ring-blue-500 bg-blue-50/10 z-[5] shadow-sm border-r border-b border-slate-200' 
                    : 'border-r border-b border-slate-200 bg-white hover:bg-slate-50';

                  if (isMuted) {
                    cellStyles = { backgroundImage: 'repeating-linear-gradient(45deg, #f8fafc, #f8fafc 6px, #f1f5f9 6px, #f1f5f9 12px)' };
                    bgClasses = 'border-r border-b border-slate-200';
                  } else if (isPast && !isToday) {
                    bgClasses = 'border-r border-b border-slate-200 bg-slate-100/70 hover:bg-slate-100';
                  }

                  const totalAppts = cell.appointments.length;
                  const completedAppts = cell.appointments.filter(a => a.status === 'concluido').length;
                  
                  return (
                    <div 
                      key={cell.id} 
                      onClick={() => {
                        if (!isMuted) {
                          setSelectedDailyCell(cell);
                          setIsDailyModalOpen(true);
                        }
                      }}
                      className={`relative flex flex-col p-2 group transition-all ${isMuted ? '' : 'cursor-pointer'} ${bgClasses}`}
                      style={cellStyles}
                    >
                      <div className="flex justify-between items-start shrink-0">
                        <span className={`text-sm font-bold w-7 h-7 flex items-center justify-center rounded-lg transition-all ${isToday ? 'bg-blue-600 text-white shadow-md' : isMuted ? 'text-slate-400' : isPast ? 'text-slate-500' : 'text-slate-700 group-hover:text-blue-600'}`}>
                          {cell.day}
                        </span>
                        
                        {!isMuted && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleOpenCreate(cell.date); }} 
                            className={`opacity-0 group-hover:opacity-100 p-1 rounded-md transition-all ${isPast ? 'hover:bg-slate-200 text-slate-500' : 'hover:bg-blue-100 text-blue-600'}`}
                            title="Adicionar Agendamento"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      <div className="flex-1 min-h-[8px]"></div>

                      {!isMuted && totalAppts > 0 && (
                        <div className="flex flex-col gap-1 w-full shrink-0">
                          <div className="text-[11px] px-2 py-1 rounded shadow-sm text-slate-800 w-full truncate border border-slate-200" style={{ backgroundColor: '#EDE8D0' }}>
                            Agendados = <strong>{totalAppts}</strong>
                          </div>
                          
                          {completedAppts > 0 ? (
                            <div className="text-[11px] px-2 py-1 rounded shadow-sm text-slate-900 w-full truncate border border-[#76d676]" style={{ backgroundColor: '#88E788' }}>
                              Concluídos = <strong>{completedAppts}</strong>
                            </div>
                          ) : (
                             <div className="h-[26px] w-full invisible"></div> 
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <Modal 
            isOpen={isDailyModalOpen} 
            onClose={() => setIsDailyModalOpen(false)} 
            title={`Atendimentos do dia ${selectedDailyCell?.date?.toLocaleDateString('pt-BR') || ''}`}
        >
          <div className="flex justify-end mb-4">
            <button 
                onClick={handleExportDailyCSV} 
                disabled={!selectedDailyCell || selectedDailyCell.appointments.length === 0}
                className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 px-4 py-2 rounded-lg text-sm font-bold transition-all border border-slate-300 shadow-sm"
            >
              <Download className="w-4 h-4" /> Exportar para CSV
            </button>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden max-h-[50vh] overflow-y-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] tracking-wider sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-3 font-bold">Horário</th>
                  <th className="px-4 py-3 font-bold">Status</th>
                  <th className="px-4 py-3 font-bold">Profissional</th>
                  <th className="px-4 py-3 font-bold">Cliente</th>
                  <th className="px-4 py-3 font-bold text-center">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {selectedDailyCell?.appointments.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-8 text-slate-400 font-medium">
                      Nenhum agendamento para este dia.
                    </td>
                  </tr>
                ) : (
                  selectedDailyCell?.appointments.map(app => (
                    <tr key={app.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-bold text-slate-700">
                          {new Date(app.data_hora_inicio).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </td>
                      <td className="px-4 py-3">
                        <span 
                          className="px-2 py-1 rounded text-[10px] font-bold uppercase shadow-sm border whitespace-nowrap"
                          style={getSolidStatusStyle(app.status)}
                        >
                          {app.status ? String(app.status).replace(/_/g, ' ') : 'N/A'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600 font-medium">{getProfName(app.profissional_id)}</td>
                      <td className="px-4 py-3 text-slate-900 font-bold">{getCustomerName(app.customer_id)}</td>
                      <td className="px-4 py-3 text-center">
                          {app.status === 'concluido' ? (
                            <button 
                                onClick={() => toast.error("Atendimentos concluídos não podem ser editados.")}
                                className="p-1.5 text-slate-300 cursor-not-allowed rounded-lg"
                                title="Bloqueado: Atendimento já concluído"
                            >
                                <Lock className="w-4 h-4" />
                            </button>
                          ) : (
                            <button 
                                onClick={() => handleOpenEdit(app)} 
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Editar Agendamento"
                            >
                                <Edit2 className="w-4 h-4" />
                            </button>
                          )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Modal>

        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={modalMode === 'create' ? "Agendar Serviço" : "Detalhes do Agendamento"}>
          <form onSubmit={handleSave} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Cliente</label>
                <select required className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm" value={formData.customer_id} onChange={e => setFormData({...formData, customer_id: e.target.value})}>
                  <option value="">Selecionar cliente...</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Profissional Responsável</label>
                <select required className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm" value={formData.profissional_id} onChange={e => setFormData({...formData, profissional_id: e.target.value})}>
                  <option value="">Selecionar profissional...</option>
                  {professionals.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Início</label>
                <input required type="datetime-local" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm" value={formData.data_hora_inicio} onChange={e => setFormData({...formData, data_hora_inicio: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Término</label>
                <input required type="datetime-local" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm" value={formData.data_hora_fim} onChange={e => setFormData({...formData, data_hora_fim: e.target.value})} />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Status</label>
                <select className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm font-bold" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                  <option value="pendente">⏳ PENDENTE</option>
                  <option value="confirmado">🔵 CONFIRMADO</option>
                  <option value="concluido">🟢 CONCLUÍDO</option>
                  <option value="cancelado_cliente">🔴 CANCELADO PELO CLIENTE</option>
                  <option value="no_show">⚪ NO-SHOW</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Notas do Serviço</label>
                <textarea rows={3} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none" placeholder="Observações importantes..." value={formData.observacoes_internas} onChange={e => setFormData({...formData, observacoes_internas: e.target.value})} />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all">Descartar</button>
              <button type="submit" disabled={isSaving} className="flex-[2] px-4 py-2.5 bg-blue-600 rounded-xl text-sm font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 flex justify-center items-center gap-2">
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <Save className="w-4 h-4 text-white" />} 
                <span className="text-white">{modalMode === 'create' ? 'Agendar Agora' : 'Atualizar Dados'}</span>
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </Layout>
  );
}
