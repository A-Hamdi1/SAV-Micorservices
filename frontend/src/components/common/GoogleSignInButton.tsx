import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

// Google Client ID - À configurer dans les variables d'environnement
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

interface GoogleSignInButtonProps {
  onError?: (error: string) => void;
  onLoading?: (loading: boolean) => void;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
          }) => void;
          renderButton: (
            element: HTMLElement,
            config: {
              type?: 'standard' | 'icon';
              theme?: 'outline' | 'filled_blue' | 'filled_black';
              size?: 'large' | 'medium' | 'small';
              text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
              shape?: 'rectangular' | 'pill' | 'circle' | 'square';
              logo_alignment?: 'left' | 'center';
              width?: string;
              locale?: string;
            }
          ) => void;
          prompt: () => void;
        };
      };
    };
  }
}

const GoogleSignInButton = ({ onError, onLoading }: GoogleSignInButtonProps) => {
  const navigate = useNavigate();
  const { googleLogin } = useAuthStore();

  const handleGoogleCallback = useCallback(
    async (response: { credential: string }) => {
      try {
        onLoading?.(true);

        await googleLogin(response.credential);

        // Récupérer le rôle après connexion pour redirection
        const currentRole = useAuthStore.getState().role;
        
        // Rediriger selon le rôle
        if (currentRole === 'Client') {
          navigate('/client/dashboard');
        } else if (currentRole === 'Technicien') {
          navigate('/technicien/interventions');
        } else if (currentRole === 'ResponsableSAV') {
          navigate('/responsable/dashboard');
        } else {
          navigate('/');
        }
      } catch (error) {
        console.error('Google login error:', error);
        onError?.(error instanceof Error ? error.message : 'Une erreur est survenue lors de la connexion avec Google');
      } finally {
        onLoading?.(false);
      }
    },
    [navigate, googleLogin, onError, onLoading]
  );

  useEffect(() => {
    // Charger le script Google Identity Services
    const loadGoogleScript = () => {
      if (document.getElementById('google-identity-script')) {
        initializeGoogle();
        return;
      }

      const script = document.createElement('script');
      script.id = 'google-identity-script';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => initializeGoogle();
      document.body.appendChild(script);
    };

    const initializeGoogle = () => {
      if (!window.google || !GOOGLE_CLIENT_ID) {
        console.warn('Google Sign-In non configuré: VITE_GOOGLE_CLIENT_ID manquant');
        return;
      }

      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleCallback,
        auto_select: false,
      });

      const buttonElement = document.getElementById('google-signin-button');
      if (buttonElement) {
        window.google.accounts.id.renderButton(buttonElement, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: 'continue_with',
          shape: 'rectangular',
          logo_alignment: 'left',
          width: 350,
          locale: 'fr',
        });
      }
    };

    loadGoogleScript();
  }, [handleGoogleCallback]);

  if (!GOOGLE_CLIENT_ID) {
    return null; // Ne pas afficher le bouton si pas configuré
  }

  return (
    <div className="w-full">
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-white px-2 text-gray-500">Ou continuer avec</span>
        </div>
      </div>

      <div className="mt-4">
        <div id="google-signin-button" className="flex justify-center"></div>
      </div>
    </div>
  );
};

export default GoogleSignInButton;
