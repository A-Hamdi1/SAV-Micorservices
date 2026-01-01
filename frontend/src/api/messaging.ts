import axiosInstance from './axios';

// Types
export interface Conversation {
  id: number;
  participantUserId: string;
  participantNom: string;
  participantRole: string;
  responsableUserId: string;
  responsableNom: string;
  sujet?: string;
  reclamationId?: number;
  interventionId?: number;
  dateCreation: string;
  dernierMessageDate?: string;
  dernierMessageApercu?: string;
  estArchivee: boolean;
  messagesNonLus: number;
}

export interface Message {
  id: number;
  conversationId: number;
  expediteurUserId: string;
  expediteurNom: string;
  contenu: string;
  dateEnvoi: string;
  estLu: boolean;
  dateLecture?: string;
  type: string;
  pieceJointeUrl?: string;
  pieceJointeNom?: string;
  estMoi: boolean;
}

export interface SendMessageDto {
  conversationId: number;
  contenu: string;
  type?: string;
  pieceJointeUrl?: string;
  pieceJointeNom?: string;
}

export interface StartConversationDto {
  sujet?: string;
  messageInitial?: string;
  reclamationId?: number;
  interventionId?: number;
}

export interface CreateConversationDto {
  participantUserId: string;
  participantNom: string;
  participantRole: string;
  sujet?: string;
  reclamationId?: number;
  interventionId?: number;
}

export interface TypingNotification {
  conversationId: number;
  userId: string;
  userName: string;
  isTyping: boolean;
}

export interface Contact {
  userId: string;
  nom: string;
  email: string;
  role: string;
  conversationId?: number;
}

// API Functions

/**
 * Récupérer toutes les conversations de l'utilisateur
 */
export const getConversations = async (includeArchived = false): Promise<Conversation[]> => {
  const response = await axiosInstance.get(`/api/conversations?includeArchived=${includeArchived}`);
  return response.data.data;
};

/**
 * Récupérer une conversation par ID
 */
export const getConversationById = async (id: number): Promise<Conversation> => {
  const response = await axiosInstance.get(`/api/conversations/${id}`);
  return response.data.data;
};

/**
 * Démarrer une nouvelle conversation avec un responsable
 */
export const startConversation = async (
  dto: StartConversationDto,
  responsableUserId?: string
): Promise<Conversation> => {
  const url = responsableUserId
    ? `/api/conversations/start?responsableUserId=${responsableUserId}`
    : '/api/conversations/start';
  const response = await axiosInstance.post(url, dto);
  return response.data.data;
};

/**
 * Créer une conversation (pour les responsables)
 */
export const createConversation = async (dto: CreateConversationDto): Promise<Conversation> => {
  const response = await axiosInstance.post('/api/conversations', dto);
  return response.data.data;
};

/**
 * Archiver une conversation
 */
export const archiveConversation = async (id: number): Promise<boolean> => {
  const response = await axiosInstance.put(`/api/conversations/${id}/archive`);
  return response.data.data;
};

/**
 * Désarchiver une conversation
 */
export const unarchiveConversation = async (id: number): Promise<boolean> => {
  const response = await axiosInstance.put(`/api/conversations/${id}/unarchive`);
  return response.data.data;
};

/**
 * Rechercher dans les conversations
 */
export const searchConversations = async (query: string): Promise<Conversation[]> => {
  const response = await axiosInstance.get(`/api/conversations/search?q=${encodeURIComponent(query)}`);
  return response.data.data;
};

/**
 * Récupérer les messages d'une conversation
 */
export const getMessages = async (
  conversationId: number,
  page = 1,
  pageSize = 50
): Promise<Message[]> => {
  const response = await axiosInstance.get(
    `/api/messages/conversation/${conversationId}?page=${page}&pageSize=${pageSize}`
  );
  return response.data.data;
};

/**
 * Envoyer un message
 */
export const sendMessage = async (dto: SendMessageDto): Promise<Message> => {
  const response = await axiosInstance.post('/api/messages', dto);
  return response.data.data;
};

/**
 * Marquer un message comme lu
 */
export const markMessageAsRead = async (id: number): Promise<boolean> => {
  const response = await axiosInstance.put(`/api/messages/${id}/read`);
  return response.data.data;
};

/**
 * Marquer tous les messages d'une conversation comme lus
 */
export const markConversationAsRead = async (conversationId: number): Promise<boolean> => {
  const response = await axiosInstance.put(`/api/messages/conversation/${conversationId}/read`);
  return response.data.data;
};

/**
 * Récupérer le nombre de messages non lus
 */
export const getUnreadCount = async (): Promise<number> => {
  const response = await axiosInstance.get('/api/messages/unread/count');
  return response.data.data;
};

/**
 * Récupérer les contacts disponibles pour démarrer une conversation
 */
export const getAvailableContacts = async (): Promise<Contact[]> => {
  const response = await axiosInstance.get('/api/conversations/contacts');
  return response.data.data;
};

/**
 * Démarrer ou récupérer une conversation avec un contact
 */
export const startOrGetConversation = async (contactUserId: string, sujet?: string): Promise<Conversation> => {
  const url = sujet 
    ? `/api/conversations/start-with/${contactUserId}?sujet=${encodeURIComponent(sujet)}`
    : `/api/conversations/start-with/${contactUserId}`;
  const response = await axiosInstance.post(url);
  return response.data.data;
};

// Helper pour obtenir le nom de l'interlocuteur
export const getInterlocutorName = (conversation: Conversation, currentUserId: string): string => {
  if (conversation.participantUserId === currentUserId) {
    return conversation.responsableNom;
  }
  return conversation.participantNom;
};

// Helper pour formater la date du dernier message
export const formatLastMessageDate = (dateString?: string): string => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  } else if (diffDays === 1) {
    return 'Hier';
  } else if (diffDays < 7) {
    return date.toLocaleDateString('fr-FR', { weekday: 'long' });
  } else {
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' });
  }
};
