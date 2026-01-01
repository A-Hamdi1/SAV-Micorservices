import { useEffect, useRef, useCallback, useState } from 'react';
import * as signalR from '@microsoft/signalr';
import { useAuthStore } from '../store/authStore';
import { Notification, NotificationCount } from '../api/notifications';
import { useQueryClient } from '@tanstack/react-query';

// SignalR Hub URL - connect directly to the Notifications service
const SIGNALR_HUB_URL = 'https://localhost:5006/hubs/notifications';

export interface UseNotificationHubResult {
  isConnected: boolean;
  connectionState: signalR.HubConnectionState;
  error: Error | null;
}

export const useNotificationHub = (): UseNotificationHubResult => {
  const { token, isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();
  const connectionRef = useRef<signalR.HubConnection | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionState, setConnectionState] = useState<signalR.HubConnectionState>(
    signalR.HubConnectionState.Disconnected
  );
  const [error, setError] = useState<Error | null>(null);

  const handleNewNotification = useCallback(
    (notification: Notification) => {
      console.log('📬 New notification received:', notification);
      
      // Invalidate queries to refresh notification data
      queryClient.invalidateQueries({ queryKey: ['notificationCount'] });
      queryClient.invalidateQueries({ queryKey: ['unreadNotifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });

      // No toast popup - notifications are shown in the NotificationDropdown
    },
    [queryClient]
  );

  const handleNotificationCount = useCallback(
    (count: NotificationCount) => {
      console.log('📊 Notification count update:', count);
      
      // Update the cache directly for immediate UI update
      queryClient.setQueryData(['notificationCount'], count);
    },
    [queryClient]
  );

  const startConnection = useCallback(async () => {
    if (!token || !isAuthenticated) {
      console.log('🔒 Not authenticated, skipping SignalR connection');
      return;
    }

    // If already connected or connecting, don't start a new connection
    if (connectionRef.current?.state === signalR.HubConnectionState.Connected ||
        connectionRef.current?.state === signalR.HubConnectionState.Connecting) {
      return;
    }

    try {
      const connection = new signalR.HubConnectionBuilder()
        .withUrl(SIGNALR_HUB_URL, {
          accessTokenFactory: () => token,
          skipNegotiation: false,
          transport: signalR.HttpTransportType.WebSockets | 
                     signalR.HttpTransportType.ServerSentEvents | 
                     signalR.HttpTransportType.LongPolling,
        })
        .withAutomaticReconnect({
          nextRetryDelayInMilliseconds: (retryContext) => {
            // Exponential backoff: 0s, 2s, 4s, 8s, 16s, then cap at 30s
            const delay = Math.min(Math.pow(2, retryContext.previousRetryCount) * 1000, 30000);
            console.log(`🔄 Reconnecting in ${delay}ms...`);
            return delay;
          },
        })
        .configureLogging(signalR.LogLevel.Information)
        .build();

      // Register event handlers
      connection.on('ReceiveNotification', handleNewNotification);
      connection.on('ReceiveNotificationCount', handleNotificationCount);

      // Connection state change handlers
      connection.onreconnecting((error) => {
        console.warn('🔄 SignalR reconnecting...', error);
        setConnectionState(signalR.HubConnectionState.Reconnecting);
        setIsConnected(false);
      });

      connection.onreconnected((connectionId) => {
        console.log('✅ SignalR reconnected:', connectionId);
        setConnectionState(signalR.HubConnectionState.Connected);
        setIsConnected(true);
        setError(null);
      });

      connection.onclose((error) => {
        console.log('❌ SignalR connection closed', error);
        setConnectionState(signalR.HubConnectionState.Disconnected);
        setIsConnected(false);
        if (error) {
          setError(error);
        }
      });

      connectionRef.current = connection;

      // Start the connection
      await connection.start();
      console.log('✅ SignalR connected successfully');
      setConnectionState(signalR.HubConnectionState.Connected);
      setIsConnected(true);
      setError(null);
    } catch (err) {
      console.error('❌ SignalR connection error:', err);
      setError(err instanceof Error ? err : new Error('SignalR connection failed'));
      setConnectionState(signalR.HubConnectionState.Disconnected);
      setIsConnected(false);
    }
  }, [token, isAuthenticated, handleNewNotification, handleNotificationCount]);

  const stopConnection = useCallback(async () => {
    if (connectionRef.current) {
      try {
        await connectionRef.current.stop();
        console.log('🛑 SignalR connection stopped');
      } catch (err) {
        console.error('Error stopping SignalR connection:', err);
      }
      connectionRef.current = null;
      setIsConnected(false);
      setConnectionState(signalR.HubConnectionState.Disconnected);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && token) {
      startConnection();
    } else {
      stopConnection();
    }

    return () => {
      stopConnection();
    };
  }, [isAuthenticated, token, startConnection, stopConnection]);

  return {
    isConnected,
    connectionState,
    error,
  };
};

export default useNotificationHub;
