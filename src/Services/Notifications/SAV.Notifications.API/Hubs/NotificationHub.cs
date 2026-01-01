using Microsoft.AspNetCore.SignalR;
using SAV.Notifications.Application.Interfaces;
using SAV.Shared.DTOs.Notifications;
using System.Security.Claims;

namespace SAV.Notifications.API.Hubs;

/// <summary>
/// SignalR Hub for real-time notifications
/// </summary>
public class NotificationHub : Hub
{
    private readonly ILogger<NotificationHub> _logger;

    public NotificationHub(ILogger<NotificationHub> logger)
    {
        _logger = logger;
    }

    public override async Task OnConnectedAsync()
    {
        var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value 
                     ?? Context.User?.FindFirst("sub")?.Value;
        
        if (!string.IsNullOrEmpty(userId))
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"user_{userId}");
            _logger.LogInformation("User {UserId} connected to notifications hub with connection {ConnectionId}", 
                userId, Context.ConnectionId);
        }
        
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value 
                     ?? Context.User?.FindFirst("sub")?.Value;
        
        if (!string.IsNullOrEmpty(userId))
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"user_{userId}");
            _logger.LogInformation("User {UserId} disconnected from notifications hub", userId);
        }
        
        await base.OnDisconnectedAsync(exception);
    }

    /// <summary>
    /// Client can join their user-specific group
    /// </summary>
    public async Task JoinUserGroup(string userId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"user_{userId}");
        _logger.LogInformation("Connection {ConnectionId} joined group user_{UserId}", 
            Context.ConnectionId, userId);
    }

    /// <summary>
    /// Client can leave their user-specific group
    /// </summary>
    public async Task LeaveUserGroup(string userId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"user_{userId}");
        _logger.LogInformation("Connection {ConnectionId} left group user_{UserId}", 
            Context.ConnectionId, userId);
    }
}

/// <summary>
/// Service to send notifications through SignalR hub
/// </summary>
public class NotificationHubService : INotificationHubService
{
    private readonly IHubContext<NotificationHub> _hubContext;
    private readonly ILogger<NotificationHubService> _logger;

    public NotificationHubService(IHubContext<NotificationHub> hubContext, ILogger<NotificationHubService> logger)
    {
        _hubContext = hubContext;
        _logger = logger;
    }

    public async Task SendNotificationToUserAsync(string userId, NotificationDto notification)
    {
        try
        {
            await _hubContext.Clients.Group($"user_{userId}").SendAsync("ReceiveNotification", notification);
            _logger.LogInformation("Sent notification {NotificationId} to user {UserId}", 
                notification.Id, userId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send notification to user {UserId}", userId);
        }
    }

    public async Task SendNotificationCountAsync(string userId, NotificationCountDto count)
    {
        try
        {
            await _hubContext.Clients.Group($"user_{userId}").SendAsync("ReceiveNotificationCount", count);
            _logger.LogDebug("Sent notification count update to user {UserId}: {Count} unread", 
                userId, count.NonLues);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send notification count to user {UserId}", userId);
        }
    }

    public async Task SendNotificationToUsersAsync(IEnumerable<string> userIds, NotificationDto notification)
    {
        var tasks = userIds.Select(userId => SendNotificationToUserAsync(userId, notification));
        await Task.WhenAll(tasks);
    }
}
