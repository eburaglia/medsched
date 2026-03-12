import React, { useEffect, useState, useMemo } from 'react';
import api from '../services/api';
import { jwtDecode } from 'jwt-decode';
import { Toaster, toast } from 'react-hot-toast';
import Modal from '../components/Modal';
import Layout from '../components/Layout';
import { 
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, 
  User, Loader2, Save, CalendarDays, Download, Edit2, Lock, 
  RefreshCw, CheckCircle2, AlertTriangle, List, Calendar, LayoutList, Columns, DollarSign, Tag, CreditCard, Percent
} from 'lucide-react';

export default function Agenda() {
  const [appointments, setAppointments] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [professionals, setProfessionals] = useState([]);
  // 💰 NOVO: Estados de Faturamento
  const [services, setServices] = useState([]);
  const [fees, setFees] = useState([]);
  const [agreements, setAgreements] = useState([]);
  const [servicePrices, setServicePrices] = useState([]);

  const [isLoading, setIsLoading] = useState(true);
  
  const [viewMode, setViewMode] = useState('month'); // 'month', 'week', 'day'
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
    customer_id: '', profissional_id: '', servico_id: '', data_hora_inicio: '',
    data_hora_fim: '', status: 'PENDENTE', observacoes_internas: '', tenant_id: '',
    // 💰 NOVO: Campos Financeiros
    metodo_pagamento_previsto: '', convenio_id: '', 
    valor_base_servico: 0.00, desconto_manual: 0.00, acrescimo_manual: 0.00, 
    taxa_operadora_aplicada: 0.00, valor_total_previsto: 0.00, faturado: false
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('medsched_token');
      if (!token) return;
      const decoded = jwtDecode(token);
      const tenantId = decoded.tenant_id || localStorage.getItem('selected_tenant_id');

      const [appRes, custRes, profRes, servRes, feesRes, agrRes] = await Promise.all([
        api.get('/appointments/', { params: { tenant_id: tenantId } }),
        api.get('/customers/', { params: { tenant_id: tenantId } }),
        api.get('/users/', { params: { tenant_id: tenantId } }),
        api.get('/services/', { params: { tenant_id: tenantId } }), // Busca os serviços
        api.get('/billing/fees', { params: { tenant_id: tenantId } }), // Busca as taxas
        api.get('/billing/agreements', { params: { tenant_id: tenantId } }) // Busca os convênios
      ]);

      setAppointments(appRes.data);
      setCustomers(custRes.data.filter(c => c.status?.toLowerCase() === 'ativo'));
      setProfessionals(profRes.data.filter(u => 
        u.status?.toUpperCase() === 'ATIVO' && 
        ['PROFISSIONAL', 'TENANT_ADMIN'].includes(u.papel || u.role)
      ));
      setServices(servRes.data.filter(s => s.status === 'ativo'));
      setFees(feesRes.data);
      setAgreements(agrRes.data.filter(a => a.ativo));

    } catch (err) {
      toast.error("Erro ao sincronizar dados da agenda.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // 🧠 CALCULADORA MATEMÁTICA EM TEMPO REAL
  useEffect(() => {
    if (!formData.servico_id) return;
    
    const calculateTotals = async () => {
      let basePrice = 0;
      const selectedService = services.find(s => s.id === formData.servico_id);
      
      // 1. Descobre o Valor Base (Particular vs Convênio)
      if (formData.convenio_id) {
          try {
            // Busca o valor específico desse convênio no backend
            const token = localStorage.getItem('medsched_token');
            const tenantId = jwtDecode(token).tenant_id || localStorage.getItem('selected_tenant_id');
            const priceRes = await api.get(`/billing/agreements/${formData.convenio_id}/prices`, { params: { tenant_id: tenantId } });
            const specificPrice = priceRes.data.find(p => p.service_id === formData.servico_id);
            basePrice = specificPrice ? Number(specificPrice.valor_acordado) : (selectedService ? Number(selectedService.preco) : 0);
          } catch(e) {
            basePrice = selectedService ? Number(selectedService.preco) : 0;
          }
      } else {
          basePrice = selectedService ? Number(selectedService.preco) : 0;
      }

      // 2. Calcula a Taxa do Cartão/Boleto
      let taxaCalculada = 0;
      if (formData.metodo_pagamento_previsto) {
          const rule = fees.find(f => f.metodo_pagamento === formData.metodo_pagamento_previsto);
          if (rule && rule.repassar_ao_cliente) {
              if (rule.tipo_taxa === 'PERCENTUAL') {
                  taxaCalculada = basePrice * (Number(rule.valor_taxa) / 100);
              } else {
                  taxaCalculada = Number(rule.valor_taxa);
              }
          }
      }

      // 3. Fecha a conta
      const finalTotal = basePrice + taxaCalculada + Number(formData.acrescimo_manual) - Number(formData.desconto_manual);

      setFormData(prev => ({
          ...prev,
          valor_base_servico: basePrice.toFixed(2),
          taxa_operadora_aplicada: taxaCalculada.toFixed(2),
          valor_total_previsto: finalTotal > 0 ? finalTotal.toFixed(2) : 0.00
      }));
    };
    
    calculateTotals();
  }, [formData.servico_id, formData.convenio_id, formData.metodo_pagamento_previsto, formData.desconto_manual, formData.acrescimo_manual]);

  const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  const navigateDate = (direction) => {
    const newDate = new Date(currentDate);
    if (viewMode === 'month') {
        newDate.setMonth(newDate.getMonth() + direction);
        newDate.setDate(1); 
    } else if (viewMode === 'week') {
        newDate.setDate(newDate.getDate() + (direction * 7));
    } else if (viewMode === 'day') {
        newDate.setDate(newDate.getDate() + direction);
    }
    setCurrentDate(newDate);
  };

  const today = () => setCurrentDate(new Date());

  const filteredAppointments = useMemo(() => {
    if (!selectedProfessional) return appointments;
    return appointments.filter(app => app.profissional_id === selectedProfessional);
  }, [appointments, selectedProfessional]);

  // CALCULO: VISÃO MENSAL
  const monthCells = useMemo(() => {
    if (viewMode !== 'month') return [];
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
  }, [currentDate, filteredAppointments, viewMode]);

  // CALCULO: VISÃO SEMANAL
  const weekCells = useMemo(() => {
    if (viewMode !== 'week') return [];
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    startOfWeek.setHours(0,0,0,0);

    return Array.from({length: 7}).map((_, i) => {
        const d = new Date(startOfWeek);
        d.setDate(d.getDate() + i);
        const apps = filteredAppointments.filter(app => {
            const ad = new Date(app.data_hora_inicio);
            return ad.getDate() === d.getDate() && ad.getMonth() === d.getMonth() && ad.getFullYear() === d.getFullYear();
        }).sort((a,b) => new Date(a.data_hora_inicio) - new Date(b.data_hora_inicio));
        return { date: d, day: d.getDate(), appointments: apps, isToday: d.toDateString() === new Date().toDateString() };
    });
  }, [currentDate, filteredAppointments, viewMode]);

  // CALCULO: VISÃO DIÁRIA
  const dayAppointments = useMemo(() => {
    if (viewMode !== 'day') return [];
    return filteredAppointments.filter(app => {
        const d = new Date(app.data_hora_inicio);
        return d.getDate() === currentDate.getDate() && d.getMonth() === currentDate.getMonth() && d.getFullYear() === currentDate.getFullYear();
    }).sort((a,b) => new Date(a.data_hora_inicio) - new Date(b.data_hora_inicio));
  }, [currentDate, filteredAppointments, viewMode]);

  const handleOpenCreate = (date = null) => {
    setModalMode('create');
    setEditingId(null);
    setIsRecurring(false);
    setProjection(null);

    let start = new Date();
    if (date) { 
        start = new Date(date); 
        if (start.toDateString() !== new Date().toDateString()) start.setHours(9, 0, 0); 
    }
    let end = new Date(start); end.setHours(start.getHours() + 1);

    const format = (d) => {
        d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
        return d.toISOString().slice(0, 16);
    };

    setFormData({
      customer_id: '', profissional_id: selectedProfessional || jwtDecode(localStorage.getItem('medsched_token')).sub,
      servico_id: '', data_hora_inicio: format(start), data_hora_fim: format(end),
      status: 'PENDENTE', observacoes_internas: '', tenant_id: jwtDecode(localStorage.getItem('medsched_token')).tenant_id,
      metodo_pagamento_previsto: '', convenio_id: '', valor_base_servico: 0, desconto_manual: 0, acrescimo_manual: 0, 
      taxa_operadora_aplicada: 0, valor_total_previsto: 0, faturado: false
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
    setFormData({ 
      ...app, 
      data_hora_inicio: format(app.data_hora_inicio), 
      data_hora_fim: format(app.data_hora_fim), 
      observacoes_internas: app.observacoes_internas || '',
      convenio_id: app.convenio_id || '',
      metodo_pagamento_previsto: app.metodo_pagamento_previsto || '',
      desconto_manual: app.desconto_manual || 0,
      acrescimo_manual: app.acrescimo_manual || 0
    });
    setIsModalOpen(true);
  };

  const handleProjectRecurrence = async () => {
    if (!formData.customer_id || !formData.profissional_id || !formData.servico_id) { toast.error("Preencha Cliente, Profissional e Serviço primeiro."); return; }
    setIsProjecting(true);
    try {
        const payload = {
            customer_id: formData.customer_id, profissional_id: formData.profissional_id, servico_id: formData.servico_id,
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

      const formatPayload = (data) => {
        const p = { ...data };
        if(p.convenio_id === '') p.convenio_id = null;
        if(p.metodo_pagamento_previsto === '') p.metodo_pagamento_previsto = null;
        return p;
      };

      if (isRecurring && projection) {
          const batchPayload = {
              agendamentos: projection.sessoes.map(s => ({
                  customer_id: formData.customer_id, profissional_id: formData.profissional_id, servico_id: formData.servico_id,
                  data_hora_inicio: s.data_hora_inicio, data_hora_fim: s.data_hora_fim,
                  status: formData.status, observacoes_internas: formData.observacoes_internas, tenant_id: formData.tenant_id,
                  metodo_pagamento_previsto: formData.metodo_pagamento_previsto || null,
                  convenio_id: formData.convenio_id || null,
                  valor_base_servico: formData.valor_base_servico,
                  desconto_manual: formData.desconto_manual,
                  acrescimo_manual: formData.acrescimo_manual,
                  taxa_operadora_aplicada: formData.taxa_operadora_aplicada,
                  valor_total_previsto: formData.valor_total_previsto
              }))
          };
          await api.post('/appointments/recorrencia/lote', batchPayload);
          toast.success(`${projection.quantidade_solicitada} agendamentos criados!`);
      } else {
          const payload = formatPayload({ ...formData, data_hora_inicio: startIso, data_hora_fim: endIso });
          if (modalMode === 'create') await api.post('/appointments/', payload);
          else await api.put(`/appointments/${editingId}`, payload, { params: { tenant_id: formData.tenant_id } });
          toast.success("Agenda atualizada!");
      }

      setIsModalOpen(false);
      if (isDailyModalOpen) setIsDailyModalOpen(false);
      fetchData();
    } catch (err) { toast.error("Erro ao salvar os registros."); } finally { setIsSaving(false); }
  };

  const exportCSV = (appointmentsToExport, datePrefix) => {
    if (!appointmentsToExport || appointmentsToExport.length === 0) { toast.error("Nenhum dado para exportar."); return; }
    const csvRows = ['Horário,Status,Profissional,Cliente,Serviço,Valor Previsto,Observações'];
    appointmentsToExport.forEach(app => {
      const time = new Date(app.data_hora_inicio).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
      const status = app.status ? String(app.status).toUpperCase() : 'N/A';
      const customer = customers.find(c => c.id === app.customer_id)?.nome || 'Cliente';
      const professional = professionals.find(p => p.id === app.profissional_id)?.nome || 'Prof';
      const service = services.find(s => s.id === app.servico_id)?.nome || '-';
      const valor = app.valor_total_previsto ? `R$ ${app.valor_total_previsto}` : '-';
      csvRows.push(`"${time}","${status}","${professional}","${customer}","${service}","${valor}","${app.observacoes_internas || ''}"`);
    });
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a"); link.href = URL.createObjectURL(blob);
    link.download = `Agenda_${datePrefix}.csv`; link.click();
  };

  const getSolidStatusStyle = (status) => {
    switch(status?.toLowerCase()) {
      case 'confirmado': return { backgroundColor: '#3b82f6', color: '#ffffff', borderColor: '#2563eb' };
      case 'concluido': return { backgroundColor: '#10b981', color: '#ffffff', borderColor: '#059669' };
      case 'cancelado_cliente': case 'cancelado_profissional': case 'no_show': return { backgroundColor: '#64748b', color: '#ffffff', borderColor: '#475569' };
      default: return { backgroundColor: '#f59e0b', color: '#ffffff', borderColor: '#d97706' };
    }
  };
  
  const getLightStatusClasses = (status) => {
    switch(status?.toLowerCase()) {
      case 'confirmado': return 'bg-blue-50 text-blue-700 border-blue-200 border-l-[3px] border-l-blue-500';
      case 'concluido': return 'bg-emerald-50 text-emerald-700 border-emerald-200 border-l-[3px] border-l-emerald-500';
      case 'cancelado_cliente': case 'cancelado_profissional': case 'no_show': return 'bg-slate-100 text-slate-500 border-slate-200 border-l-[3px] border-l-slate-400 opacity-70';
      default: return 'bg-amber-50 text-amber-700 border-amber-200 border-l-[3px] border-l-amber-500';
    }
  };

  const getCustomerName = (id) => customers.find(c => c.id === id)?.nome || 'Cliente';
  const getProfName = (id) => professionals.find(p => p.id === id)?.nome || 'Profissional';
  const getServiceName = (id) => services.find(s => s.id === id)?.nome || '-';

  const todayAtMidnight = new Date();
  todayAtMidnight.setHours(0, 0, 0, 0);

  const getPeriodHeader = () => {
      if (viewMode === 'month') return `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
      if (viewMode === 'day') return `${currentDate.getDate()} de ${monthNames[currentDate.getMonth()]} de ${currentDate.getFullYear()}`;
      if (viewMode === 'week') {
          const start = new Date(currentDate); start.setDate(start.getDate() - start.getDay());
          const end = new Date(start); end.setDate(end.getDate() + 6);
          const startMonth = start.getMonth() !== end.getMonth() ? ` de ${monthNames[start.getMonth()]}` : '';
          return `${start.getDate()}${startMonth} a ${end.getDate()} de ${monthNames[end.getMonth()]} de ${end.getFullYear()}`;
      }
  };

  return (
    <Layout>
      <div className="flex flex-col h-screen bg-slate-50">
        <Toaster position="top-right" />

        <header className="flex flex-wrap items-center justify-between px-8 py-4 border-b border-slate-200 bg-white gap-4 flex-shrink-0 z-10 shadow-sm relative">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-50 rounded-lg"><CalendarDays className="w-6 h-6 text-blue-600" /></div>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">Agenda</h1>
            </div>
            
            <div className="h-8 w-px bg-slate-200 mx-2 hidden lg:block"></div>

            <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
                <button onClick={() => setViewMode('day')} className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-md transition-all ${viewMode === 'day' ? 'bg-white shadow-sm text-blue-700' : 'text-slate-500 hover:text-slate-700'}`}><LayoutList className="w-4 h-4" /> DIA</button>
                <button onClick={() => setViewMode('week')} className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-md transition-all ${viewMode === 'week' ? 'bg-white shadow-sm text-blue-700' : 'text-slate-500 hover:text-slate-700'}`}><Columns className="w-4 h-4" /> SEMANA</button>
                <button onClick={() => setViewMode('month')} className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-md transition-all ${viewMode === 'month' ? 'bg-white shadow-sm text-blue-700' : 'text-slate-500 hover:text-slate-700'}`}><Calendar className="w-4 h-4" /> MÊS</button>
            </div>

            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 ml-2">
                <button onClick={() => navigateDate(-1)} className="p-1.5 hover:bg-white rounded-md text-slate-600 shadow-sm border border-transparent hover:border-slate-200 transition-all"><ChevronLeft className="w-4 h-4" /></button>
                <button onClick={today} className="px-3 py-1 text-xs font-bold text-slate-700 hover:bg-white rounded-md uppercase shadow-sm border border-transparent hover:border-slate-200 transition-all">HOJE</button>
                <button onClick={() => navigateDate(1)} className="p-1.5 hover:bg-white rounded-md text-slate-600 shadow-sm border border-transparent hover:border-slate-200 transition-all"><ChevronRight className="w-4 h-4" /></button>
            </div>
            
            <h2 className="text-lg font-bold text-slate-800 ml-2 min-w-[200px]">{getPeriodHeader()}</h2>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 focus-within:ring-2 focus-within:ring-blue-500 shadow-inner">
              <User className="w-4 h-4 text-slate-400 mr-2" />
              <select className="bg-transparent outline-none text-sm font-bold text-slate-700 w-48 truncate cursor-pointer" value={selectedProfessional} onChange={e => setSelectedProfessional(e.target.value)}>
                <option value="">Todos os Profissionais</option>
                {professionals.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
              </select>
            </div>
            <button onClick={() => handleOpenCreate(currentDate)} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-blue-200 flex items-center gap-2 transform active:scale-95 transition-all">
              <Plus className="w-4 h-4" /> NOVO AGENDAMENTO
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
            
            {viewMode === 'month' && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden h-full min-h-[600px]">
                    <div className="border-b border-slate-200 bg-slate-50 sticky top-0 z-10 grid grid-cols-7">
                        {weekDays.map(day => (<div key={day} className="py-3 text-center text-xs font-bold text-slate-500 uppercase">{day}</div>))}
                    </div>
                    <div className="flex-1" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gridAutoRows: 'minmax(130px, 1fr)' }}>
                    {isLoading ? (
                        <div className="col-span-7 py-20 flex justify-center items-center"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
                    ) : (
                        monthCells.map((cell) => {
                        const isToday = cell.type === 'current' && cell.date.toDateString() === new Date().toDateString();
                        const isMuted = cell.type !== 'current';
                        const totalAppts = cell.appointments.length;
                        const completedAppts = cell.appointments.filter(a => a.status === 'concluido').length;
                        
                        return (
                            <div 
                                key={cell.id} 
                                onClick={() => !isMuted && (setSelectedDailyCell(cell), setIsDailyModalOpen(true))}
                                className={`p-2 flex flex-col group transition-all border-r border-b border-slate-200 ${isMuted ? 'opacity-40 grayscale' : 'cursor-pointer bg-white hover:bg-slate-50'} ${isToday ? 'ring-2 ring-inset ring-blue-500 z-10 shadow-sm' : ''}`}
                                style={isMuted ? {backgroundImage: 'repeating-linear-gradient(45deg, #f8fafc, #f8fafc 6px, #f1f5f9 6px, #f1f5f9 12px)'} : {}}
                            >
                            <div className="flex justify-between items-start">
                                <span className={`text-sm font-bold w-7 h-7 flex items-center justify-center rounded-lg shadow-sm ${isToday ? 'bg-blue-600 text-white' : 'text-slate-600 bg-white border border-slate-100'}`}>{cell.day}</span>
                                {!isMuted && <button onClick={(e) => {e.stopPropagation(); handleOpenCreate(cell.date)}} className="opacity-0 group-hover:opacity-100 p-1 hover:bg-blue-100 rounded text-blue-600"><Plus className="w-4 h-4" /></button>}
                            </div>
                            <div className="flex-1"></div>
                            {!isMuted && totalAppts > 0 && (
                                <div className="flex flex-col gap-1 w-full mt-2">
                                <div className="text-[11px] px-2 py-1 rounded shadow-sm border border-slate-200 truncate" style={{backgroundColor: '#EDE8D0'}}>Agendados = <strong>{totalAppts}</strong></div>
                                {completedAppts > 0 && <div className="text-[11px] px-2 py-1 rounded shadow-sm border border-[#76d676] truncate" style={{backgroundColor: '#88E788'}}>Concluídos = <strong>{completedAppts}</strong></div>}
                                </div>
                            )}
                            </div>
                        );
                        })
                    )}
                    </div>
                </div>
            )}

            {viewMode === 'week' && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden h-full min-h-[600px]">
                    <div className="border-b border-slate-200 bg-slate-50 sticky top-0 z-10 grid grid-cols-7 divide-x divide-slate-200 shadow-sm">
                        {weekCells.map((cell, idx) => (
                            <div key={idx} className={`py-4 flex flex-col items-center justify-center gap-1 ${cell.isToday ? 'bg-blue-50' : ''}`}>
                                <span className={`text-[10px] font-bold uppercase tracking-wider ${cell.isToday ? 'text-blue-600' : 'text-slate-400'}`}>{weekDays[idx]}</span>
                                <span className={`text-xl font-black ${cell.isToday ? 'text-blue-700' : 'text-slate-700'}`}>{cell.day}</span>
                            </div>
                        ))}
                    </div>
                    <div className="flex-1 grid grid-cols-7 divide-x divide-slate-100 bg-slate-50/30 overflow-hidden">
                        {isLoading ? (
                            <div className="col-span-7 flex justify-center items-center"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
                        ) : (
                            weekCells.map((cell, idx) => (
                                <div key={idx} className={`p-2 flex flex-col h-full overflow-y-auto no-scrollbar transition-all ${cell.isToday ? 'bg-blue-50/20' : 'hover:bg-slate-50/80'} ${cell.date < todayAtMidnight && !cell.isToday ? 'opacity-60 grayscale-[30%]' : ''}`}>
                                    <div className="flex justify-end mb-2">
                                        <button onClick={() => handleOpenCreate(cell.date)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-100 rounded-lg transition-colors" title="Adicionar no dia"><Plus className="w-4 h-4" /></button>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        {cell.appointments.length === 0 ? (
                                            <div className="text-center text-[10px] font-bold text-slate-300 py-4 uppercase">Livre</div>
                                        ) : (
                                            cell.appointments.map(app => (
                                                <div key={app.id} onClick={() => handleOpenEdit(app)} className={`p-2 rounded-lg border shadow-sm cursor-pointer hover:-translate-y-0.5 transition-all ${getLightStatusClasses(app.status)}`}>
                                                    <div className="flex justify-between items-start mb-1">
                                                      <span className="text-[11px] font-black text-slate-800">{new Date(app.data_hora_inicio).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                                      {app.valor_total_previsto > 0 && <span className="text-[9px] font-bold text-green-700 bg-green-100 px-1 rounded border border-green-200">R$ {app.valor_total_previsto}</span>}
                                                    </div>
                                                    <div className="text-[10px] font-bold truncate">{getCustomerName(app.customer_id)}</div>
                                                    <div className="text-[9px] truncate font-medium mt-0.5 opacity-80">{getServiceName(app.servico_id)}</div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {viewMode === 'day' && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden h-full min-h-[600px]">
                    <div className="border-b border-slate-200 bg-slate-50 p-4 flex justify-between items-center sticky top-0 z-10 shadow-sm">
                        <div className="flex items-center gap-3">
                            <span className="text-3xl font-black text-blue-600">{currentDate.getDate()}</span>
                            <div className="flex flex-col">
                                <span className="text-sm font-bold text-slate-700 capitalize">{weekDays[currentDate.getDay()]}-feira</span>
                                <span className="text-xs font-semibold text-slate-500">{monthNames[currentDate.getMonth()]} de {currentDate.getFullYear()}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button onClick={() => exportCSV(dayAppointments, currentDate.toISOString().split('T')[0])} disabled={dayAppointments.length === 0} className="flex items-center gap-2 bg-white hover:bg-slate-50 disabled:opacity-50 text-slate-700 px-4 py-2 rounded-lg text-sm font-bold transition-all border border-slate-300 shadow-sm">
                                <Download className="w-4 h-4" /> Exportar Lista
                            </button>
                            <button onClick={() => handleOpenCreate(currentDate)} className="flex items-center gap-2 bg-blue-100 hover:bg-blue-200 text-blue-700 px-4 py-2 rounded-lg text-sm font-bold transition-all border border-blue-200 shadow-sm">
                                <Plus className="w-4 h-4" /> Adicionar Serviço
                            </button>
                        </div>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-white border-b border-slate-200 text-slate-500 uppercase text-[10px] tracking-wider sticky top-0 z-10 shadow-sm">
                                <tr>
                                    <th className="px-6 py-4 font-bold">Horário</th>
                                    <th className="px-6 py-4 font-bold">Status</th>
                                    <th className="px-6 py-4 font-bold">Cliente / Serviço</th>
                                    <th className="px-6 py-4 font-bold">Profissional</th>
                                    <th className="px-6 py-4 font-bold text-right">Previsto</th>
                                    <th className="px-6 py-4 font-bold text-center">Ação</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                                {isLoading ? (
                                    <tr><td colSpan="6" className="text-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto" /></td></tr>
                                ) : dayAppointments.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="text-center py-20">
                                            <div className="flex flex-col items-center justify-center text-slate-400">
                                                <Calendar className="w-12 h-12 mb-3 text-slate-200" />
                                                <p className="font-bold text-lg">Agenda Livre</p>
                                                <p className="text-sm">Nenhum serviço agendado para esta data.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    dayAppointments.map(app => (
                                        <tr key={app.id} className="hover:bg-slate-50/80 transition-colors group">
                                            <td className="px-6 py-4 font-black text-slate-700 text-base">{new Date(app.data_hora_inicio).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                                            <td className="px-6 py-4">
                                                <span className="px-3 py-1.5 rounded-md text-[10px] font-bold uppercase shadow-sm border whitespace-nowrap" style={getSolidStatusStyle(app.status)}>
                                                    {app.status ? String(app.status).replace(/_/g, ' ') : 'N/A'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                              <p className="text-slate-900 font-bold">{getCustomerName(app.customer_id)}</p>
                                              <p className="text-slate-500 text-xs flex items-center gap-1 mt-0.5"><Tag className="w-3 h-3"/> {getServiceName(app.servico_id)}</p>
                                            </td>
                                            <td className="px-6 py-4 text-slate-600 font-medium">{getProfName(app.profissional_id)}</td>
                                            <td className="px-6 py-4 text-right font-bold text-slate-800">
                                              {app.valor_total_previsto > 0 ? `R$ ${Number(app.valor_total_previsto).toFixed(2)}` : '-'}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {app.status === 'concluido' ? (
                                                    <button onClick={() => toast.error("Serviços concluídos não podem ser editados.")} className="p-2 text-slate-300 cursor-not-allowed rounded-lg bg-slate-50 border border-slate-100" title="Bloqueado"><Lock className="w-4 h-4" /></button>
                                                ) : (
                                                    <button onClick={() => handleOpenEdit(app)} className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors border border-transparent hover:border-blue-200 shadow-sm opacity-0 group-hover:opacity-100 focus:opacity-100" title="Editar"><Edit2 className="w-4 h-4" /></button>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>

        {/* MODAL DIÁRIO */}
        <Modal isOpen={isDailyModalOpen} onClose={() => setIsDailyModalOpen(false)} title={`Dia ${selectedDailyCell?.date?.toLocaleDateString('pt-BR')}`}>
          <div className="flex justify-end mb-4">
            <button onClick={() => exportCSV(selectedDailyCell?.appointments, selectedDailyCell?.date?.toISOString().split('T')[0])} disabled={!selectedDailyCell || selectedDailyCell.appointments.length === 0} className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-bold border border-slate-300">
                <Download className="w-4 h-4" /> Exportar CSV
            </button>
          </div>
          <div className="border border-slate-200 rounded-xl overflow-auto max-h-[50vh]">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] sticky top-0">
                <tr><th className="px-4 py-3">Horário</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Serviço/Cliente</th><th className="px-4 py-3 text-center">Ação</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {selectedDailyCell?.appointments.length === 0 ? (
                    <tr><td colSpan="4" className="text-center py-8 text-slate-400 font-medium">Livre</td></tr>
                ) : (
                    selectedDailyCell?.appointments.map(app => (
                        <tr key={app.id} className="hover:bg-slate-50">
                            <td className="px-4 py-3 font-bold">{new Date(app.data_hora_inicio).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                            <td className="px-4 py-3"><span className="px-2 py-1 rounded text-[10px] font-bold uppercase border" style={getSolidStatusStyle(app.status)}>{app.status.replace('_', ' ')}</span></td>
                            <td className="px-4 py-3">
                              <p className="font-bold text-slate-900">{getCustomerName(app.customer_id)}</p>
                              <p className="text-xs text-slate-500">{getServiceName(app.servico_id)}</p>
                            </td>
                            <td className="px-4 py-3 text-center">
                                {app.status === 'concluido' ? <Lock className="w-4 h-4 text-slate-300 mx-auto" /> : <button onClick={() => {setIsDailyModalOpen(false); handleOpenEdit(app);}} className="text-blue-600 p-1 hover:bg-blue-50 rounded"><Edit2 className="w-4 h-4" /></button>}
                            </td>
                        </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </Modal>

        {/* MODAL DE CRIAÇÃO/EDIÇÃO - 💰 COM MOTOR DE FATURAMENTO */}
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={modalMode === 'create' ? "Agendar Serviço" : "Editar Agendamento"}>
          <form onSubmit={handleSave} className="flex flex-col max-h-[85vh]">
            <div className="overflow-y-auto pr-2 space-y-5 pb-2" style={{ maxHeight: 'calc(85vh - 80px)' }}>
                
                {/* DADOS BÁSICOS */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2"><User className="w-3.5 h-3.5" /> Informações Básicas</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 md:col-span-1">
                      <label className="text-xs font-bold text-slate-600 mb-1 block">Cliente *</label>
                      <select required className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" value={formData.customer_id} onChange={e => setFormData({...formData, customer_id: e.target.value})}>
                        <option value="">Selecionar...</option>
                        {customers.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                      </select>
                    </div>
                    <div className="col-span-2 md:col-span-1">
                      <label className="text-xs font-bold text-slate-600 mb-1 block">Profissional *</label>
                      <select required className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" value={formData.profissional_id} onChange={e => setFormData({...formData, profissional_id: e.target.value})}>
                        <option value="">Selecionar...</option>
                        {professionals.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                {/* SERVIÇO E DATAS */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="text-xs font-bold text-slate-600 mb-1 block">Serviço Prestado *</label>
                    <select required className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 font-bold text-blue-900" value={formData.servico_id} onChange={e => setFormData({...formData, servico_id: e.target.value})}>
                      <option value="">Selecione o Serviço...</option>
                      {services.map(s => <option key={s.id} value={s.id}>{s.nome} (Base: R$ {s.preco})</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-600 mb-1 block">Início *</label>
                    <input required type="datetime-local" className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500" value={formData.data_hora_inicio} onChange={e => setFormData({...formData, data_hora_inicio: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-600 mb-1 block">Término *</label>
                    <input required type="datetime-local" className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500" value={formData.data_hora_fim} onChange={e => setFormData({...formData, data_hora_fim: e.target.value})} />
                  </div>
                </div>

                {/* 💰 NOVO: MOTOR DE PRÉ-FATURAMENTO */}
                {formData.servico_id && (
                  <div className="border border-blue-200 bg-blue-50/30 rounded-xl overflow-hidden shadow-sm animate-in fade-in slide-in-from-top-2">
                    <div className="bg-blue-100/50 px-4 py-2 border-b border-blue-200 flex items-center justify-between">
                      <span className="text-xs font-bold text-blue-800 uppercase tracking-widest flex items-center gap-1.5"><DollarSign className="w-3.5 h-3.5" /> Pré-Faturamento</span>
                      {formData.faturado && <span className="bg-green-500 text-white text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider">Faturado</span>}
                    </div>
                    
                    <div className="p-4 grid grid-cols-2 gap-4">
                      {/* Acordos e Maquininhas */}
                      <div className="col-span-2 md:col-span-1">
                        <label className="text-[11px] font-bold text-slate-500 mb-1 block">Convênio / Parceria</label>
                        <select className="w-full px-3 py-2 bg-white border border-blue-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm" value={formData.convenio_id || ''} onChange={e => setFormData({...formData, convenio_id: e.target.value})}>
                          <option value="">- Particular -</option>
                          {agreements.map(a => <option key={a.id} value={a.id}>{a.nome}</option>)}
                        </select>
                      </div>
                      <div className="col-span-2 md:col-span-1">
                        <label className="text-[11px] font-bold text-slate-500 mb-1 block">Método de Pagto Previsto</label>
                        <select className="w-full px-3 py-2 bg-white border border-blue-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm" value={formData.metodo_pagamento_previsto || ''} onChange={e => setFormData({...formData, metodo_pagamento_previsto: e.target.value})}>
                          <option value="">- Indefinido -</option>
                          <option value="PIX">Pix</option>
                          <option value="DINHEIRO">Dinheiro</option>
                          <option value="CARTAO_CREDITO">Cartão de Crédito</option>
                          <option value="CARTAO_DEBITO">Cartão de Débito</option>
                          <option value="BOLETO">Boleto Bancário</option>
                          <option value="TRANSFERENCIA">Transferência</option>
                        </select>
                      </div>

                      {/* Descontos Manuais (Opcional) */}
                      <div>
                        <label className="text-[11px] font-bold text-slate-500 mb-1 block">Desconto (R$)</label>
                        <input type="number" step="0.01" min="0" className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm text-red-600 font-medium" value={formData.desconto_manual || ''} onChange={e => setFormData({...formData, desconto_manual: e.target.value})} />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-slate-500 mb-1 block">Acréscimo (R$)</label>
                        <input type="number" step="0.01" min="0" className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm text-green-600 font-medium" value={formData.acrescimo_manual || ''} onChange={e => setFormData({...formData, acrescimo_manual: e.target.value})} />
                      </div>

                      {/* Resumo Matemático ao Vivo */}
                      <div className="col-span-2 bg-white border border-slate-200 rounded-lg p-3 mt-2 flex flex-col gap-1.5 shadow-inner">
                        <div className="flex justify-between text-xs text-slate-500">
                          <span>Valor Base do Serviço:</span>
                          <span>R$ {formData.valor_base_servico}</span>
                        </div>
                        {Number(formData.taxa_operadora_aplicada) > 0 && (
                          <div className="flex justify-between text-xs text-orange-600">
                            <span>+ Taxa da Forma de Pagto:</span>
                            <span>R$ {formData.taxa_operadora_aplicada}</span>
                          </div>
                        )}
                        <div className="border-t border-dashed border-slate-200 pt-1 mt-1 flex justify-between items-center">
                          <span className="text-sm font-bold text-slate-700">Total a Cobrar:</span>
                          <span className="text-xl font-black text-blue-700">R$ {formData.valor_total_previsto}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* RECORRÊNCIA */}
                {modalMode === 'create' && (
                  <div className="col-span-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
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

                {/* STATUS FINAL */}
                <div>
                  <label className="text-xs font-bold text-slate-600 mb-1 block">Status do Agendamento</label>
                  <select className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                    <option value="PENDENTE">⏳ PENDENTE</option>
                    <option value="CONFIRMADO">🔵 CONFIRMADO</option>
                    <option value="CONCLUIDO">🟢 CONCLUÍDO (Ir para Faturamento)</option>
                    <option value="CANCELADO_CLIENTE">🔴 CANCELADO PELO CLIENTE</option>
                  </select>
                </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-slate-200 mt-2 shrink-0 bg-white">
              <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50">Cancelar</button>
              <button type="submit" disabled={isSaving || (isRecurring && !projection)} className={`flex-[2] px-4 py-2.5 rounded-xl text-sm font-bold shadow-lg flex justify-center items-center gap-2 ${isRecurring ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-blue-600 hover:bg-blue-700'} text-white`}>
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {modalMode === 'create' ? (isRecurring ? 'Criar Lote Recorrente' : 'Agendar e Prever Valor') : 'Atualizar Dados'}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </Layout>
  );
}
