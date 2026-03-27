import React, { useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import { X } from 'lucide-react'; // Ícone para fechar o modal

export default function Waitlist() {
  const [waitlist, setWaitlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Estados do Modal e dos Dropdowns (Listas de seleção)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [services, setServices] = useState([]);
  const [professionals, setProfessionals] = useState([]);

  // Estado do Formulário
  const [formData, setFormData] = useState({
    customer_id: '',
    servico_id: '',
    professional_id: '',
    data_hora_inicio_desejada: '',
    data_hora_fim_desejada: '',
    observacoes: ''
  });

  // Função para pegar o ID da Clínica atual
  const getTenantId = () => {
    const token = localStorage.getItem('medsched_token');
    if (!token) return null;
    const decoded = jwtDecode(token);
    return localStorage.getItem('selected_tenant_id') || decoded.tenant_id;
  };

  // 1. Busca a Fila de Espera
  const fetchWaitlist = async () => {
    try {
      const token = localStorage.getItem('medsched_token');
      const response = await fetch('http://localhost:40000/api/v1/waitlists', {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      if (response.ok) {
        setWaitlist(await response.json());
      }
    } catch (err) {
      setError('Não foi possível carregar a fila de espera.');
    } finally {
      setLoading(false);
    }
  };

  // 2. Busca os dados para preencher o formulário (Clientes, Serviços, etc)
  const fetchFormData = async () => {
    try {
      const token = localStorage.getItem('medsched_token');
      const tenantId = getTenantId();
      const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

      // Fazemos as 3 buscas ao mesmo tempo para ser rápido
      const [resCustomers, resServices, resUsers] = await Promise.all([
        fetch(`http://localhost:40000/api/v1/customers/?tenant_id=${tenantId}`, { headers }),
        fetch(`http://localhost:40000/api/v1/services/?tenant_id=${tenantId}`, { headers }),
        fetch(`http://localhost:40000/api/v1/users/?tenant_id=${tenantId}`, { headers })
      ]);

      if (resCustomers.ok) setCustomers(await resCustomers.json());
      if (resServices.ok) setServices(await resServices.json());
      if (resUsers.ok) {
        const users = await resUsers.json();
        // Filtra para mostrar apenas quem atende (Profissionais ou Gestores)
        setProfessionals(users.filter(u => ['PROFISSIONAL', 'GESTOR'].includes(u.papel)));
      }
    } catch (err) {
      console.error("Erro ao carregar dados do formulário", err);
    }
  };

  useEffect(() => {
    fetchWaitlist();
    fetchFormData(); // Já deixa as listas prontas nos bastidores
  }, []);

  // 3. Função que salva os dados no Banco
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('medsched_token');
      const tenantId = getTenantId();
      
      // Prepara o pacote de dados exatamente como a nossa API espera
      const payload = {
        ...formData,
        tenant_id: tenantId,
        professional_id: formData.professional_id || null // Se tiver vazio, manda nulo
      };

      const response = await fetch('http://localhost:40000/api/v1/waitlists/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        setIsModalOpen(false); // Fecha a janela
        setFormData({ // Limpa o formulário
          customer_id: '', servico_id: '', professional_id: '',
          data_hora_inicio_desejada: '', data_hora_fim_desejada: '', observacoes: ''
        });
        fetchWaitlist(); // Atualiza a tabela na tela
      } else {
        alert("Erro ao adicionar cliente na fila. Verifique os dados.");
      }
    } catch (err) {
      console.error("Erro no envio:", err);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto relative">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Fila de Espera</h1>
        {/* 👇 DRCODE: O botão agora altera o estado para abrir o Modal! */}
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded shadow transition-colors"
        >
          + Novo Cliente na Fila
        </button>
      </div>

      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}

      {/* TABELA PRINCIPAL */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente (ID)</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data Desejada</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan="3" className="px-6 py-4 text-center text-gray-500">Carregando fila...</td></tr>
            ) : waitlist.length === 0 ? (
              <tr><td colSpan="3" className="px-6 py-4 text-center text-gray-500">A fila de espera está vazia.</td></tr>
            ) : (
              waitlist.map((entry) => (
                <tr key={entry.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono text-xs">{entry.customer_id.substring(0,8)}...</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(entry.data_hora_inicio_desejada).toLocaleDateString('pt-BR')} até {new Date(entry.data_hora_fim_desejada).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                      {entry.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* O MODAL (Janela Flutuante) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
            
            {/* Cabeçalho do Modal */}
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-lg font-bold text-gray-800">Adicionar à Fila</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Corpo do Formulário */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cliente *</label>
                <select 
                  required
                  value={formData.customer_id}
                  onChange={(e) => setFormData({...formData, customer_id: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Selecione um cliente...</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Serviço *</label>
                <select 
                  required
                  value={formData.servico_id}
                  onChange={(e) => setFormData({...formData, servico_id: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Selecione o serviço desejado...</option>
                  {services.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Profissional (Opcional)</label>
                <select 
                  value={formData.professional_id}
                  onChange={(e) => setFormData({...formData, professional_id: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Qualquer profissional disponível</option>
                  {professionals.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data Início Desejada *</label>
                  <input 
                    type="datetime-local" required
                    value={formData.data_hora_inicio_desejada}
                    onChange={(e) => setFormData({...formData, data_hora_inicio_desejada: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data Fim Desejada *</label>
                  <input 
                    type="datetime-local" required
                    value={formData.data_hora_fim_desejada}
                    onChange={(e) => setFormData({...formData, data_hora_fim_desejada: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
                <textarea 
                  rows="2"
                  value={formData.observacoes}
                  onChange={(e) => setFormData({...formData, observacoes: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: Prefere atendimento no período da manhã..."
                ></textarea>
              </div>

              {/* Rodapé / Botões */}
              <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors">
                  Cancelar
                </button>
                <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow transition-colors">
                  Salvar na Fila
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}
