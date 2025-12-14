import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, AuthResponse } from '../types';
import { authApi } from '../api/auth';
import { toast } from 'react-toastify';

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  role: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, confirmPassword: string, role: string) => Promise<void>;
  logout: () => void;
  refreshAccessToken: () => Promise<void>;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      role: null,

      login: async (email: string, password: string) => {
        try {
          const response = await authApi.login({ email, password });
          if (response.success && response.data) {
            const authData = response.data;
            
            // Récupérer les infos utilisateur complètes
            let userInfo: User | null = null;
            try {
              const userResponse = await authApi.getCurrentUser();
              if (userResponse.success && userResponse.data) {
                userInfo = userResponse.data;
              }
            } catch (err) {
              console.warn('Could not fetch user info:', err);
            }

            const user: User = userInfo || {
              id: '',
              email: authData.email,
              role: authData.role,
            };

            set({
              user,
              token: authData.token,
              refreshToken: authData.refreshToken,
              isAuthenticated: true,
              role: authData.role,
            });

            // Stocker aussi directement dans localStorage pour l'intercepteur Axios
            localStorage.setItem('token', authData.token);
            localStorage.setItem('refreshToken', authData.refreshToken);

            toast.success('Connexion réussie');
          } else {
            throw new Error(response.message || 'Échec de la connexion');
          }
        } catch (error: any) {
          toast.error(error.message || 'Erreur lors de la connexion');
          throw error;
        }
      },

      register: async (email: string, password: string, confirmPassword: string, role: string) => {
        try {
          const response = await authApi.register({ email, password, confirmPassword, role });
          if (response.success && response.data) {
            const authData = response.data;
            
            // Récupérer les infos utilisateur complètes
            let userInfo: User | null = null;
            try {
              const userResponse = await authApi.getCurrentUser();
              if (userResponse.success && userResponse.data) {
                userInfo = userResponse.data;
              }
            } catch (err) {
              console.warn('Could not fetch user info:', err);
            }

            const user: User = userInfo || {
              id: '',
              email: authData.email,
              role: authData.role,
            };

            set({
              user,
              token: authData.token,
              refreshToken: authData.refreshToken,
              isAuthenticated: true,
              role: authData.role,
            });

            // Stocker aussi directement dans localStorage pour l'intercepteur Axios
            localStorage.setItem('token', authData.token);
            localStorage.setItem('refreshToken', authData.refreshToken);

            toast.success('Inscription réussie');
          } else {
            throw new Error(response.message || 'Échec de l\'inscription');
          }
        } catch (error: any) {
          toast.error(error.message || 'Erreur lors de l\'inscription');
          throw error;
        }
      },

      logout: async () => {
        const { refreshToken } = get();
        if (refreshToken) {
          try {
            await authApi.revokeToken(refreshToken);
          } catch (error) {
            console.error('Error revoking token:', error);
          }
        }

        set({
          user: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
          role: null,
        });

        toast.info('Déconnexion réussie');
      },

      refreshAccessToken: async () => {
        const { refreshToken } = get();
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        try {
          const response = await authApi.refreshToken(refreshToken);
          if (response.success && response.data) {
            const authData = response.data;
            set({
              token: authData.token,
              refreshToken: authData.refreshToken,
            });
            
            // Stocker aussi directement dans localStorage pour l'intercepteur Axios
            localStorage.setItem('token', authData.token);
            localStorage.setItem('refreshToken', authData.refreshToken);
          } else {
            throw new Error('Failed to refresh token');
          }
        } catch (error) {
          get().logout();
          throw error;
        }
      },

      setUser: (user: User) => {
        set({ user, role: user.role });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
        role: state.role,
      }),
    }
  )
);

