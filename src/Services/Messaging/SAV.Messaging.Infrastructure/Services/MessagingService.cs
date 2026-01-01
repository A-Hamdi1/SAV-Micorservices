using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using SAV.Messaging.Application.Interfaces;
using SAV.Messaging.Domain.Entities;
using SAV.Messaging.Infrastructure.Data;
using SAV.Shared.DTOs.Messaging;

namespace SAV.Messaging.Infrastructure.Services;

public class MessagingService : IMessagingService
{
    private readonly MessagingDbContext _context;
    private readonly IMessagingHubService _hubService;
    private readonly IAuthApiClient _authApiClient;
    private readonly ILogger<MessagingService> _logger;

    public MessagingService(
        MessagingDbContext context,
        IMessagingHubService hubService,
        IAuthApiClient authApiClient,
        ILogger<MessagingService> logger)
    {
        _context = context;
        _hubService = hubService;
        _authApiClient = authApiClient;
        _logger = logger;
    }

    #region Conversations

    public async Task<List<ConversationDto>> GetUserConversationsAsync(string userId, bool includeArchived = false)
    {
        var query = _context.Conversations
            .Where(c => c.ParticipantUserId == userId || c.ResponsableUserId == userId);

        if (!includeArchived)
        {
            query = query.Where(c => !c.EstArchivee);
        }

        var conversations = await query
            .OrderByDescending(c => c.DernierMessageDate ?? c.DateCreation)
            .ToListAsync();

        var result = new List<ConversationDto>();
        foreach (var conv in conversations)
        {
            var unreadCount = await _context.Messages
                .CountAsync(m => m.ConversationId == conv.Id && !m.EstLu && m.ExpediteurUserId != userId);

            result.Add(MapToDto(conv, unreadCount));
        }

        return result;
    }

    public async Task<ConversationDto?> GetConversationByIdAsync(int id, string userId)
    {
        var conversation = await _context.Conversations
            .FirstOrDefaultAsync(c => c.Id == id && 
                (c.ParticipantUserId == userId || c.ResponsableUserId == userId));

        if (conversation == null) return null;

        var unreadCount = await _context.Messages
            .CountAsync(m => m.ConversationId == id && !m.EstLu && m.ExpediteurUserId != userId);

        return MapToDto(conversation, unreadCount);
    }

    public async Task<ConversationDto?> GetOrCreateConversationAsync(
        string participantUserId, 
        string responsableUserId, 
        string? sujet = null,
        int? reclamationId = null,
        int? interventionId = null)
    {
        // Chercher une conversation existante entre les deux utilisateurs
        var existingConversation = await _context.Conversations
            .FirstOrDefaultAsync(c => 
                c.ParticipantUserId == participantUserId && 
                c.ResponsableUserId == responsableUserId &&
                !c.EstArchivee);

        if (existingConversation != null)
        {
            return MapToDto(existingConversation, 0);
        }

        // Récupérer les informations des utilisateurs
        var participant = await _authApiClient.GetUserByIdAsync(participantUserId);
        var responsable = await _authApiClient.GetUserByIdAsync(responsableUserId);

        if (participant == null || responsable == null)
        {
            _logger.LogWarning("Could not find user info for participant {ParticipantId} or responsable {ResponsableId}",
                participantUserId, responsableUserId);
            return null;
        }

        var dto = new CreateConversationDto
        {
            ParticipantUserId = participantUserId,
            ParticipantNom = participant.Email.Split('@')[0], // Use email prefix as name
            ParticipantRole = participant.Role,
            ResponsableUserId = responsableUserId,
            ResponsableNom = responsable.Email.Split('@')[0], // Use email prefix as name
            Sujet = sujet,
            ReclamationId = reclamationId,
            InterventionId = interventionId
        };

        return await CreateConversationAsync(dto);
    }

    public async Task<ConversationDto> CreateConversationAsync(CreateConversationDto dto)
    {
        if (!Enum.TryParse<ParticipantRole>(dto.ParticipantRole, out var role))
        {
            role = ParticipantRole.Client;
        }

        var conversation = new Conversation
        {
            ParticipantUserId = dto.ParticipantUserId,
            ParticipantNom = dto.ParticipantNom,
            ParticipantRole = role,
            ResponsableUserId = dto.ResponsableUserId,
            ResponsableNom = dto.ResponsableNom,
            Sujet = dto.Sujet,
            ReclamationId = dto.ReclamationId,
            InterventionId = dto.InterventionId,
            DateCreation = DateTime.UtcNow
        };

        _context.Conversations.Add(conversation);
        await _context.SaveChangesAsync();

        var conversationDto = MapToDto(conversation, 0);

        // Notifier le responsable de la nouvelle conversation
        await _hubService.NotifyNewConversationAsync(dto.ResponsableUserId, conversationDto);

        return conversationDto;
    }

    public async Task<bool> ArchiveConversationAsync(int conversationId, string userId)
    {
        var conversation = await _context.Conversations
            .FirstOrDefaultAsync(c => c.Id == conversationId && 
                (c.ParticipantUserId == userId || c.ResponsableUserId == userId));

        if (conversation == null) return false;

        conversation.EstArchivee = true;
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> UnarchiveConversationAsync(int conversationId, string userId)
    {
        var conversation = await _context.Conversations
            .FirstOrDefaultAsync(c => c.Id == conversationId && 
                (c.ParticipantUserId == userId || c.ResponsableUserId == userId));

        if (conversation == null) return false;

        conversation.EstArchivee = false;
        await _context.SaveChangesAsync();
        return true;
    }

    #endregion

    #region Messages

    public async Task<List<MessageDto>> GetConversationMessagesAsync(int conversationId, string userId, int page = 1, int pageSize = 50)
    {
        // Vérifier que l'utilisateur a accès à cette conversation
        var hasAccess = await _context.Conversations
            .AnyAsync(c => c.Id == conversationId && 
                (c.ParticipantUserId == userId || c.ResponsableUserId == userId));

        if (!hasAccess) return new List<MessageDto>();

        var messages = await _context.Messages
            .Where(m => m.ConversationId == conversationId)
            .OrderByDescending(m => m.DateEnvoi)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return messages
            .OrderBy(m => m.DateEnvoi)
            .Select(m => MapToDto(m, userId))
            .ToList();
    }

    public async Task<MessageDto> SendMessageAsync(SendMessageDto dto)
    {
        var conversation = await _context.Conversations
            .FirstOrDefaultAsync(c => c.Id == dto.ConversationId);

        if (conversation == null)
        {
            throw new InvalidOperationException($"Conversation {dto.ConversationId} not found");
        }

        if (!Enum.TryParse<MessageType>(dto.Type, out var messageType))
        {
            messageType = MessageType.Texte;
        }

        var message = new Message
        {
            ConversationId = dto.ConversationId,
            ExpediteurUserId = dto.ExpediteurUserId,
            ExpediteurNom = dto.ExpediteurNom,
            Contenu = dto.Contenu,
            Type = messageType,
            PieceJointeUrl = dto.PieceJointeUrl,
            PieceJointeNom = dto.PieceJointeNom,
            DateEnvoi = DateTime.UtcNow
        };

        _context.Messages.Add(message);

        // Mettre à jour la conversation
        conversation.DernierMessageDate = message.DateEnvoi;
        conversation.DernierMessageApercu = dto.Contenu.Length > 100 
            ? dto.Contenu.Substring(0, 97) + "..." 
            : dto.Contenu;

        await _context.SaveChangesAsync();

        var messageDto = MapToDto(message, dto.ExpediteurUserId);

        // Déterminer le destinataire
        var recipientUserId = conversation.ParticipantUserId == dto.ExpediteurUserId
            ? conversation.ResponsableUserId
            : conversation.ParticipantUserId;

        // Envoyer le message en temps réel
        await _hubService.SendMessageToUserAsync(recipientUserId, messageDto);

        // Mettre à jour le compteur de messages non lus
        var unreadCount = await GetUnreadMessageCountAsync(recipientUserId);
        await _hubService.SendUnreadCountAsync(recipientUserId, unreadCount);

        return messageDto;
    }

    public async Task<bool> MarkMessageAsReadAsync(int messageId, string userId)
    {
        var message = await _context.Messages
            .Include(m => m.Conversation)
            .FirstOrDefaultAsync(m => m.Id == messageId);

        if (message == null) return false;

        // Vérifier que l'utilisateur est bien le destinataire
        if (message.ExpediteurUserId == userId) return false;

        var conversation = message.Conversation;
        if (conversation == null) return false;

        var isParticipant = conversation.ParticipantUserId == userId || conversation.ResponsableUserId == userId;
        if (!isParticipant) return false;

        message.EstLu = true;
        message.DateLecture = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        // Notifier l'expéditeur
        await _hubService.NotifyMessageReadAsync(message.ExpediteurUserId, messageId, message.ConversationId);

        return true;
    }

    public async Task<bool> MarkConversationAsReadAsync(int conversationId, string userId)
    {
        var conversation = await _context.Conversations
            .FirstOrDefaultAsync(c => c.Id == conversationId && 
                (c.ParticipantUserId == userId || c.ResponsableUserId == userId));

        if (conversation == null) return false;

        var unreadMessages = await _context.Messages
            .Where(m => m.ConversationId == conversationId && !m.EstLu && m.ExpediteurUserId != userId)
            .ToListAsync();

        if (!unreadMessages.Any()) return true;

        var now = DateTime.UtcNow;
        foreach (var message in unreadMessages)
        {
            message.EstLu = true;
            message.DateLecture = now;
        }

        await _context.SaveChangesAsync();

        // Notifier les expéditeurs
        var senderIds = unreadMessages.Select(m => m.ExpediteurUserId).Distinct();
        foreach (var senderId in senderIds)
        {
            var messageIds = unreadMessages.Where(m => m.ExpediteurUserId == senderId).Select(m => m.Id);
            foreach (var msgId in messageIds)
            {
                await _hubService.NotifyMessageReadAsync(senderId, msgId, conversationId);
            }
        }

        return true;
    }

    public async Task<int> GetUnreadMessageCountAsync(string userId)
    {
        return await _context.Messages
            .Include(m => m.Conversation)
            .Where(m => !m.EstLu && 
                m.ExpediteurUserId != userId &&
                (m.Conversation!.ParticipantUserId == userId || m.Conversation.ResponsableUserId == userId))
            .CountAsync();
    }

    #endregion

    #region Search

    public async Task<List<ConversationDto>> SearchConversationsAsync(string userId, string searchTerm)
    {
        var searchLower = searchTerm.ToLower();

        var conversations = await _context.Conversations
            .Where(c => (c.ParticipantUserId == userId || c.ResponsableUserId == userId) &&
                (c.ParticipantNom.ToLower().Contains(searchLower) ||
                 c.ResponsableNom.ToLower().Contains(searchLower) ||
                 (c.Sujet != null && c.Sujet.ToLower().Contains(searchLower))))
            .OrderByDescending(c => c.DernierMessageDate ?? c.DateCreation)
            .Take(20)
            .ToListAsync();

        var result = new List<ConversationDto>();
        foreach (var conv in conversations)
        {
            var unreadCount = await _context.Messages
                .CountAsync(m => m.ConversationId == conv.Id && !m.EstLu && m.ExpediteurUserId != userId);
            result.Add(MapToDto(conv, unreadCount));
        }

        return result;
    }

    #endregion

    #region Contacts

    public async Task<List<ContactDto>> GetAvailableContactsAsync(string userId, string userRole)
    {
        var contacts = new List<ContactDto>();

        // Récupérer les conversations existantes de l'utilisateur pour savoir avec qui il a déjà une conversation
        var existingConversations = await _context.Conversations
            .Where(c => c.ParticipantUserId == userId || c.ResponsableUserId == userId)
            .ToListAsync();

        if (userRole == "ResponsableSAV")
        {
            // Le responsable peut contacter tous les clients et techniciens
            var clients = await _authApiClient.GetUsersByRoleAsync("Client");
            var techniciens = await _authApiClient.GetUsersByRoleAsync("Technicien");

            foreach (var client in clients)
            {
                var existingConv = existingConversations.FirstOrDefault(c => c.ParticipantUserId == client.Id);
                contacts.Add(new ContactDto
                {
                    UserId = client.Id,
                    Nom = client.Email.Split('@')[0],
                    Email = client.Email,
                    Role = "Client",
                    ConversationId = existingConv?.Id
                });
            }

            foreach (var tech in techniciens)
            {
                var existingConv = existingConversations.FirstOrDefault(c => c.ParticipantUserId == tech.Id);
                contacts.Add(new ContactDto
                {
                    UserId = tech.Id,
                    Nom = tech.Email.Split('@')[0],
                    Email = tech.Email,
                    Role = "Technicien",
                    ConversationId = existingConv?.Id
                });
            }
        }
        else
        {
            // Les clients et techniciens peuvent contacter les responsables uniquement
            var responsables = await _authApiClient.GetResponsablesAsync();

            foreach (var resp in responsables)
            {
                var existingConv = existingConversations.FirstOrDefault(c => c.ResponsableUserId == resp.Id);
                contacts.Add(new ContactDto
                {
                    UserId = resp.Id,
                    Nom = resp.Email.Split('@')[0],
                    Email = resp.Email,
                    Role = "ResponsableSAV",
                    ConversationId = existingConv?.Id
                });
            }
        }

        return contacts;
    }

    #endregion

    #region Mappers

    private static ConversationDto MapToDto(Conversation conversation, int unreadCount)
    {
        return new ConversationDto
        {
            Id = conversation.Id,
            ParticipantUserId = conversation.ParticipantUserId,
            ParticipantNom = conversation.ParticipantNom,
            ParticipantRole = conversation.ParticipantRole.ToString(),
            ResponsableUserId = conversation.ResponsableUserId,
            ResponsableNom = conversation.ResponsableNom,
            Sujet = conversation.Sujet,
            ReclamationId = conversation.ReclamationId,
            InterventionId = conversation.InterventionId,
            DateCreation = conversation.DateCreation,
            DernierMessageDate = conversation.DernierMessageDate,
            DernierMessageApercu = conversation.DernierMessageApercu,
            EstArchivee = conversation.EstArchivee,
            MessagesNonLus = unreadCount
        };
    }

    private static MessageDto MapToDto(Message message, string currentUserId)
    {
        return new MessageDto
        {
            Id = message.Id,
            ConversationId = message.ConversationId,
            ExpediteurUserId = message.ExpediteurUserId,
            ExpediteurNom = message.ExpediteurNom,
            Contenu = message.Contenu,
            DateEnvoi = message.DateEnvoi,
            EstLu = message.EstLu,
            DateLecture = message.DateLecture,
            Type = message.Type.ToString(),
            PieceJointeUrl = message.PieceJointeUrl,
            PieceJointeNom = message.PieceJointeNom,
            EstMoi = message.ExpediteurUserId == currentUserId
        };
    }

    #endregion
}
