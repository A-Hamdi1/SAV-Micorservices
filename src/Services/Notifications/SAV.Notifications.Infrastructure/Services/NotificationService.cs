using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using SAV.Notifications.Application.Interfaces;
using SAV.Notifications.Domain.Entities;
using SAV.Notifications.Infrastructure.Data;
using SAV.Shared.DTOs.Notifications;

namespace SAV.Notifications.Infrastructure.Services;

public class NotificationService : INotificationService
{
    private readonly NotificationsDbContext _context;
    private readonly IAuthApiClient _authApiClient;
    private readonly INotificationHubService _hubService;
    private readonly ILogger<NotificationService> _logger;

    public NotificationService(
        NotificationsDbContext context, 
        IAuthApiClient authApiClient,
        INotificationHubService hubService,
        ILogger<NotificationService> logger)
    {
        _context = context;
        _authApiClient = authApiClient;
        _hubService = hubService;
        _logger = logger;
    }

    public async Task<List<NotificationDto>> GetUserNotificationsAsync(string userId, int page = 1, int pageSize = 20)
    {
        return await _context.Notifications
            .Where(n => n.UserId == userId)
            .OrderByDescending(n => n.DateCreation)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(n => MapToDto(n))
            .ToListAsync();
    }

    public async Task<List<NotificationDto>> GetUnreadNotificationsAsync(string userId)
    {
        return await _context.Notifications
            .Where(n => n.UserId == userId && !n.EstLue)
            .OrderByDescending(n => n.DateCreation)
            .Take(50)
            .Select(n => MapToDto(n))
            .ToListAsync();
    }

    public async Task<NotificationCountDto> GetNotificationCountAsync(string userId)
    {
        var total = await _context.Notifications.CountAsync(n => n.UserId == userId);
        var nonLues = await _context.Notifications.CountAsync(n => n.UserId == userId && !n.EstLue);

        return new NotificationCountDto
        {
            Total = total,
            NonLues = nonLues
        };
    }

    public async Task<NotificationDto?> GetNotificationByIdAsync(int id)
    {
        var notification = await _context.Notifications.FindAsync(id);
        return notification != null ? MapToDto(notification) : null;
    }

    public async Task<NotificationDto> CreateNotificationAsync(CreateNotificationDto dto)
    {
        if (!Enum.TryParse<NotificationType>(dto.Type, out var type))
        {
            type = NotificationType.Systeme;
        }

        var notification = new Notification
        {
            UserId = dto.UserId,
            Titre = dto.Titre,
            Message = dto.Message,
            Type = type,
            LienAction = dto.LienAction,
            ReferenceId = dto.ReferenceId,
            DateCreation = DateTime.UtcNow
        };

        _context.Notifications.Add(notification);
        await _context.SaveChangesAsync();

        var notificationDto = MapToDto(notification);

        // Send real-time notification via SignalR
        await _hubService.SendNotificationToUserAsync(dto.UserId, notificationDto);
        
        // Also send updated count
        var count = await GetNotificationCountAsync(dto.UserId);
        await _hubService.SendNotificationCountAsync(dto.UserId, count);

        return notificationDto;
    }

    public async Task<bool> MarkAsReadAsync(int id, string userId)
    {
        var notification = await _context.Notifications
            .FirstOrDefaultAsync(n => n.Id == id && n.UserId == userId);

        if (notification == null) return false;

        notification.EstLue = true;
        notification.DateLecture = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        // Send updated count via SignalR
        var count = await GetNotificationCountAsync(userId);
        await _hubService.SendNotificationCountAsync(userId, count);

        return true;
    }

    public async Task<bool> MarkAllAsReadAsync(string userId)
    {
        var notifications = await _context.Notifications
            .Where(n => n.UserId == userId && !n.EstLue)
            .ToListAsync();

        foreach (var notification in notifications)
        {
            notification.EstLue = true;
            notification.DateLecture = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();

        // Send updated count via SignalR
        var count = await GetNotificationCountAsync(userId);
        await _hubService.SendNotificationCountAsync(userId, count);

        return true;
    }

    public async Task<bool> DeleteNotificationAsync(int id, string userId)
    {
        var notification = await _context.Notifications
            .FirstOrDefaultAsync(n => n.Id == id && n.UserId == userId);

        if (notification == null) return false;

        _context.Notifications.Remove(notification);
        await _context.SaveChangesAsync();

        // Send updated count via SignalR
        var count = await GetNotificationCountAsync(userId);
        await _hubService.SendNotificationCountAsync(userId, count);

        return true;
    }

    public async Task<bool> DeleteAllReadNotificationsAsync(string userId)
    {
        var notifications = await _context.Notifications
            .Where(n => n.UserId == userId && n.EstLue)
            .ToListAsync();

        _context.Notifications.RemoveRange(notifications);
        await _context.SaveChangesAsync();

        // Send updated count via SignalR
        var count = await GetNotificationCountAsync(userId);
        await _hubService.SendNotificationCountAsync(userId, count);

        return true;
    }

    // ==================== Helper pour notifier tous les responsables SAV ====================
    
    private async Task NotifyAllResponsablesSAVAsync(string titre, string message, NotificationType type, string lienAction, int? referenceId)
    {
        try
        {
            _logger.LogInformation("Fetching ResponsableSAV users to send notification: {Titre}", titre);
            var responsableIds = await _authApiClient.GetUserIdsByRoleAsync("ResponsableSAV");
            
            _logger.LogInformation("Found {Count} ResponsableSAV users", responsableIds?.Count() ?? 0);
            
            if (responsableIds == null || !responsableIds.Any())
            {
                _logger.LogWarning("No ResponsableSAV users found, no notifications will be sent");
                return;
            }
            
            foreach (var responsableId in responsableIds)
            {
                _logger.LogInformation("Creating notification for ResponsableSAV user: {UserId}", responsableId);
                await CreateNotificationAsync(new CreateNotificationDto
                {
                    UserId = responsableId,
                    Titre = titre,
                    Message = message,
                    Type = type.ToString(),
                    LienAction = lienAction,
                    ReferenceId = referenceId
                });
            }
            
            _logger.LogInformation("Successfully sent notifications to all ResponsableSAV users");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to notify ResponsableSAV users for: {Titre}", titre);
        }
    }

    // ==================== Méthodes de notification automatique ====================

    public async Task NotifyReclamationCreatedAsync(int reclamationId, int clientId, string clientUserId)
    {
        await NotifyAllResponsablesSAVAsync(
            "Nouvelle réclamation",
            $"Une nouvelle réclamation #{reclamationId} a été soumise et nécessite votre attention.",
            NotificationType.ReclamationCreee,
            $"/responsable/reclamations/{reclamationId}",
            reclamationId
        );
    }

    public async Task NotifyReclamationStatusChangedAsync(int reclamationId, string newStatus, string clientUserId)
    {
        var (titre, message, type) = newStatus switch
        {
            "EnCours" => ("Réclamation en cours", $"Votre réclamation #{reclamationId} est maintenant en cours de traitement.", NotificationType.ReclamationMiseAJour),
            "Resolue" => ("Réclamation résolue", $"Votre réclamation #{reclamationId} a été résolue avec succès.", NotificationType.ReclamationResolue),
            "Rejetee" => ("Réclamation rejetée", $"Votre réclamation #{reclamationId} a été rejetée.", NotificationType.ReclamationRejetee),
            _ => ("Réclamation mise à jour", $"Le statut de votre réclamation #{reclamationId} a été mis à jour.", NotificationType.ReclamationMiseAJour)
        };

        await CreateNotificationAsync(new CreateNotificationDto
        {
            UserId = clientUserId,
            Titre = titre,
            Message = message,
            Type = type.ToString(),
            LienAction = $"/client/reclamations/{reclamationId}",
            ReferenceId = reclamationId
        });
    }

    public async Task NotifyInterventionCreatedAsync(int interventionId, int reclamationId, string technicienUserId, string? clientUserId)
    {
        // Notifier le technicien
        await CreateNotificationAsync(new CreateNotificationDto
        {
            UserId = technicienUserId,
            Titre = "Nouvelle intervention assignée",
            Message = $"Une nouvelle intervention #{interventionId} vous a été assignée.",
            Type = NotificationType.InterventionPlanifiee.ToString(),
            LienAction = $"/technicien/interventions/{interventionId}",
            ReferenceId = interventionId
        });

        // Notifier le client si disponible
        if (!string.IsNullOrEmpty(clientUserId))
        {
            await CreateNotificationAsync(new CreateNotificationDto
            {
                UserId = clientUserId,
                Titre = "Intervention planifiée",
                Message = $"Une intervention a été planifiée pour votre réclamation #{reclamationId}.",
                Type = NotificationType.InterventionPlanifiee.ToString(),
                LienAction = $"/client/reclamations/{reclamationId}",
                ReferenceId = interventionId
            });
        }
    }

    public async Task NotifyInterventionStatusChangedAsync(int interventionId, string newStatus, string technicienUserId, string? clientUserId)
    {
        var (titre, message, type) = newStatus switch
        {
            "EnCours" => ("Intervention en cours", $"L'intervention #{interventionId} est maintenant en cours.", NotificationType.InterventionEnCours),
            "Terminee" => ("Intervention terminée", $"L'intervention #{interventionId} a été terminée avec succès.", NotificationType.InterventionTerminee),
            "Annulee" => ("Intervention annulée", $"L'intervention #{interventionId} a été annulée.", NotificationType.InterventionAnnulee),
            _ => ("Intervention mise à jour", $"Le statut de l'intervention #{interventionId} a été mis à jour.", NotificationType.InterventionEnCours)
        };

        // Notifier le client
        if (!string.IsNullOrEmpty(clientUserId))
        {
            await CreateNotificationAsync(new CreateNotificationDto
            {
                UserId = clientUserId,
                Titre = titre,
                Message = message,
                Type = type.ToString(),
                LienAction = $"/client/interventions/{interventionId}",
                ReferenceId = interventionId
            });
        }

        // Notifier le responsable SAV
        await NotifyAllResponsablesSAVAsync(
            titre,
            $"L'intervention #{interventionId} - {message}",
            type,
            $"/responsable/interventions/{interventionId}",
            interventionId
        );
    }

    public async Task NotifyEvaluationReceivedAsync(int evaluationId, int interventionId, string technicienUserId)
    {
        await CreateNotificationAsync(new CreateNotificationDto
        {
            UserId = technicienUserId,
            Titre = "Nouvelle évaluation",
            Message = $"Vous avez reçu une nouvelle évaluation pour l'intervention #{interventionId}.",
            Type = NotificationType.NouvelleEvaluation.ToString(),
            LienAction = $"/technicien/evaluations",
            ReferenceId = evaluationId
        });
    }

    // ==================== RDV Notifications ====================

    public async Task NotifyRdvRequestedAsync(int rdvId, string clientUserId, DateTime dateProposee)
    {
        // Notifier tous les responsables SAV
        await NotifyAllResponsablesSAVAsync(
            "Nouvelle demande de RDV",
            $"Un client a demandé un rendez-vous pour le {dateProposee:dd/MM/yyyy à HH:mm}.",
            NotificationType.RdvPlanifie,
            $"/responsable/rdv/{rdvId}",
            rdvId
        );
    }

    public async Task NotifyRdvConfirmedAsync(int rdvId, string clientUserId, DateTime dateConfirmee)
    {
        await CreateNotificationAsync(new CreateNotificationDto
        {
            UserId = clientUserId,
            Titre = "RDV confirmé",
            Message = $"Votre demande de rendez-vous a été acceptée pour le {dateConfirmee:dd/MM/yyyy à HH:mm}.",
            Type = NotificationType.RdvConfirme.ToString(),
            LienAction = $"/client/rdv",
            ReferenceId = rdvId
        });
    }

    public async Task NotifyRdvRejectedAsync(int rdvId, string clientUserId, string? motif)
    {
        var message = string.IsNullOrEmpty(motif)
            ? "Votre demande de rendez-vous a été refusée."
            : $"Votre demande de rendez-vous a été refusée. Motif: {motif}";

        await CreateNotificationAsync(new CreateNotificationDto
        {
            UserId = clientUserId,
            Titre = "RDV refusé",
            Message = message,
            Type = NotificationType.RdvAnnule.ToString(),
            LienAction = $"/client/rdv",
            ReferenceId = rdvId
        });
    }

    public async Task NotifyRdvCancelledAsync(int rdvId, string clientUserId, bool cancelledByClient)
    {
        if (cancelledByClient)
        {
            // Le client annule → notifier les responsables
            await NotifyAllResponsablesSAVAsync(
                "RDV annulé par le client",
                $"Le client a annulé sa demande de rendez-vous #{rdvId}.",
                NotificationType.RdvAnnule,
                $"/responsable/rdv",
                rdvId
            );
        }
        else
        {
            // Le responsable annule → notifier le client
            await CreateNotificationAsync(new CreateNotificationDto
            {
                UserId = clientUserId,
                Titre = "RDV annulé",
                Message = "Votre rendez-vous a été annulé par le service.",
                Type = NotificationType.RdvAnnule.ToString(),
                LienAction = $"/client/rdv",
                ReferenceId = rdvId
            });
        }
    }

    // ==================== Payment Notifications ====================

    public async Task NotifyPaymentSuccessAsync(int interventionId, string clientUserId, decimal montant)
    {
        // Notifier le client
        await CreateNotificationAsync(new CreateNotificationDto
        {
            UserId = clientUserId,
            Titre = "Paiement reçu",
            Message = $"Votre paiement de {montant:C} pour l'intervention #{interventionId} a été reçu avec succès.",
            Type = NotificationType.PaiementRecu.ToString(),
            LienAction = $"/client/factures",
            ReferenceId = interventionId
        });

        // Notifier les responsables SAV
        await NotifyAllResponsablesSAVAsync(
            "Paiement reçu",
            $"Le client a payé {montant:C} pour l'intervention #{interventionId}.",
            NotificationType.PaiementRecu,
            $"/responsable/paiements",
            interventionId
        );
    }

    public async Task NotifyPaymentFailedAsync(int interventionId, string clientUserId)
    {
        await CreateNotificationAsync(new CreateNotificationDto
        {
            UserId = clientUserId,
            Titre = "Paiement échoué",
            Message = $"Le paiement pour l'intervention #{interventionId} a échoué. Veuillez réessayer.",
            Type = NotificationType.PaiementEchoue.ToString(),
            LienAction = $"/client/factures",
            ReferenceId = interventionId
        });
    }

    // ==================== Mapping ====================

    private static NotificationDto MapToDto(Notification notification)
    {
        return new NotificationDto
        {
            Id = notification.Id,
            UserId = notification.UserId,
            Titre = notification.Titre,
            Message = notification.Message,
            Type = notification.Type.ToString(),
            EstLue = notification.EstLue,
            LienAction = notification.LienAction,
            ReferenceId = notification.ReferenceId,
            DateCreation = notification.DateCreation,
            DateLecture = notification.DateLecture
        };
    }
}
