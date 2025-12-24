using SAV.Notifications.Application.Interfaces;
using SAV.Notifications.Domain.Entities;
using SAV.Notifications.Domain.Interfaces;
using Microsoft.Extensions.Logging;

namespace SAV.Notifications.Infrastructure.Services;

public class NotificationService : INotificationService
{
    private readonly INotificationRepository _notificationRepository;
    private readonly INotificationTemplateRepository _templateRepository;
    private readonly IEmailSender _emailSender;
    private readonly ILogger<NotificationService> _logger;

    public NotificationService(
        INotificationRepository notificationRepository,
        INotificationTemplateRepository templateRepository,
        IEmailSender emailSender,
        ILogger<NotificationService> logger)
    {
        _notificationRepository = notificationRepository;
        _templateRepository = templateRepository;
        _emailSender = emailSender;
        _logger = logger;
    }

    public async Task<NotificationDto?> GetByIdAsync(int id)
    {
        var notification = await _notificationRepository.GetByIdAsync(id);
        return notification == null ? null : MapToDto(notification);
    }

    public async Task<IEnumerable<NotificationDto>> GetByClientIdAsync(int clientId)
    {
        var notifications = await _notificationRepository.GetByClientIdAsync(clientId);
        return notifications.Select(MapToDto);
    }

    public async Task<IEnumerable<NotificationDto>> GetAllAsync()
    {
        var notifications = await _notificationRepository.GetAllAsync();
        return notifications.Select(MapToDto);
    }

    public async Task SendReclamationCreatedAsync(SendNotificationDto dto)
    {
        await CreateAndSendNotificationAsync(NotificationType.ReclamationCreee, dto, "Reclamation", dto.ReclamationId);
    }

    public async Task SendReclamationStatusChangedAsync(SendNotificationDto dto)
    {
        await CreateAndSendNotificationAsync(NotificationType.ReclamationStatutChange, dto, "Reclamation", dto.ReclamationId);
    }

    public async Task SendInterventionScheduledAsync(SendNotificationDto dto)
    {
        await CreateAndSendNotificationAsync(NotificationType.InterventionPlanifiee, dto, "Intervention", dto.InterventionId);
    }

    public async Task SendInterventionCompletedAsync(SendNotificationDto dto)
    {
        await CreateAndSendNotificationAsync(NotificationType.InterventionTerminee, dto, "Intervention", dto.InterventionId);
    }

    public async Task SendPaymentReceivedAsync(SendNotificationDto dto)
    {
        await CreateAndSendNotificationAsync(NotificationType.PaiementRecu, dto, "Payment", dto.PaymentId);
    }

    public async Task SendWarrantyExpirationReminderAsync(SendNotificationDto dto)
    {
        await CreateAndSendNotificationAsync(NotificationType.GarantieExpiration, dto, "Article", null);
    }

    public async Task SendPaymentReminderAsync(SendNotificationDto dto)
    {
        await CreateAndSendNotificationAsync(NotificationType.RappelPaiement, dto, "Payment", dto.PaymentId);
    }

    public async Task SendWelcomeEmailAsync(SendNotificationDto dto)
    {
        await CreateAndSendNotificationAsync(NotificationType.Bienvenue, dto, null, null);
    }

    public async Task ProcessPendingNotificationsAsync()
    {
        var pending = await _notificationRepository.GetPendingAsync();
        
        foreach (var notification in pending)
        {
            try
            {
                var success = await _emailSender.SendEmailAsync(
                    notification.Email,
                    notification.Sujet,
                    notification.Corps);

                if (success)
                {
                    notification.Statut = NotificationStatut.Envoyee;
                    notification.SentAt = DateTime.UtcNow;
                }
                else
                {
                    notification.RetryCount++;
                    if (notification.RetryCount >= 3)
                    {
                        notification.Statut = NotificationStatut.Echouee;
                        notification.ErrorMessage = "Nombre maximum de tentatives atteint";
                    }
                }

                await _notificationRepository.UpdateAsync(notification);
            }
            catch (Exception ex)
            {
                notification.RetryCount++;
                notification.ErrorMessage = ex.Message;
                if (notification.RetryCount >= 3)
                {
                    notification.Statut = NotificationStatut.Echouee;
                }
                await _notificationRepository.UpdateAsync(notification);
                _logger.LogError(ex, "Erreur lors de l'envoi de la notification {Id}", notification.Id);
            }
        }
    }

    private async Task CreateAndSendNotificationAsync(NotificationType type, SendNotificationDto dto, string? refType, int? refId)
    {
        var template = await _templateRepository.GetByTypeAsync(type);
        if (template == null)
        {
            _logger.LogWarning("Template non trouvé pour le type {Type}", type);
            return;
        }

        var sujet = ReplaceTokens(template.Sujet, dto);
        var corps = ReplaceTokens(template.CorpsHtml, dto);

        var notification = new Notification
        {
            ClientId = dto.ClientId,
            Email = dto.Email,
            Sujet = sujet,
            Corps = corps,
            Type = type,
            ReferenceType = refType,
            ReferenceId = refId
        };

        await _notificationRepository.CreateAsync(notification);

        // Essayer d'envoyer immédiatement
        try
        {
            var success = await _emailSender.SendEmailAsync(dto.Email, sujet, corps);
            if (success)
            {
                notification.Statut = NotificationStatut.Envoyee;
                notification.SentAt = DateTime.UtcNow;
                await _notificationRepository.UpdateAsync(notification);
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Envoi immédiat échoué, sera retenté plus tard");
        }
    }

    private static string ReplaceTokens(string text, SendNotificationDto dto)
    {
        return text
            .Replace("{{ClientNom}}", dto.ClientNom)
            .Replace("{{ReclamationId}}", dto.ReclamationId?.ToString() ?? "")
            .Replace("{{InterventionId}}", dto.InterventionId?.ToString() ?? "")
            .Replace("{{ArticleNom}}", dto.ArticleNom ?? "")
            .Replace("{{Statut}}", dto.Statut ?? "")
            .Replace("{{DateIntervention}}", dto.DateIntervention?.ToString("dd/MM/yyyy HH:mm") ?? "")
            .Replace("{{Montant}}", dto.Montant?.ToString("F2") ?? "")
            .Replace("{{DateExpiration}}", dto.DateExpiration?.ToString("dd/MM/yyyy") ?? "");
    }

    private static NotificationDto MapToDto(Notification notification) => new()
    {
        Id = notification.Id,
        ClientId = notification.ClientId,
        Email = notification.Email,
        Sujet = notification.Sujet,
        Type = notification.Type.ToString(),
        Statut = notification.Statut.ToString(),
        CreatedAt = notification.CreatedAt,
        SentAt = notification.SentAt
    };
}
