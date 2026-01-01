using SAV.Shared.DTOs.Notifications;

namespace SAV.Notifications.Application.Interfaces;

/// <summary>
/// Interface for sending real-time notifications via SignalR
/// </summary>
public interface INotificationHubService
{
    /// <summary>
    /// Send a notification to a specific user in real-time
    /// </summary>
    Task SendNotificationToUserAsync(string userId, NotificationDto notification);
    
    /// <summary>
    /// Send notification count update to a specific user
    /// </summary>
    Task SendNotificationCountAsync(string userId, NotificationCountDto count);
    
    /// <summary>
    /// Send a notification to multiple users
    /// </summary>
    Task SendNotificationToUsersAsync(IEnumerable<string> userIds, NotificationDto notification);
}
