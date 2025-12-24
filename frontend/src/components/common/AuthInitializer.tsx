import { useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { authApi } from '../../api/auth';
import { clientsApi } from '../../api/clients';
import { User } from '../../types';

/**
 * Composant pour initialiser l'authentification au démarrage
 * Vérifie si le token est valide et récupère les infos utilisateur
 */
const AuthInitializer = ({ children }: { children: React.ReactNode }) => {
  const { token, isAuthenticated, setUser, logout, user } = useAuthStore();

  useEffect(() => {
    const initializeAuth = async () => {
      // Si on a un token mais pas d'utilisateur, récupérer les infos
      if (token && isAuthenticated) {
        try {
          const response = await authApi.getCurrentUser();
          if (response.success && response.data) {
            let userData: User = response.data;
            
            // Si l'utilisateur est un client, récupérer son clientId
            if (userData.role === 'Client') {
              try {
                const clientResponse = await clientsApi.getMyProfile();
                if (clientResponse.success && clientResponse.data) {
                  userData = {
                    ...userData,
                    clientId: clientResponse.data.id
                  };
                }
              } catch (err) {
                console.warn('Could not fetch client profile:', err);
              }
            }
            
            setUser(userData);
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

  // Si l'utilisateur est un client et n'a pas de clientId, récupérer le profil
  useEffect(() => {
    const fetchClientId = async () => {
      if (user && user.role === 'Client' && !user.clientId && token && isAuthenticated) {
        try {
          const clientResponse = await clientsApi.getMyProfile();
          if (clientResponse.success && clientResponse.data) {
            setUser({
              ...user,
              clientId: clientResponse.data.id
            });
          }
        } catch (err) {
          console.warn('Could not fetch client profile:', err);
        }
      }
    };

    fetchClientId();
  }, [user, token, isAuthenticated, setUser]);

  return <>{children}</>;
};

export default AuthInitializer;

