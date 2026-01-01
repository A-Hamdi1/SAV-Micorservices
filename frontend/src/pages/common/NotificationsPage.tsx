import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  deleteAllReadNotifications,
  getNotificationIcon,
  getNotificationColor,
  Notification
} from '../../api/notifications';
import PageHeader from '../../components/common/PageHeader';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import EmptyState from '../../components/common/EmptyState';
import Button from '../../components/common/Button';
import Pagination from '../../components/common/Pagination';

const NotificationsPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const pageSize = 15;

  const { data: notifications, isLoading, error } = useQuery({
    queryKey: ['notifications', currentPage, pageSize],
    queryFn: () => getNotifications(currentPage, pageSize),
  });

  const markAsReadMutation = useMutation({
    mutationFn: markNotificationAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notificationCount'] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: markAllNotificationsAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notificationCount'] });
    },
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: deleteNotification,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notificationCount'] });
    },
  });

  const deleteAllReadMutation = useMutation({
    mutationFn: deleteAllReadNotifications,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notificationCount'] });
    },
  });

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.estLue) {
      markAsReadMutation.mutate(notification.id);
    }
    if (notification.lienAction) {
      navigate(notification.lienAction);
    }
  };

  const filteredNotifications = notifications?.filter(n => {
    if (filter === 'unread') return !n.estLue;
    if (filter === 'read') return n.estLue;
    return true;
  }) || [];

  const unreadCount = notifications?.filter(n => !n.estLue).length || 0;
  const readCount = notifications?.filter(n => n.estLue).length || 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return <ErrorMessage message="Impossible de charger les notifications" />;
  }

  const getColorClasses = (color: string) => {
    const colorMap: Record<string, string> = {
      blue: 'bg-blue-100 text-blue-800 border-blue-200',
      green: 'bg-green-100 text-green-800 border-green-200',
      red: 'bg-red-100 text-red-800 border-red-200',
      yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      orange: 'bg-orange-100 text-orange-800 border-orange-200',
      indigo: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      purple: 'bg-purple-100 text-purple-800 border-purple-200',
      gray: 'bg-gray-100 text-gray-800 border-gray-200',
    };
    return colorMap[color] || colorMap.gray;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        subtitle="Gérez toutes vos notifications"
      />

      {/* Actions et filtres */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Filtres */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Toutes ({notifications?.length || 0})
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'unread'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Non lues ({unreadCount})
            </button>
            <button
              onClick={() => setFilter('read')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'read'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Lues ({readCount})
            </button>
          </div>

          {/* Actions groupées */}
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => markAllAsReadMutation.mutate()}
                disabled={markAllAsReadMutation.isPending}
              >
                {markAllAsReadMutation.isPending ? 'Traitement...' : 'Tout marquer comme lu'}
              </Button>
            )}
            {readCount > 0 && (
              <Button
                variant="danger"
                size="sm"
                onClick={() => {
                  if (window.confirm('Supprimer toutes les notifications lues ?')) {
                    deleteAllReadMutation.mutate();
                  }
                }}
                disabled={deleteAllReadMutation.isPending}
              >
                {deleteAllReadMutation.isPending ? 'Suppression...' : 'Supprimer les lues'}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Liste des notifications */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {filteredNotifications.length === 0 ? (
          <EmptyState
            title="Aucune notification"
            description={
              filter === 'unread'
                ? "Vous n'avez aucune notification non lue"
                : filter === 'read'
                ? "Vous n'avez aucune notification lue"
                : "Vous n'avez aucune notification"
            }
            icon="🔔"
          />
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredNotifications.map((notification) => {
              const color = getNotificationColor(notification.type);
              const icon = getNotificationIcon(notification.type);
              
              return (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                    !notification.estLue ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start gap-4">
                    {/* Icône */}
                    <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-xl ${getColorClasses(color)}`}>
                      {icon}
                    </div>

                    {/* Contenu */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className={`text-sm font-medium ${!notification.estLue ? 'text-gray-900' : 'text-gray-600'}`}>
                            {notification.titre}
                          </h3>
                          <p className={`text-sm mt-1 ${!notification.estLue ? 'text-gray-700' : 'text-gray-500'}`}>
                            {notification.message}
                          </p>
                        </div>
                        
                        {/* Actions */}
                        <div className="flex items-center gap-2">
                          {!notification.estLue && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              Nouveau
                            </span>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (window.confirm('Supprimer cette notification ?')) {
                                deleteNotificationMutation.mutate(notification.id);
                              }
                            }}
                            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                            title="Supprimer"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      
                      {/* Métadonnées */}
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                        <span>
                          {formatDistanceToNow(new Date(notification.dateCreation), { addSuffix: true, locale: fr })}
                        </span>
                        <span className={`px-2 py-0.5 rounded ${getColorClasses(color)}`}>
                          {notification.type.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                        {notification.lienAction && (
                          <span className="text-blue-500 hover:text-blue-700">
                            Voir détails →
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination */}
      {notifications && notifications.length >= pageSize && (
        <div className="flex justify-center">
          <Pagination
            currentPage={currentPage}
            totalPages={Math.ceil((notifications?.length || 0) / pageSize) + 1}
            onPageChange={setCurrentPage}
          />
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
