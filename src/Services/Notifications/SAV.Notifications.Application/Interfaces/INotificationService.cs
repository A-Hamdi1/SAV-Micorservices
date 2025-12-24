using SAV.Notifications.Domain.Entities;

namespace SAV.Notifications.Application.Interfaces;

public interface INotificationService
{
    Task<NotificationDto?> GetByIdAsync(int id);
    Task<IEnumerable<NotificationDto>> GetByClientIdAsync(int clientId);
    Task<IEnumerable<NotificationDto>> GetAllAsync();
    Task SendReclamationCreatedAsync(SendNotificationDto dto);
    Task SendReclamationStatusChangedAsync(SendNotificationDto dto);
    Task SendInterventionScheduledAsync(SendNotificationDto dto);
    Task SendInterventionCompletedAsync(SendNotificationDto dto);
    Task SendPaymentReceivedAsync(SendNotificationDto dto);
    Task SendWarrantyExpirationReminderAsync(SendNotificationDto dto);
    Task SendPaymentReminderAsync(SendNotificationDto dto);
    Task SendWelcomeEmailAsync(SendNotificationDto dto);
    Task ProcessPendingNotificationsAsync();
}

public interface IEmailSender
{
    Task<bool> SendEmailAsync(string to, string subject, string htmlBody);
}

public class NotificationDto
{
    public int Id { get; set; }
    public int? ClientId { get; set; }
    public string Email { get; set; } = string.Empty;
    public string Sujet { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public string Statut { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime? SentAt { get; set; }
}

public class SendNotificationDto
{
    public int? ClientId { get; set; }
    public string Email { get; set; } = string.Empty;
    public string ClientNom { get; set; } = string.Empty;
    public int? ReclamationId { get; set; }
    public int? InterventionId { get; set; }
    public int? PaymentId { get; set; }
    public string? ArticleNom { get; set; }
    public string? Statut { get; set; }
    public DateTime? DateIntervention { get; set; }
    public decimal? Montant { get; set; }
    public DateTime? DateExpiration { get; set; }
}
