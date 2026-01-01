import { useEffect, useRef, useCallback, useState } from 'react';
import * as signalR from '@microsoft/signalr';
import { useAuthStore } from '../store/authStore';
import { Message, Conversation, TypingNotification } from '../api/messaging';
import { useQueryClient } from '@tanstack/react-query';

// SignalR Hub URL - connect directly to the Messaging service
const SIGNALR_HUB_URL = 'https://localhost:5007/hubs/messaging';

export interface UseMessagingHubResult {
  isConnected: boolean;
  connectionState: signalR.HubConnectionState;
  error: Error | null;
  joinConversation: (conversationId: number) => Promise<void>;
  leaveConversation: (conversationId: number) => Promise<void>;
  sendTyping: (conversationId: number, isTyping: boolean) => Promise<void>;
}

export interface UseMessagingHubOptions {
  onNewMessage?: (message: Message) => void;
  onMessageRead?: (data: { messageId: number; conversationId: number }) => void;
  onNewConversation?: (conversation: Conversation) => void;
  onTyping?: (notification: TypingNotification) => void;
  onUnreadCount?: (count: number) => void;
}

export const useMessagingHub = (options: UseMessagingHubOptions = {}): UseMessagingHubResult => {
  const { token, isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();
  const connectionRef = useRef<signalR.HubConnection | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionState, setConnectionState] = useState<signalR.HubConnectionState>(
    signalR.HubConnectionState.Disconnected
  );
  const [error, setError] = useState<Error | null>(null);

  const handleNewMessage = useCallback(
    (message: Message) => {
      console.log('💬 New message received:', message);
      
      // Invalidate queries to refresh message data
      queryClient.invalidateQueries({ queryKey: ['messages', message.conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['unreadMessagesCount'] });

      // Call custom handler if provided
      options.onNewMessage?.(message);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [queryClient]
  );

  const handleMessageRead = useCallback(
    (data: { messageId: number; conversationId: number }) => {
      console.log('✓ Message read:', data);
      
      // Update the cache to mark message as read
      queryClient.invalidateQueries({ queryKey: ['messages', data.conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['unreadMessagesCount'] });

      options.onMessageRead?.(data);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [queryClient]
  );

  const handleNewConversation = useCallback(
    (conversation: Conversation) => {
      console.log('🆕 New conversation:', conversation);
      
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      
      options.onNewConversation?.(conversation);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [queryClient]
  );

  const handleTyping = useCallback(
    (notification: TypingNotification) => {
      console.log('⌨️ Typing notification:', notification);
      options.onTyping?.(notification);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const handleUnreadCount = useCallback(
    (count: number) => {
      console.log('📊 Unread count:', count);
      queryClient.setQueryData(['unreadMessagesCount'], count);
      options.onUnreadCount?.(count);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [queryClient]
  );

  const startConnection = useCallback(async () => {
    if (!token || !isAuthenticated) {
      console.log('🔒 Not authenticated, skipping SignalR messaging connection');
      return;
    }

    if (connectionRef.current?.state === signalR.HubConnectionState.Connected ||
        connectionRef.current?.state === signalR.HubConnectionState.Connecting) {
      return;
    }

    try {
      const connection = new signalR.HubConnectionBuilder()
        .withUrl(`${SIGNALR_HUB_URL}?access_token=${token}`)
        .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
        .configureLogging(signalR.LogLevel.Information)
        .build();

      // Set up event handlers
      connection.on('ReceiveMessage', handleNewMessage);
      connection.on('MessageRead', handleMessageRead);
      connection.on('NewConversation', handleNewConversation);
      connection.on('UserTyping', handleTyping);
      connection.on('UnreadCount', handleUnreadCount);

      connection.onreconnecting((error) => {
        console.log('🔄 Messaging hub reconnecting...', error);
        setConnectionState(signalR.HubConnectionState.Reconnecting);
        setIsConnected(false);
      });

      connection.onreconnected((connectionId) => {
        console.log('✅ Messaging hub reconnected with id:', connectionId);
        setConnectionState(signalR.HubConnectionState.Connected);
        setIsConnected(true);
        setError(null);
      });

      connection.onclose((error) => {
        console.log('❌ Messaging hub connection closed', error);
        setConnectionState(signalR.HubConnectionState.Disconnected);
        setIsConnected(false);
        if (error) {
          setError(error);
        }
      });

      await connection.start();
      connectionRef.current = connection;
      setIsConnected(true);
      setConnectionState(signalR.HubConnectionState.Connected);
      setError(null);
      console.log('✅ Connected to messaging hub');
    } catch (err) {
      console.error('❌ Failed to connect to messaging hub:', err);
      setError(err instanceof Error ? err : new Error('Failed to connect'));
      setIsConnected(false);
      setConnectionState(signalR.HubConnectionState.Disconnected);
    }
  }, [token, isAuthenticated, handleNewMessage, handleMessageRead, handleNewConversation, handleTyping, handleUnreadCount]);

  const stopConnection = useCallback(async () => {
    if (connectionRef.current) {
      try {
        await connectionRef.current.stop();
        console.log('🔌 Disconnected from messaging hub');
      } catch (err) {
        console.error('Error stopping messaging hub connection:', err);
      }
      connectionRef.current = null;
      setIsConnected(false);
      setConnectionState(signalR.HubConnectionState.Disconnected);
    }
  }, []);

  const joinConversation = useCallback(async (conversationId: number) => {
    if (connectionRef.current?.state === signalR.HubConnectionState.Connected) {
      try {
        await connectionRef.current.invoke('JoinConversation', conversationId);
        console.log(`📥 Joined conversation ${conversationId}`);
      } catch (err) {
        console.error('Error joining conversation:', err);
      }
    }
  }, []);

  const leaveConversation = useCallback(async (conversationId: number) => {
    if (connectionRef.current?.state === signalR.HubConnectionState.Connected) {
      try {
        await connectionRef.current.invoke('LeaveConversation', conversationId);
        console.log(`📤 Left conversation ${conversationId}`);
      } catch (err) {
        console.error('Error leaving conversation:', err);
      }
    }
  }, []);

  const sendTyping = useCallback(async (conversationId: number, isTyping: boolean) => {
    if (connectionRef.current?.state === signalR.HubConnectionState.Connected) {
      try {
        await connectionRef.current.invoke('SendTyping', conversationId, isTyping);
      } catch (err) {
        console.error('Error sending typing notification:', err);
      }
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
    joinConversation,
    leaveConversation,
    sendTyping,
  };
};
