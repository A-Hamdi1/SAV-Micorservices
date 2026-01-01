using Microsoft.AspNetCore.SignalR;
using SAV.Messaging.Application.Interfaces;
using SAV.Shared.DTOs.Messaging;
using System.Security.Claims;

namespace SAV.Messaging.API.Hubs;

/// <summary>
/// SignalR Hub pour la messagerie temps réel
/// </summary>
public class MessagingHub : Hub
{
    private readonly ILogger<MessagingHub> _logger;

    public MessagingHub(ILogger<MessagingHub> logger)
    {
        _logger = logger;
    }

    public override async Task OnConnectedAsync()
    {
        var userId = GetUserId();
        
        if (!string.IsNullOrEmpty(userId))
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"user_{userId}");
            _logger.LogInformation("User {UserId} connected to messaging hub with connection {ConnectionId}", 
                userId, Context.ConnectionId);
        }
        
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var userId = GetUserId();
        
        if (!string.IsNullOrEmpty(userId))
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"user_{userId}");
            _logger.LogInformation("User {UserId} disconnected from messaging hub", userId);
        }
        
        await base.OnDisconnectedAsync(exception);
    }

    /// <summary>
    /// Rejoindre un groupe de conversation spécifique
    /// </summary>
    public async Task JoinConversation(int conversationId)
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId)) return;

        await Groups.AddToGroupAsync(Context.ConnectionId, $"conversation_{conversationId}");
        _logger.LogInformation("User {UserId} joined conversation {ConversationId}", userId, conversationId);
    }

    /// <summary>
    /// Quitter un groupe de conversation
    /// </summary>
    public async Task LeaveConversation(int conversationId)
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId)) return;

        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"conversation_{conversationId}");
        _logger.LogInformation("User {UserId} left conversation {ConversationId}", userId, conversationId);
    }

    /// <summary>
    /// Notifier que l'utilisateur est en train de taper
    /// </summary>
    public async Task SendTyping(int conversationId, bool isTyping)
    {
        var userId = GetUserId();
        var userName = Context.User?.FindFirst("name")?.Value ?? "Utilisateur";

        if (string.IsNullOrEmpty(userId)) return;

        await Clients.OthersInGroup($"conversation_{conversationId}")
            .SendAsync("UserTyping", new TypingNotificationDto
            {
                ConversationId = conversationId,
                UserId = userId,
                UserName = userName,
                IsTyping = isTyping
            });
    }

    private string? GetUserId()
    {
        return Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value 
               ?? Context.User?.FindFirst("sub")?.Value;
    }
}

/// <summary>
/// Service pour envoyer des messages via le hub SignalR
/// </summary>
public class MessagingHubService : IMessagingHubService
{
    private readonly IHubContext<MessagingHub> _hubContext;
    private readonly ILogger<MessagingHubService> _logger;

    public MessagingHubService(IHubContext<MessagingHub> hubContext, ILogger<MessagingHubService> logger)
    {
        _hubContext = hubContext;
        _logger = logger;
    }

    public async Task SendMessageToUserAsync(string userId, MessageDto message)
    {
        try
        {
            await _hubContext.Clients.Group($"user_{userId}").SendAsync("ReceiveMessage", message);
            _logger.LogInformation("Sent message {MessageId} to user {UserId}", message.Id, userId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send message to user {UserId}", userId);
        }
    }

    public async Task NotifyMessageReadAsync(string userId, int messageId, int conversationId)
    {
        try
        {
            await _hubContext.Clients.Group($"user_{userId}")
                .SendAsync("MessageRead", new { MessageId = messageId, ConversationId = conversationId });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to notify message read to user {UserId}", userId);
        }
    }

    public async Task NotifyNewConversationAsync(string userId, ConversationDto conversation)
    {
        try
        {
            await _hubContext.Clients.Group($"user_{userId}").SendAsync("NewConversation", conversation);
            _logger.LogInformation("Notified user {UserId} of new conversation {ConversationId}", 
                userId, conversation.Id);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to notify new conversation to user {UserId}", userId);
        }
    }

    public async Task NotifyTypingAsync(string userId, int conversationId, string senderName, bool isTyping)
    {
        try
        {
            await _hubContext.Clients.Group($"user_{userId}")
                .SendAsync("UserTyping", new TypingNotificationDto
                {
                    ConversationId = conversationId,
                    UserName = senderName,
                    IsTyping = isTyping
                });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to notify typing to user {UserId}", userId);
        }
    }

    public async Task SendUnreadCountAsync(string userId, int count)
    {
        try
        {
            await _hubContext.Clients.Group($"user_{userId}").SendAsync("UnreadCount", count);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send unread count to user {UserId}", userId);
        }
    }
}
