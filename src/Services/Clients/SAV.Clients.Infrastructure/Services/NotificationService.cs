using Microsoft.EntityFrameworkCore;
using SAV.Clients.Application.Interfaces;
using SAV.Clients.Domain.Entities;
using SAV.Clients.Infrastructure.Data;
using SAV.Shared.DTOs.Notifications;

namespace SAV.Clients.Infrastructure.Services;

public class NotificationService : INotificationService
{
    private readonly ClientsDbContext _context;

    public NotificationService(ClientsDbContext context)
    {
        _context = context;
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

        return MapToDto(notification);
    }

    public async Task<bool> MarkAsReadAsync(int id, string userId)
    {
        var notification = await _context.Notifications
            .FirstOrDefaultAsync(n => n.Id == id && n.UserId == userId);

        if (notification == null) return false;

        notification.EstLue = true;
        notification.DateLecture = DateTime.UtcNow;
        await _context.SaveChangesAsync();

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
        return true;
    }

    public async Task<bool> DeleteNotificationAsync(int id, string userId)
    {
        var notification = await _context.Notifications
            .FirstOrDefaultAsync(n => n.Id == id && n.UserId == userId);

        if (notification == null) return false;

        _context.Notifications.Remove(notification);
        await _context.SaveChangesAsync();

        return true;
    }

    public async Task<bool> DeleteAllReadNotificationsAsync(string userId)
    {
        var notifications = await _context.Notifications
            .Where(n => n.UserId == userId && n.EstLue)
            .ToListAsync();

        _context.Notifications.RemoveRange(notifications);
        await _context.SaveChangesAsync();

        return true;
    }

    // ==================== Méthodes de notification automatique ====================

    public async Task NotifyReclamationCreatedAsync(int reclamationId, int clientId, string clientUserId)
    {
        // Notifier le client
        await CreateNotificationAsync(new CreateNotificationDto
        {
            UserId = clientUserId,
            Titre = "Réclamation créée",
            Message = $"Votre réclamation #{reclamationId} a été créée avec succès et est en attente de traitement.",
            Type = NotificationType.ReclamationCreee.ToString(),
            LienAction = $"/client/reclamations/{reclamationId}",
            ReferenceId = reclamationId
        });

        // Notifier les responsables SAV (on récupère tous les users avec rôle ResponsableSAV via un système externe)
        // Note: Dans un vrai système, on appellerait le Auth Service pour obtenir les responsables
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

        // Notifier le client si on a son userId
        if (!string.IsNullOrEmpty(clientUserId))
        {
            await CreateNotificationAsync(new CreateNotificationDto
            {
                UserId = clientUserId,
                Titre = "Intervention planifiée",
                Message = $"Une intervention #{interventionId} a été planifiée pour votre réclamation #{reclamationId}.",
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

        // Notifier le technicien
        await CreateNotificationAsync(new CreateNotificationDto
        {
            UserId = technicienUserId,
            Titre = titre,
            Message = message,
            Type = type.ToString(),
            LienAction = $"/technicien/interventions/{interventionId}",
            ReferenceId = interventionId
        });

        // Notifier le client
        if (!string.IsNullOrEmpty(clientUserId))
        {
            await CreateNotificationAsync(new CreateNotificationDto
            {
                UserId = clientUserId,
                Titre = titre,
                Message = message,
                Type = type.ToString(),
                LienAction = $"/client/reclamations",
                ReferenceId = interventionId
            });
        }
    }

    public async Task NotifyEvaluationReceivedAsync(int evaluationId, int interventionId, string technicienUserId)
    {
        await CreateNotificationAsync(new CreateNotificationDto
        {
            UserId = technicienUserId,
            Titre = "Nouvelle évaluation reçue",
            Message = $"Vous avez reçu une nouvelle évaluation pour l'intervention #{interventionId}.",
            Type = NotificationType.NouvelleEvaluation.ToString(),
            LienAction = $"/technicien/interventions/{interventionId}",
            ReferenceId = evaluationId
        });
    }

    public async Task NotifyRdvStatusChangedAsync(int rdvId, string status, string clientUserId)
    {
        var (titre, message, type) = status switch
        {
            "Confirme" => ("RDV confirmé", $"Votre rendez-vous #{rdvId} a été confirmé.", NotificationType.RdvConfirme),
            "Annule" => ("RDV annulé", $"Votre rendez-vous #{rdvId} a été annulé.", NotificationType.RdvAnnule),
            _ => ("RDV planifié", $"Votre rendez-vous #{rdvId} a été planifié.", NotificationType.RdvPlanifie)
        };

        await CreateNotificationAsync(new CreateNotificationDto
        {
            UserId = clientUserId,
            Titre = titre,
            Message = message,
            Type = type.ToString(),
            LienAction = $"/client/rdv",
            ReferenceId = rdvId
        });
    }

    public async Task NotifyPaymentStatusAsync(int interventionId, bool success, string clientUserId)
    {
        var (titre, message, type) = success
            ? ("Paiement réussi", $"Votre paiement pour l'intervention #{interventionId} a été effectué avec succès.", NotificationType.PaiementRecu)
            : ("Échec du paiement", $"Le paiement pour l'intervention #{interventionId} a échoué. Veuillez réessayer.", NotificationType.PaiementEchoue);

        await CreateNotificationAsync(new CreateNotificationDto
        {
            UserId = clientUserId,
            Titre = titre,
            Message = message,
            Type = type.ToString(),
            LienAction = $"/client/reclamations",
            ReferenceId = interventionId
        });
    }

    private static NotificationDto MapToDto(Notification n)
    {
        return new NotificationDto
        {
            Id = n.Id,
            UserId = n.UserId,
            Titre = n.Titre,
            Message = n.Message,
            Type = n.Type.ToString(),
            EstLue = n.EstLue,
            LienAction = n.LienAction,
            ReferenceId = n.ReferenceId,
            DateCreation = n.DateCreation,
            DateLecture = n.DateLecture
        };
    }
}
