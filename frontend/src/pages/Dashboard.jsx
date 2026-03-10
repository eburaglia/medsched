import React, { useEffect, useState, useMemo } from 'react';
import Layout from '../components/Layout';
import { jwtDecode } from 'jwt-decode';
import { Calendar, Users, Activity, TrendingUp, UserCog, ArrowUpDown, Loader2 } from 'lucide-react';
import api from '../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function Dashboard() {
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Estado para armazenar os dados reais vindos da API
  const [stats, setStats] = useState({
    resumo: { servicos_hoje: 0, usuarios_ativos: 0, profissionais: 0, taxa_ocupacao: 0 },
    proximos_atendimentos: [],
    grafico: { dia: [], semana: [], mes: [] }
  });

  const [sortConfig, setSortConfig] = useState({ key: 'dataHora', direction: 'ascending' });
  const [graficoFiltro, setGraficoFiltro] = useState('semana');

  useEffect(() => {
    const token = localStorage.getItem('medsched_token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        
        // Normaliza a role para letras minúsculas para facilitar a comparação
        const role = decoded.role || decoded.papel || decoded.perfil || 'usuario';
        setUserRole(role.toLowerCase());
        
        if (decoded.nome || decoded.name) {
          setUserName(decoded.nome || decoded.name);
        } else if (decoded.sub) {
          api.get(`/users/${decoded.sub}`, { params: { tenant_id: decoded.tenant_id } })
            .then(response => {
              const nomeCompleto = response.data.nome || 'Usuário';
              const partesNome = nomeCompleto.split(' ');
              setUserName(partesNome.length > 1 ? `${partesNome[0]} ${partesNome[partesNome.length - 1]}` : nomeCompleto);
              if(response.data.papel) setUserRole(response.data.papel.toLowerCase());
            })
            .catch(() => setUserName('Usuário'));
        }
      } catch (e) {
        console.error("Token inválido", e);
      }
    }
  }, []);

  // Busca os dados reais do Dashboard na nossa nova rota
  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        const response = await api.get(`/dashboard/stats?periodo=${graficoFiltro}`);
        setStats(response.data);
      } catch (error) {
        console.error("Erro ao buscar estatísticas do dashboard", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [graficoFiltro]);

  // Lógica de Ordenação da Tabela
  const sortedAtendimentos = useMemo(() => {
    let sortableItems = [...(stats.proximos_atendimentos || [])];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [stats.proximos_atendimentos, sortConfig]);

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const formatDateTime = (isoString) => {
    if (!isoString) return '--';
    const date = new Date(isoString);
    return date.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  // Regra de segurança visual: Apenas roles específicas veem o faturamento
  const podeVerFaturamento = ['admin', 'tenant_admin', 'gestor', 'profissional'].includes(userRole);

  return (
    <Layout>
      <div className="p-8 max-w-7xl mx-auto flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* CABEÇALHO DO DASHBOARD */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Bem-vindo(a) de volta, <span className="font-semibold text-blue-600">{userName}</span>!</p>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-blue-600">
            <Loader2 className="w-10 h-10 animate-spin mb-4" />
            <p className="font-medium text-gray-500">Carregando painel de controle...</p>
          </div>
        ) : (
          <>
            {/* WIDGETS DE RESUMO */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mt-4">
              
              <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 flex items-center gap-4 hover:shadow-md transition-shadow">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                  <Calendar className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Serviços Hoje</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.resumo?.servicos_hoje || 0}</p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 flex items-center gap-4 hover:shadow-md transition-shadow">
                <div className="p-3 bg-green-50 text-green-600 rounded-lg">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Usuários</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.resumo?.usuarios_ativos || 0}</p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 flex items-center gap-4 hover:shadow-md transition-shadow">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
                  <UserCog className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Profissionais</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.resumo?.profissionais || 0}</p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 flex items-center gap-4 hover:shadow-md transition-shadow">
                <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
                  <Activity className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Taxa de Ocupação</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.resumo?.taxa_ocupacao || 0}%</p>
                </div>
              </div>

              {podeVerFaturamento ? (
                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 flex items-center gap-4 hover:shadow-md transition-shadow">
                  <div className="p-3 bg-orange-50 text-orange-600 rounded-lg">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Faturamento</p>
                    <p className="text-2xl font-bold text-gray-900">R$ 0,00</p>
                  </div>
                </div>
              ) : null /* Aqui mudamos para null para simplesmente sumir com o card se não tiver acesso */}

            </div>

            {/* ÁREA DE CONTEÚDO PRINCIPAL DO DASHBOARD */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-2">
              
              {/* TABELA DE PRÓXIMOS ATENDIMENTOS */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 lg:col-span-2 flex flex-col overflow-hidden">
                <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                  <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-blue-600"/> Próximos Atendimentos (Top 5)
                  </h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => requestSort('dataHora')}>
                          <div className="flex items-center gap-1">Data/Hora <ArrowUpDown className="w-3 h-3"/></div>
                        </th>
                        <th className="px-6 py-3 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => requestSort('profissional')}>
                          <div className="flex items-center gap-1">Profissional <ArrowUpDown className="w-3 h-3"/></div>
                        </th>
                        <th className="px-6 py-3 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => requestSort('cliente')}>
                          <div className="flex items-center gap-1">Cliente <ArrowUpDown className="w-3 h-3"/></div>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {sortedAtendimentos.map((atendimento) => (
                        <tr key={atendimento.id} className="hover:bg-blue-50/30 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-gray-700 font-medium">{formatDateTime(atendimento.dataHora)}</td>
                          <td className="px-6 py-4 text-gray-600">{atendimento.profissional}</td>
                          <td className="px-6 py-4 text-gray-600">{atendimento.cliente}</td>
                        </tr>
                      ))}
                      {sortedAtendimentos.length === 0 && (
                        <tr>
                          <td colSpan="3" className="px-6 py-8 text-center text-gray-400">Nenhum atendimento futuro agendado.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* GRÁFICO DE BARRAS */}
              <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 flex flex-col">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-purple-600"/> Desempenho
                  </h2>
                  <select 
                    value={graficoFiltro} 
                    onChange={(e) => setGraficoFiltro(e.target.value)}
                    className="text-sm border border-gray-300 rounded-md px-2 py-1 outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="dia">Hoje</option>
                    <option value="semana">Esta Semana</option>
                    <option value="mes">Este Mês</option>
                  </select>
                </div>
                
                <div className="flex-1 min-h-[300px] w-full">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={stats.grafico?.[graficoFiltro] || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                      <Tooltip 
                        cursor={{ fill: '#f9fafb' }}
                        contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                      />
                      <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }}/>
                      <Bar dataKey="Agendados" fill="#93c5fd" radius={[4, 4, 0, 0]} maxBarSize={40} />
                      <Bar dataKey="Executados" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
