import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Activity, Lock, Mail, ArrowRight, ArrowLeft, Loader2, AlertCircle } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  
  // Estados para controlar o fluxo da tela
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Dados do formulário
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Dados simulados vindos do backend
  const [tenantName, setTenantName] = useState('');

  // Etapa 1: Simula a busca do Tenant
  const handleVerifyEmail = (e) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    setErrorMessage('');

    setTimeout(() => {
      setTenantName('Clínica Master'); 
      setStep(2); 
      setIsLoading(false);
    }, 800);
  };

  // Etapa 2: Login REAL com a API FastAPI
  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');

    try {
      // O FastAPI OAuth2 exige formato de formulário (URLSearchParams)
      const params = new URLSearchParams();
      params.append('username', email); // FastAPI espera a chave 'username'
      params.append('password', password);

      // Usamos window.location.hostname para pegar o IP do servidor automaticamente
      const apiUrl = `http://${window.location.hostname}:40000/api/v1/auth/login`;

      const response = await axios.post(apiUrl, params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      // Sucesso! Guarda o crachá (token) no navegador
      const token = response.data.access_token;
      localStorage.setItem('medsched_token', token);
      
      // Redireciona o usuário para a Dashboard
      navigate('/dashboard');

    } catch (error) {
      console.error("Erro no login:", error);
      // Se a API retornar a mensagem de erro que você programou no backend
      if (error.response && error.response.data && error.response.data.detail) {
        setErrorMessage(error.response.data.detail);
      } else {
        setErrorMessage("Não foi possível conectar ao servidor.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Função para voltar e corrigir o e-mail
  const goBack = () => {
    setStep(1);
    setPassword('');
    setErrorMessage('');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 transition-all">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="bg-blue-600 p-3 rounded-xl shadow-lg">
            <Activity className="w-10 h-10 text-white" />
          </div>
        </div>
        
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 transition-all">
          {step === 1 ? 'Acesse o MedSched' : `Bem-vindo à ${tenantName}`}
        </h2>
        
        <p className="mt-2 text-center text-sm text-gray-600">
          {step === 1 ? (
            'Gestão inteligente para sua clínica'
          ) : (
            <span className="flex items-center justify-center gap-2">
              Acessando como <strong className="text-gray-900">{email}</strong>
              <button type="button" onClick={goBack} className="text-blue-600 hover:text-blue-500 font-medium">
                (alterar)
              </button>
            </span>
          )}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl border border-gray-100 sm:rounded-2xl sm:px-10">
          
          {/* Alerta de Erro */}
          {errorMessage && (
            <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4 rounded-md flex items-start">
              <AlertCircle className="w-5 h-5 text-red-500 mr-2 flex-shrink-0" />
              <p className="text-sm text-red-700">{errorMessage}</p>
            </div>
          )}

          {/* ETAPA 1 */}
          {step === 1 && (
            <form className="space-y-6" onSubmit={handleVerifyEmail}>
              <div>
                <label className="block text-sm font-medium text-gray-700">E-mail Profissional</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    required
                    autoFocus
                    className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-lg py-3 border outline-none"
                    placeholder="admin@clinica.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-all disabled:bg-blue-400"
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><ArrowRight className="w-4 h-4" /> Continuar</>}
                </button>
              </div>
            </form>
          )}

          {/* ETAPA 2 */}
          {step === 2 && (
            <form className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500" onSubmit={handleLogin}>
              <div>
                <label className="block text-sm font-medium text-gray-700">Senha</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="password"
                    required
                    autoFocus
                    className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-lg py-3 border outline-none"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={goBack}
                  className="flex justify-center items-center py-3 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  title="Voltar"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors disabled:bg-blue-400"
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Entrar no Sistema'}
                </button>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}
