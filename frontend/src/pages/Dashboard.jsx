import React from 'react';
import { Calendar, DollarSign, TrendingUp, Clock } from 'lucide-react';

export default function Dashboard() {
  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Visão Geral</h1>
        <p className="text-gray-500 mt-1">Bem-vindo ao MedSched. Aqui está o resumo de hoje.</p>
      </div>

      {/* Grid de Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        
        {/* Card 1: Atendimentos Hoje */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center">
          <div className="bg-blue-50 p-4 rounded-lg mr-4">
            <Calendar className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Atendimentos Hoje</p>
            <h3 className="text-2xl font-bold text-gray-900">8</h3>
          </div>
        </div>

        {/* Card 2: Pacientes na Sala de Espera */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center">
          <div className="bg-orange-50 p-4 rounded-lg mr-4">
            <Clock className="w-6 h-6 text-orange-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Aguardando</p>
            <h3 className="text-2xl font-bold text-gray-900">2</h3>
          </div>
        </div>

        {/* Card 3: Receita Recebida (PAGO) */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center">
          <div className="bg-green-50 p-4 rounded-lg mr-4">
            <TrendingUp className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Receita (Hoje)</p>
            <h3 className="text-2xl font-bold text-gray-900">R$ 1.250</h3>
          </div>
        </div>

        {/* Card 4: Valores Pendentes */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center">
          <div className="bg-red-50 p-4 rounded-lg mr-4">
            <DollarSign className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">A Receber</p>
            <h3 className="text-2xl font-bold text-gray-900">R$ 450</h3>
          </div>
        </div>

      </div>

      {/* Área para futuros gráficos ou listas */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-64 flex items-center justify-center">
        <p className="text-gray-400">A lista dos próximos pacientes aparecerá aqui...</p>
      </div>
    </div>
  );
}
