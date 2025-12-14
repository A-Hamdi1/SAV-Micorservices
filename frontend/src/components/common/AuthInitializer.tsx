import { useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { authApi } from '../../api/auth';

/**
 * Composant pour initialiser l'authentification au démarrage
 * Vérifie si le token est valide et récupère les infos utilisateur
 */
const AuthInitializer = ({ children }: { children: React.ReactNode }) => {
  const { token, isAuthenticated, setUser, logout } = useAuthStore();

  useEffect(() => {
    const initializeAuth = async () => {
      // Si on a un token mais pas d'utilisateur, récupérer les infos
      if (token && isAuthenticated) {
        try {
          const response = await authApi.getCurrentUser();
          if (response.success && response.data) {
            setUser(response.data);
          }
        } catch (error) {
          console.warn('Could not fetch user info on init:', error);
          // Si le token est invalide, déconnecter
          await logout();
        }
      }
    };

    initializeAuth();
  }, [token, isAuthenticated, setUser, logout]);

  return <>{children}</>;
};

export default AuthInitializer;

