import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { jwtDecode } from 'jwt-decode';
import { Calendar, Users, Activity, TrendingUp } from 'lucide-react';
import api from '../services/api';

export default function Dashboard() {
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('medsched_token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        
        // Tenta pegar o nome do token, se não tiver, busca no banco de dados para dar as boas-vindas
        if (decoded.nome || decoded.name) {
          setUserName(decoded.nome || decoded.name);
        } else if (decoded.sub) {
          api.get(`/users/${decoded.sub}`, { params: { tenant_id: decoded.tenant_id } })
            .then(response => {
              const nomeCompleto = response.data.nome || 'Usuário';
              const partesNome = nomeCompleto.split(' ');
              const nomeCurto = partesNome.length > 1 ? `${partesNome[0]} ${partesNome[partesNome.length - 1]}` : nomeCompleto;
              setUserName(nomeCurto);
            })
            .catch(() => setUserName('Usuário'));
        }
      } catch (e) {
        console.error("Token inválido", e);
      }
    }
  }, []);

  return (
    <Layout>
      <div className="p-8 max-w-7xl mx-auto flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* CABEÇALHO DO DASHBOARD */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Bem-vindo(a) de volta, <span className="font-semibold text-blue-600">{userName}</span>!</p>
        </div>

        {/* WIDGETS DE RESUMO (MOCKUPS PARA FUTURA INTEGRAÇÃO) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-4">
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Consultas Hoje</p>
              <p className="text-2xl font-bold text-gray-900">--</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="p-3 bg-green-50 text-green-600 rounded-lg">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Pacientes Ativos</p>
              <p className="text-2xl font-bold text-gray-900">--</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Taxa de Ocupação</p>
              <p className="text-2xl font-bold text-gray-900">--%</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="p-3 bg-orange-50 text-orange-600 rounded-lg">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Faturamento (Mês)</p>
              <p className="text-2xl font-bold text-gray-900">R$ --</p>
            </div>
          </div>

        </div>

        {/* ÁREA DE CONTEÚDO PRINCIPAL DO DASHBOARD */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-2">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 lg:col-span-2 min-h-[400px] flex flex-col items-center justify-center text-gray-400">
            <Activity className="w-12 h-12 mb-3 opacity-20" />
            <p className="font-medium">O gráfico de atendimentos será exibido aqui.</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 min-h-[400px] flex flex-col items-center justify-center text-gray-400">
            <Calendar className="w-12 h-12 mb-3 opacity-20" />
            <p className="font-medium">Próximos compromissos.</p>
          </div>
        </div>

      </div>
    </Layout>
  );
}
