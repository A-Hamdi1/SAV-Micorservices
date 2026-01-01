using SAV.Shared.DTOs.Messaging;

namespace SAV.Messaging.Application.Interfaces;

/// <summary>
/// Interface pour le service de messagerie
/// </summary>
public interface IMessagingService
{
    // Gestion des conversations
    Task<List<ConversationDto>> GetUserConversationsAsync(string userId, bool includeArchived = false);
    Task<ConversationDto?> GetConversationByIdAsync(int id, string userId);
    Task<ConversationDto?> GetOrCreateConversationAsync(string participantUserId, string responsableUserId, string? sujet = null, int? reclamationId = null, int? interventionId = null);
    Task<ConversationDto> CreateConversationAsync(CreateConversationDto dto);
    Task<bool> ArchiveConversationAsync(int conversationId, string userId);
    Task<bool> UnarchiveConversationAsync(int conversationId, string userId);
    
    // Gestion des messages
    Task<List<MessageDto>> GetConversationMessagesAsync(int conversationId, string userId, int page = 1, int pageSize = 50);
    Task<MessageDto> SendMessageAsync(SendMessageDto dto);
    Task<bool> MarkMessageAsReadAsync(int messageId, string userId);
    Task<bool> MarkConversationAsReadAsync(int conversationId, string userId);
    Task<int> GetUnreadMessageCountAsync(string userId);
    
    // Recherche
    Task<List<ConversationDto>> SearchConversationsAsync(string userId, string searchTerm);
    
    // Contacts
    Task<List<ContactDto>> GetAvailableContactsAsync(string userId, string userRole);
}
