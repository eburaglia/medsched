import axios from 'axios';

const api = axios.create({
  baseURL: `http://${window.location.hostname}:40000/api/v1`,
});

api.interceptors.request.use(
  async (config) => {
    const token = localStorage.getItem('medsched_token');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // MÁGICA DA IMPERSONAÇÃO:
    // Se houver um tenant selecionado pelo Super Admin, envia no cabeçalho
    const selectedTenant = localStorage.getItem('selected_tenant_id');
    if (selectedTenant) {
      config.headers['X-Tenant-ID'] = selectedTenant;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('medsched_token');
      localStorage.removeItem('selected_tenant_id');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
