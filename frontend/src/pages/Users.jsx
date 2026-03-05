import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { UserPlus, Mail, Shield, UserCheck, Loader2, AlertCircle } from 'lucide-react';
import { jwtDecode } from 'jwt-decode';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchUsers() {
      try {
        // 1. Pega o token do armazenamento local
        const token = localStorage.getItem('medsched_token');
        if (!token) throw new Error("Usuário não autenticado");

        // 2. Desempacota o token para ler as informações secretas
        const decodedToken = jwtDecode(token);
        
        // No seu backend, você gravou o tenant_id no token (no arquivo auth.py)
        // Precisamos verificar exatamente o nome do campo. Geralmente é "tenant_id" ou está dentro de um objeto.
        // Se a chamada falhar novamente, teremos que verificar como o create_access_token foi construído.
        const tenantId = decodedToken.tenant_id;

        if (!tenantId) {
          throw new Error("Tenant ID não encontrado no token.");
        }

        // 3. Faz a requisição enviando o tenant_id como parâmetro de consulta (Query Params)
        const response = await api.get('/users/', {
          params: { tenant_id: tenantId }
        });
        
        setUsers(response.data);
      } catch (err) {
        console.error("Erro ao buscar usuários:", err);
        // Captura a mensagem de erro específica do backend, se existir
        if (err.response && err.response.data && err.response.data.detail) {
           setError(`Erro: ${err.response.data.detail}`);
        } else {
           setError("Não foi possível carregar a lista de usuários.");
        }
      } finally {
        setIsLoading(false);
      }
    }
    fetchUsers();
  }, []);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Usuários</h1>
          <p className="text-gray-500 mt-1">Gerencie quem tem acesso à sua clínica.</p>
        </div>
        <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
          <UserPlus className="w-5 h-5" />
          Adicionar Usuário
        </button>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-md flex items-center text-red-700">
          <AlertCircle className="w-5 h-5 mr-2" />
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="h-64 flex flex-col items-center justify-center text-gray-500">
            <Loader2 className="w-8 h-8 animate-spin mb-2 text-blue-600" />
            Carregando usuários...
          </div>
        ) : users.length === 0 && !error ? (
           <div className="h-64 flex flex-col items-center justify-center text-gray-500">
             Nenhum usuário encontrado.
           </div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 text-sm uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-semibold">Nome</th>
                <th className="px-6 py-4 font-semibold">E-mail</th>
                <th className="px-6 py-4 font-semibold">Cargo</th>
                <th className="px-6 py-4 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{user.nome}</div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    <div className="flex items-center">
                      <Mail className="w-4 h-4 mr-2 text-gray-400" />
                      {user.email}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      <Shield className="w-3 h-3 mr-1" />
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user.status === 'ATIVO' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      <UserCheck className="w-3 h-3 mr-1" />
                      {user.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
