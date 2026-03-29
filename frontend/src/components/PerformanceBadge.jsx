import React, { useState } from 'react';
import { Clock, Activity } from 'lucide-react';

export default function PerformanceBadge({ metrics }) {
  const [showPerfDetails, setShowPerfDetails] = useState(false);

  // Garantindo valores padrão caso não sejam passados
  const safeMetrics = metrics || { network: 0, server: 0, browser: 0, api: 0, total: 0 };

  return (
    <div className="relative z-40">
      <button 
        onClick={() => setShowPerfDetails(!showPerfDetails)} 
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors border ${showPerfDetails ? 'bg-blue-50 border-blue-200 text-blue-700' : 'border-transparent hover:bg-gray-100 text-gray-500'}`} 
        title="Clique para detalhes"
      >
        <Clock className="w-4 h-4" /> 
        <span className="font-medium">Carregado em {safeMetrics.total}ms</span>
      </button>

      {showPerfDetails && (
        <div className="absolute bottom-10 left-0 bg-white border border-gray-200 shadow-xl rounded-xl p-4 w-64 text-gray-700 animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-center gap-2 mb-3 border-b border-gray-100 pb-2">
            <Activity className="w-4 h-4 text-blue-600" />
            <h4 className="font-bold text-sm text-gray-900">Análise de Performance</h4>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center">
                <span className="text-gray-500">Tempo de Rede:</span> 
                <span className="font-semibold">{safeMetrics.network}ms</span>
            </div>
            <div className="flex justify-between items-center">
                <span className="text-gray-500">API (Servidor):</span> 
                <span className="font-semibold">{safeMetrics.server}ms</span>
            </div>
            <div className="flex justify-between items-center">
                <span className="text-gray-500">Render (Browser):</span> 
                <span className="font-semibold">{safeMetrics.browser}ms</span>
            </div>
            <div className="pt-2 mt-2 border-t border-gray-100 flex justify-between items-center">
                <span className="font-bold text-gray-900">Tempo Total:</span> 
                <span className="font-bold text-blue-600 text-base">{safeMetrics.total}ms</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
