using SAV.Notifications.Domain.Entities;

namespace SAV.Notifications.Domain.Interfaces;

public interface INotificationRepository
{
    Task<Notification?> GetByIdAsync(int id);
    Task<IEnumerable<Notification>> GetByClientIdAsync(int clientId);
    Task<IEnumerable<Notification>> GetPendingAsync();
    Task<IEnumerable<Notification>> GetAllAsync();
    Task<Notification> CreateAsync(Notification notification);
    Task UpdateAsync(Notification notification);
    Task DeleteAsync(int id);
}

public interface INotificationTemplateRepository
{
    Task<NotificationTemplate?> GetByTypeAsync(NotificationType type);
    Task<IEnumerable<NotificationTemplate>> GetAllAsync();
    Task<NotificationTemplate> CreateAsync(NotificationTemplate template);
    Task UpdateAsync(NotificationTemplate template);
}
