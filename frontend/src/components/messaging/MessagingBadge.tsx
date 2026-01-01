import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import { getUnreadCount } from '../../api/messaging';
import { useAuthStore } from '../../store/authStore';
import { Link } from 'react-router-dom';

interface MessagingBadgeProps {
  className?: string;
}

const MessagingBadge: React.FC<MessagingBadgeProps> = ({ className = '' }) => {
  const { isAuthenticated, role } = useAuthStore();

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['unreadMessagesCount'],
    queryFn: getUnreadCount,
    enabled: isAuthenticated,
    refetchInterval: 30000,
  });

  // Déterminer le chemin selon le rôle
  const getMessagesPath = () => {
    switch (role) {
      case 'Client':
        return '/client/messages';
      case 'Technicien':
        return '/technicien/messages';
      case 'ResponsableSAV':
        return '/responsable/messages';
      default:
        return '/client/messages';
    }
  };

  return (
    <Link 
      to={getMessagesPath()} 
      className={`relative p-2 text-gray-600 hover:text-blue-600 transition-colors ${className}`}
      title="Messages"
    >
      <ChatBubbleLeftRightIcon className="h-6 w-6" />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[20px] h-5 px-1 text-xs font-bold text-white bg-blue-600 rounded-full">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </Link>
  );
};

export default MessagingBadge;
