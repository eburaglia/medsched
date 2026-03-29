import React, { useEffect, useState } from 'react';
import api from '../services/api';
import Layout from '../components/Layout';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { CalendarDays, Users, Activity, Stethoscope, ChevronRight, Loader2 } from 'lucide-react';
import PerformanceBadge from '../components/PerformanceBadge';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [periodoGrafico, setPeriodoGrafico] = useState('semana');
  const [isLoading, setIsLoading] = useState(true);
  const [perfMetrics, setPerfMetrics] = useState({ network: 0, server: 0, browser: 0, api: 0, total: 0 });

  const fetchDashboardData = async (periodo) => {
    const startTime = performance.now();
    try {
      const response = await api.get(`/dashboard/stats?periodo=${periodo}`);
      const endTime = performance.now();
      
      setStats(response.data);

      // Calcula as métricas assim que renderizar
      requestAnimationFrame(() => {
        const renderTime = performance.now();
        const apiTotal = Math.round(endTime - startTime);
        const serverEstimate = Math.round(apiTotal * 0.35); // Simulando a divisão
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

    } catch (err) {
      console.error("Erro ao buscar estatísticas do dashboard", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setIsLoading(true);
    fetchDashboardData(periodoGrafico);
  }, [periodoGrafico]);

  if (isLoading || !stats) {
    return (
      <Layout>
        <div className="p-8 max-w-7xl mx-auto flex h-[80vh] items-center justify-center">
            <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-8 max-w-7xl mx-auto flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Visão geral do desempenho da sua clínica.</p>
        </div>

        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="p-4 bg-blue-50 text-blue-600 rounded-xl"><CalendarDays className="w-8 h-8" /></div>
            <div>
              <p className="text-sm font-medium text-gray-500">Atendimentos Hoje</p>
              <h3 className="text-2xl font-bold text-gray-900">{stats.resumo.servicos_hoje}</h3>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="p-4 bg-green-50 text-green-600 rounded-xl"><Users className="w-8 h-8" /></div>
            <div>
              <p className="text-sm font-medium text-gray-500">Pacientes Ativos</p>
              <h3 className="text-2xl font-bold text-gray-900">{stats.resumo.usuarios_ativos}</h3>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="p-4 bg-purple-50 text-purple-600 rounded-xl"><Stethoscope className="w-8 h-8" /></div>
            <div>
              <p className="text-sm font-medium text-gray-500">Profissionais</p>
              <h3 className="text-2xl font-bold text-gray-900">{stats.resumo.profissionais}</h3>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="p-4 bg-orange-50 text-orange-600 rounded-xl"><Activity className="w-8 h-8" /></div>
            <div>
              <p className="text-sm font-medium text-gray-500">Taxa de Ocupação</p>
              <h3 className="text-2xl font-bold text-gray-900">{stats.resumo.taxa_ocupacao}%</h3>
            </div>
          </div>
        </div>

        {/* Gráfico e Próximos Atendimentos */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Gráfico */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold text-gray-900">Evolução de Atendimentos</h2>
                <select 
                    value={periodoGrafico} 
                    onChange={(e) => setPeriodoGrafico(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="dia">Últimos 24h</option>
                    <option value="semana">Últimos 7 dias</option>
                    <option value="mes">Últimos 30 dias</option>
                </select>
            </div>
            
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.grafico[periodoGrafico]} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} dx={-10} />
                  <Tooltip cursor={{fill: '#F3F4F6'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                  <Legend iconType="circle" wrapperStyle={{paddingTop: '20px'}} />
                  <Bar dataKey="Agendados" fill="#3B82F6" radius={[4, 4, 0, 0]} maxBarSize={50} />
                  <Bar dataKey="Executados" fill="#10B981" radius={[4, 4, 0, 0]} maxBarSize={50} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Próximos Atendimentos */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold text-gray-900">Próximos Atendimentos</h2>
                <button className="text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors">Ver todos</button>
            </div>

            <div className="space-y-4">
                {stats.proximos_atendimentos.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-8">Nenhum atendimento agendado.</p>
                ) : (
                    stats.proximos_atendimentos.map((atendimento) => (
                        <div key={atendimento.id} className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:border-blue-100 hover:bg-blue-50/30 transition-colors group cursor-pointer">
                            <div>
                                <p className="font-bold text-gray-900 text-sm group-hover:text-blue-700 transition-colors">{atendimento.cliente}</p>
                                <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5"><Stethoscope className="w-3 h-3"/> {atendimento.profissional}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs font-bold text-blue-600 bg-blue-100 px-2 py-1 rounded-md inline-block mb-1">
                                    {new Date(atendimento.dataHora).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
                                </p>
                                <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">
                                    {new Date(atendimento.dataHora).toLocaleDateString('pt-BR', {day: '2-digit', month: 'short'})}
                                </p>
                            </div>
                        </div>
                    ))
                )}
            </div>
          </div>
        </div>

        {/* 👇 DRCODE: Nosso novo componente enxuto chamado aqui no final */}
        <div className="flex justify-start pt-2 pb-8">
            <PerformanceBadge metrics={perfMetrics} />
        </div>

      </div>
    </Layout>
  );
}
