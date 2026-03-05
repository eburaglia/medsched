import axios from 'axios';

// Cria uma instância centralizada do Axios
const api = axios.create({
  // Usa o IP atual do navegador e aponta para a porta do FastAPI
  baseURL: `http://${window.location.hostname}:40000/api/v1`,
});

// Interceptor de Requisição: Antes de enviar qualquer pedido, faz isso:
api.interceptors.request.use(
  async (config) => {
    // 1. Pega o crachá do usuário no armazenamento do navegador
    const token = localStorage.getItem('medsched_token');
    
    // 2. Se o crachá existir, anexa ele no cabeçalho de Autorização
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor de Resposta: Se o backend disser "Token Inválido" (401), desloga o usuário
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      console.warn("Sessão expirada ou token inválido. Deslogando...");
      localStorage.removeItem('medsched_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
