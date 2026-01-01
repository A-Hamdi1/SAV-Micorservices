import axiosInstance from './axios';

export interface Notification {
  id: number;
  userId: string;
  titre: string;
  message: string;
  type: string;
  estLue: boolean;
  lienAction?: string;
  referenceId?: number;
  dateCreation: string;
  dateLecture?: string;
}

export interface NotificationCount {
  total: number;
  nonLues: number;
}

export interface CreateNotificationDto {
  userId: string;
  titre: string;
  message: string;
  type: string;
  lienAction?: string;
  referenceId?: number;
}

// Récupérer toutes les notifications (avec pagination)
export const getNotifications = async (page = 1, pageSize = 20): Promise<Notification[]> => {
  const response = await axiosInstance.get(`/api/notifications?page=${page}&pageSize=${pageSize}`);
  return response.data.data;
};

// Récupérer les notifications non lues
export const getUnreadNotifications = async (): Promise<Notification[]> => {
  const response = await axiosInstance.get('/api/notifications/unread');
  return response.data.data;
};

// Récupérer le compteur de notifications
export const getNotificationCount = async (): Promise<NotificationCount> => {
  const response = await axiosInstance.get('/api/notifications/count');
  return response.data.data;
};

// Récupérer une notification par ID
export const getNotificationById = async (id: number): Promise<Notification> => {
  const response = await axiosInstance.get(`/api/notifications/${id}`);
  return response.data.data;
};

// Marquer une notification comme lue
export const markNotificationAsRead = async (id: number): Promise<boolean> => {
  const response = await axiosInstance.put(`/api/notifications/${id}/read`);
  return response.data.data;
};

// Marquer toutes les notifications comme lues
export const markAllNotificationsAsRead = async (): Promise<boolean> => {
  const response = await axiosInstance.put('/api/notifications/read-all');
  return response.data.data;
};

// Supprimer une notification
export const deleteNotification = async (id: number): Promise<boolean> => {
  const response = await axiosInstance.delete(`/api/notifications/${id}`);
  return response.data.data;
};

// Supprimer toutes les notifications lues
export const deleteAllReadNotifications = async (): Promise<boolean> => {
  const response = await axiosInstance.delete('/api/notifications/read');
  return response.data.data;
};

// Créer une notification (pour les responsables/techniciens)
export const createNotification = async (data: CreateNotificationDto): Promise<Notification> => {
  const response = await axiosInstance.post('/api/notifications', data);
  return response.data.data;
};

// Helper pour obtenir l'icône selon le type de notification
export const getNotificationIcon = (type: string): string => {
  const icons: Record<string, string> = {
    ReclamationCreee: '📝',
    ReclamationMiseAJour: '🔄',
    ReclamationResolue: '✅',
    ReclamationRejetee: '❌',
    InterventionPlanifiee: '📅',
    InterventionEnCours: '🔧',
    InterventionTerminee: '✔️',
    InterventionAnnulee: '🚫',
    NouvelleEvaluation: '⭐',
    RdvPlanifie: '📆',
    RdvConfirme: '✅',
    RdvAnnule: '❌',
    PaiementRecu: '💰',
    PaiementEchoue: '💸',
    Systeme: '🔔',
  };
  return icons[type] || '🔔';
};

// Helper pour obtenir la couleur selon le type de notification
export const getNotificationColor = (type: string): string => {
  const colors: Record<string, string> = {
    ReclamationCreee: 'blue',
    ReclamationMiseAJour: 'yellow',
    ReclamationResolue: 'green',
    ReclamationRejetee: 'red',
    InterventionPlanifiee: 'indigo',
    InterventionEnCours: 'orange',
    InterventionTerminee: 'green',
    InterventionAnnulee: 'red',
    NouvelleEvaluation: 'purple',
    RdvPlanifie: 'blue',
    RdvConfirme: 'green',
    RdvAnnule: 'red',
    PaiementRecu: 'green',
    PaiementEchoue: 'red',
    Systeme: 'gray',
  };
  return colors[type] || 'gray';
};
