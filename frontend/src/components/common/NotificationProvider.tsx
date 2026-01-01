import { useNotificationHub } from '../../hooks/useNotificationHub';
import { useAuthStore } from '../../store/authStore';

/**
 * Component that initializes the SignalR connection for real-time notifications.
 * Should be placed high in the component tree, after authentication is established.
 */
const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  const { isConnected, connectionState, error } = useNotificationHub();

  // Log connection status in development
  if (import.meta.env.DEV && isAuthenticated) {
    console.log(`🔔 Notification Hub: ${connectionState}${isConnected ? ' ✓' : ''}${error ? ` (Error: ${error.message})` : ''}`);
  }

  return <>{children}</>;
};

export default NotificationProvider;
