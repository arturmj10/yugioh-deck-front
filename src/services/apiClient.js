import axios from 'axios';

const API_BASE_URL = 'http://localhost:5282/api';

export function createApiClient(resourcePath) {
  const api = axios.create({
    baseURL: `${API_BASE_URL}${resourcePath}`,
    headers: { 'Content-Type': 'application/json' },
  });

  api.interceptors.response.use(
    (response) => response,
    (error) => {
      const data = error.response?.data;
      const message =
        data?.mensagem ||
        (typeof data === 'string' ? data : null) ||
        error.message ||
        'Erro na requisição';
      return Promise.reject(new Error(message));
    }
  );

  return api;
}
