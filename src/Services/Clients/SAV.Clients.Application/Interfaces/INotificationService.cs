using SAV.Shared.DTOs.Notifications;

namespace SAV.Clients.Application.Interfaces;

public interface INotificationService
{
    Task<List<NotificationDto>> GetUserNotificationsAsync(string userId, int page = 1, int pageSize = 20);
    Task<List<NotificationDto>> GetUnreadNotificationsAsync(string userId);
    Task<NotificationCountDto> GetNotificationCountAsync(string userId);
    Task<NotificationDto?> GetNotificationByIdAsync(int id);
    Task<NotificationDto> CreateNotificationAsync(CreateNotificationDto dto);
    Task<bool> MarkAsReadAsync(int id, string userId);
    Task<bool> MarkAllAsReadAsync(string userId);
    Task<bool> DeleteNotificationAsync(int id, string userId);
    Task<bool> DeleteAllReadNotificationsAsync(string userId);
    
    // Méthodes de notification automatique
    Task NotifyReclamationCreatedAsync(int reclamationId, int clientId, string clientUserId);
    Task NotifyReclamationStatusChangedAsync(int reclamationId, string newStatus, string clientUserId);
    Task NotifyInterventionCreatedAsync(int interventionId, int reclamationId, string technicienUserId, string? clientUserId);
    Task NotifyInterventionStatusChangedAsync(int interventionId, string newStatus, string technicienUserId, string? clientUserId);
    Task NotifyEvaluationReceivedAsync(int evaluationId, int interventionId, string technicienUserId);
    Task NotifyRdvStatusChangedAsync(int rdvId, string status, string clientUserId);
    Task NotifyPaymentStatusAsync(int interventionId, bool success, string clientUserId);
}
