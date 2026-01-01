using SAV.Shared.DTOs.Messaging;

namespace SAV.Messaging.Application.Interfaces;

/// <summary>
/// Interface pour le hub SignalR de messagerie
/// </summary>
public interface IMessagingHubService
{
    /// <summary>
    /// Envoyer un message à un utilisateur spécifique
    /// </summary>
    Task SendMessageToUserAsync(string userId, MessageDto message);
    
    /// <summary>
    /// Notifier qu'un message a été lu
    /// </summary>
    Task NotifyMessageReadAsync(string userId, int messageId, int conversationId);
    
    /// <summary>
    /// Notifier une nouvelle conversation
    /// </summary>
    Task NotifyNewConversationAsync(string userId, ConversationDto conversation);
    
    /// <summary>
    /// Notifier le statut de frappe (typing)
    /// </summary>
    Task NotifyTypingAsync(string userId, int conversationId, string senderName, bool isTyping);
    
    /// <summary>
    /// Envoyer le compteur de messages non lus
    /// </summary>
    Task SendUnreadCountAsync(string userId, int count);
}
