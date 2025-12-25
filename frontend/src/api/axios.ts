import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { toast } from 'react-toastify';

// En développement, utiliser une URL vide pour passer par le proxy Vite
// En production, utiliser l'URL du serveur configurée
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? '' : 'https://localhost:5000');

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add token to requests
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors and token refresh
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Handle 401 Unauthorized
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const response = await axios.post<{ data: { token: string; refreshToken: string } }>(
            `${API_BASE_URL}/api/auth/refresh-token`,
            { refreshToken }
          );

          const { token, refreshToken: newRefreshToken } = response.data.data;
          localStorage.setItem('token', token);
          localStorage.setItem('refreshToken', newRefreshToken);

          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${token}`;
          }
          return axiosInstance(originalRequest);
        } catch (refreshError) {
          // Refresh failed, logout user
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      } else {
        // No refresh token, redirect to login
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }

    // Handle other errors
    if (error.response) {
      const message = (error.response.data as { message?: string })?.message || 'Une erreur s\'est produite';
      const errors = (error.response.data as { errors?: string[] })?.errors || [];
      const isGetRequest = originalRequest?.method?.toUpperCase() === 'GET';

      if (error.response.status >= 500) {
        toast.error('Erreur serveur. Veuillez réessayer plus tard.');
      } else if (error.response.status === 403) {
        toast.error('Accès refusé. Vous n\'avez pas les permissions nécessaires.');
      } else if (error.response.status === 404) {
        // Ne pas afficher de toast pour les requêtes GET 404 (état vide normal: profil, évaluations, etc.)
        if (!isGetRequest) {
          toast.error('Ressource non trouvée.');
        }
      } else if (error.response.status === 400) {
        // Afficher les erreurs de validation seulement pour les actions (POST, PUT, DELETE)
        if (!isGetRequest) {
          if (errors.length > 0) {
            toast.error(errors.join(', '));
          } else {
            toast.error(message);
          }
        }
      } else if (errors.length > 0) {
        toast.error(errors.join(', '));
      } else if (!isGetRequest) {
        // Pour les autres erreurs, afficher seulement si ce n'est pas une requête GET
        toast.error(message);
      }
    } else if (error.request) {
      toast.error('Impossible de contacter le serveur. Vérifiez votre connexion.');
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;

