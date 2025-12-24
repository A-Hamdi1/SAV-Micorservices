import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { User, UserRole } from '../types';
import { authApi } from '../api/auth';
import { clientsApi } from '../api/clients';
import { toast } from 'react-toastify';

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  role: UserRole | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, confirmPassword: string, role: string) => Promise<void>;
  logout: () => void;
  refreshAccessToken: () => Promise<void>;
  setUser: (user: User) => void;
  getToken: () => string | null;
}

// Custom storage that syncs with localStorage for axios interceptor
const customStorage = createJSONStorage(() => ({
  getItem: (name: string) => {
    const item = localStorage.getItem(name);
    return item;
  },
  setItem: (name: string, value: string) => {
    localStorage.setItem(name, value);
    // Also sync individual tokens for axios interceptor
    try {
      const parsed = JSON.parse(value);
      if (parsed.state?.token) {
        localStorage.setItem('token', parsed.state.token);
      }
      if (parsed.state?.refreshToken) {
        localStorage.setItem('refreshToken', parsed.state.refreshToken);
      }
    } catch {
      // Ignore parse errors
    }
  },
  removeItem: (name: string) => {
    localStorage.removeItem(name);
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
  },
}));

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      role: null,

      // Helper to get current token (useful for axios interceptor)
      getToken: () => get().token,

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

            let user: User = userInfo || {
              id: '',
              email: authData.email,
              role: authData.role,
            };

            // Si l'utilisateur est un client, récupérer son clientId
            if (authData.role === 'Client') {
              try {
                const clientResponse = await clientsApi.getMyProfile();
                if (clientResponse.success && clientResponse.data) {
                  user = {
                    ...user,
                    clientId: clientResponse.data.id
                  };
                }
              } catch (err) {
                console.warn('Could not fetch client profile:', err);
              }
            }

            set({
              user,
              token: authData.token,
              refreshToken: authData.refreshToken,
              isAuthenticated: true,
              role: authData.role,
            });

            toast.success('Connexion réussie');
          } else {
            throw new Error(response.message || 'Échec de la connexion');
          }
        } catch (error) {
          const errMsg = error instanceof Error ? error.message : 'Erreur lors de la connexion';
          toast.error(errMsg);
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

            // Si l'utilisateur est un client, le clientId sera récupéré après création du profil
            // Pour l'instant on set l'utilisateur sans clientId

            set({
              user,
              token: authData.token,
              refreshToken: authData.refreshToken,
              isAuthenticated: true,
              role: authData.role,
            });

            toast.success('Inscription réussie');
          } else {
            throw new Error(response.message || 'Échec de l\'inscription');
          }
        } catch (error) {
          const errMsg = error instanceof Error ? error.message : 'Erreur lors de l\'inscription';
          toast.error(errMsg);
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
            // Note: Token sync handled by custom storage
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
      storage: customStorage,
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

