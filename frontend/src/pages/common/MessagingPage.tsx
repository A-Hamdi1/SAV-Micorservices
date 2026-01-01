import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getConversations, 
  getMessages, 
  sendMessage, 
  markConversationAsRead,
  getInterlocutorName,
  formatLastMessageDate,
  getAvailableContacts,
  startOrGetConversation,
  Conversation,
  TypingNotification,
  Contact
} from '../../api/messaging';
import { useAuthStore } from '../../store/authStore';
import { useMessagingHub } from '../../hooks/useMessagingHub';
import { 
  ChatBubbleLeftRightIcon, 
  PaperAirplaneIcon,
  MagnifyingGlassIcon,
  UserCircleIcon,
  CheckIcon,
  CheckCircleIcon,
  ArrowLeftIcon,
  PlusIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';

const MessagingPage: React.FC = () => {
  const { user, role } = useAuthStore();
  const queryClient = useQueryClient();
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [typingUsers, setTypingUsers] = useState<Record<number, string>>({});
  const [showContacts, setShowContacts] = useState(false);
  const [contactSearchTerm, setContactSearchTerm] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // SignalR connection
  const { isConnected, joinConversation, leaveConversation, sendTyping } = useMessagingHub({
    onNewMessage: (message) => {
      // Scroll to bottom if we're viewing this conversation
      if (selectedConversation?.id === message.conversationId) {
        setTimeout(() => scrollToBottom(), 100);
      }
    },
    onTyping: (notification: TypingNotification) => {
      if (notification.isTyping) {
        setTypingUsers(prev => ({
          ...prev,
          [notification.conversationId]: notification.userName
        }));
        // Clear typing indicator after 3 seconds
        setTimeout(() => {
          setTypingUsers(prev => {
            const next = { ...prev };
            delete next[notification.conversationId];
            return next;
          });
        }, 3000);
      } else {
        setTypingUsers(prev => {
          const next = { ...prev };
          delete next[notification.conversationId];
          return next;
        });
      }
    }
  });

  // Fetch conversations
  const { data: conversations = [], isLoading: loadingConversations } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => getConversations(),
    refetchInterval: 30000,
  });

  // Fetch contacts
  const { data: contacts = [], isLoading: loadingContacts } = useQuery({
    queryKey: ['messagingContacts'],
    queryFn: () => getAvailableContacts(),
  });

  // Fetch messages for selected conversation
  const { data: messages = [], isLoading: loadingMessages } = useQuery({
    queryKey: ['messages', selectedConversation?.id],
    queryFn: () => selectedConversation ? getMessages(selectedConversation.id) : Promise.resolve([]),
    enabled: !!selectedConversation,
    refetchInterval: 10000,
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: sendMessage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', selectedConversation?.id] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      setMessageInput('');
      setTimeout(() => scrollToBottom(), 100);
    },
  });

  // Mark conversation as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: markConversationAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });

  // Start conversation mutation
  const startConversationMutation = useMutation({
    mutationFn: (contact: Contact) => startOrGetConversation(contact.userId),
    onSuccess: (conversation) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['messagingContacts'] });
      setSelectedConversation(conversation);
      setShowContacts(false);
      joinConversation(conversation.id);
    },
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Handle conversation selection
  const handleSelectConversation = async (conversation: Conversation) => {
    if (selectedConversation) {
      await leaveConversation(selectedConversation.id);
    }
    setSelectedConversation(conversation);
    setShowContacts(false);
    await joinConversation(conversation.id);
    
    // Mark as read if there are unread messages
    if (conversation.messagesNonLus > 0) {
      markAsReadMutation.mutate(conversation.id);
    }
  };

  // Handle contact click
  const handleContactClick = (contact: Contact) => {
    if (contact.conversationId) {
      // Il y a déjà une conversation, ouvrir celle-ci
      const existingConv = conversations.find(c => c.id === contact.conversationId);
      if (existingConv) {
        handleSelectConversation(existingConv);
      }
    } else {
      // Créer une nouvelle conversation
      startConversationMutation.mutate(contact);
    }
  };

  // Handle send message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !selectedConversation) return;

    sendMessageMutation.mutate({
      conversationId: selectedConversation.id,
      contenu: messageInput.trim(),
    });
  };

  // Handle typing
  const handleTyping = () => {
    if (!selectedConversation) return;
    
    sendTyping(selectedConversation.id, true);
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      sendTyping(selectedConversation.id, false);
    }, 2000);
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Cleanup on unmount
  useEffect(() => {
    const currentConversation = selectedConversation;
    const currentTimeout = typingTimeoutRef.current;
    
    return () => {
      if (currentConversation) {
        leaveConversation(currentConversation.id);
      }
      if (currentTimeout) {
        clearTimeout(currentTimeout);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filter conversations by search term
  const filteredConversations = conversations.filter(conv => {
    const interlocutorName = getInterlocutorName(conv, user?.id || '');
    return interlocutorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
           conv.sujet?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Filter contacts by search term
  const filteredContacts = contacts.filter(contact => 
    contact.nom.toLowerCase().includes(contactSearchTerm.toLowerCase()) ||
    contact.email.toLowerCase().includes(contactSearchTerm.toLowerCase())
  );

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  const getRoleBadgeColor = (contactRole: string) => {
    switch (contactRole) {
      case 'Client':
        return 'bg-green-100 text-green-800';
      case 'Technicien':
        return 'bg-blue-100 text-blue-800';
      case 'ResponsableSAV':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleLabel = (contactRole: string) => {
    switch (contactRole) {
      case 'Client':
        return 'Client';
      case 'Technicien':
        return 'Technicien';
      case 'ResponsableSAV':
        return 'Responsable';
      default:
        return contactRole;
    }
  };

  return (
    <div className="h-[calc(100vh-12rem)] flex bg-white rounded-lg shadow-md overflow-hidden">
      {/* Conversations list / Contacts list */}
      <div className={`w-full md:w-1/3 border-r border-gray-200 flex flex-col ${selectedConversation ? 'hidden md:flex' : 'flex'}`}>
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
              <ChatBubbleLeftRightIcon className="h-6 w-6 text-blue-600" />
              {showContacts ? 'Contacts' : 'Messages'}
              {!isConnected && (
                <span className="text-xs text-red-500 ml-2">(Déconnecté)</span>
              )}
            </h2>
            <button
              onClick={() => setShowContacts(!showContacts)}
              className={`p-2 rounded-lg transition-colors ${showContacts ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100 text-gray-600'}`}
              title={showContacts ? 'Voir les conversations' : 'Voir les contacts'}
            >
              {showContacts ? (
                <ChatBubbleLeftRightIcon className="h-5 w-5" />
              ) : (
                <UserGroupIcon className="h-5 w-5" />
              )}
            </button>
          </div>
          {/* Search */}
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder={showContacts ? "Rechercher un contact..." : "Rechercher..."}
              value={showContacts ? contactSearchTerm : searchTerm}
              onChange={(e) => showContacts ? setContactSearchTerm(e.target.value) : setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {showContacts ? (
            // Contacts list
            loadingContacts ? (
              <div className="flex justify-center items-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : filteredContacts.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <UserGroupIcon className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p>Aucun contact disponible</p>
              </div>
            ) : (
              <>
                <div className="px-4 py-2 bg-gray-50 text-sm text-gray-600 font-medium">
                  {role === 'ResponsableSAV' 
                    ? 'Clients et Techniciens' 
                    : 'Responsables SAV'}
                </div>
                {filteredContacts.map((contact) => (
                  <div
                    key={contact.userId}
                    onClick={() => handleContactClick(contact)}
                    className="p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0">
                        <UserCircleIcon className="h-12 w-12 text-gray-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <h3 className="font-medium text-gray-900 truncate">
                            {contact.nom}
                          </h3>
                          <span className={`text-xs px-2 py-1 rounded-full ${getRoleBadgeColor(contact.role)}`}>
                            {getRoleLabel(contact.role)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 truncate">{contact.email}</p>
                        {contact.conversationId && (
                          <p className="text-xs text-blue-600 mt-1">Conversation existante</p>
                        )}
                      </div>
                      {!contact.conversationId && (
                        <PlusIcon className="h-5 w-5 text-blue-600" />
                      )}
                    </div>
                  </div>
                ))}
              </>
            )
          ) : (
            // Conversations list
            loadingConversations ? (
              <div className="flex justify-center items-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <ChatBubbleLeftRightIcon className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p>Aucune conversation</p>
                <button
                  onClick={() => setShowContacts(true)}
                  className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  <PlusIcon className="h-4 w-4 inline mr-1" />
                  Nouvelle conversation
                </button>
              </div>
            ) : (
              filteredConversations.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => handleSelectConversation(conv)}
                  className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                    selectedConversation?.id === conv.id ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      <UserCircleIcon className="h-12 w-12 text-gray-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <h3 className="font-medium text-gray-900 truncate">
                          {getInterlocutorName(conv, user?.id || '')}
                        </h3>
                        <span className="text-xs text-gray-500 flex-shrink-0">
                          {formatLastMessageDate(conv.dernierMessageDate)}
                        </span>
                      </div>
                      {conv.sujet && (
                        <p className="text-sm text-blue-600 truncate">{conv.sujet}</p>
                      )}
                      <p className="text-sm text-gray-500 truncate">
                        {typingUsers[conv.id] ? (
                          <span className="text-blue-500 italic">
                            {typingUsers[conv.id]} est en train d'écrire...
                          </span>
                        ) : (
                          conv.dernierMessageApercu || 'Aucun message'
                        )}
                      </p>
                    </div>
                    {conv.messagesNonLus > 0 && (
                      <span className="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                        {conv.messagesNonLus}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )
          )}
        </div>
      </div>

      {/* Messages area */}
      <div className={`flex-1 flex flex-col ${selectedConversation ? 'flex' : 'hidden md:flex'}`}>
        {selectedConversation ? (
          <>
            {/* Conversation header */}
            <div className="p-4 border-b border-gray-200 flex items-center gap-3">
              <button
                onClick={() => setSelectedConversation(null)}
                className="md:hidden p-2 hover:bg-gray-100 rounded-lg"
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </button>
              <UserCircleIcon className="h-10 w-10 text-gray-400" />
              <div>
                <h3 className="font-medium text-gray-900">
                  {getInterlocutorName(selectedConversation, user?.id || '')}
                </h3>
                <p className="text-sm text-gray-500">
                  {selectedConversation.sujet || selectedConversation.participantRole}
                </p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {loadingMessages ? (
                <div className="flex justify-center items-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <p>Aucun message. Commencez la conversation !</p>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.estMoi ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.estMoi
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-gray-900 border border-gray-200'
                      }`}
                    >
                      {!message.estMoi && (
                        <p className="text-xs font-medium text-blue-600 mb-1">
                          {message.expediteurNom}
                        </p>
                      )}
                      <p className="text-sm whitespace-pre-wrap">{message.contenu}</p>
                      <div className={`flex items-center justify-end gap-1 mt-1 ${
                        message.estMoi ? 'text-blue-200' : 'text-gray-400'
                      }`}>
                        <span className="text-xs">{formatMessageTime(message.dateEnvoi)}</span>
                        {message.estMoi && (
                          message.estLu ? (
                            <CheckCircleIcon className="h-4 w-4" />
                          ) : (
                            <CheckIcon className="h-4 w-4" />
                          )
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
              {typingUsers[selectedConversation.id] && (
                <div className="flex justify-start">
                  <div className="bg-gray-200 px-4 py-2 rounded-lg">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message input */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 bg-white">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => {
                    setMessageInput(e.target.value);
                    handleTyping();
                  }}
                  placeholder="Écrivez votre message..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  disabled={!messageInput.trim() || sendMessageMutation.isPending}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <PaperAirplaneIcon className="h-5 w-5" />
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <ChatBubbleLeftRightIcon className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg">Sélectionnez une conversation</p>
              <p className="text-sm mb-4">ou démarrez une nouvelle discussion</p>
              <button
                onClick={() => setShowContacts(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <PlusIcon className="h-5 w-5 inline mr-2" />
                Nouvelle conversation
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessagingPage;
