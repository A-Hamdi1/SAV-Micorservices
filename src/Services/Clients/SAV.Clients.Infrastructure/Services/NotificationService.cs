using Microsoft.EntityFrameworkCore;
using SAV.Clients.Application.Interfaces;
using SAV.Clients.Domain.Entities;
using SAV.Clients.Infrastructure.Data;
using SAV.Shared.DTOs.Notifications;

namespace SAV.Clients.Infrastructure.Services;

public class NotificationService : INotificationService
{
    private readonly ClientsDbContext _context;
    private readonly IAuthApiClient _authApiClient;

    public NotificationService(ClientsDbContext context, IAuthApiClient authApiClient)
    {
        _context = context;
        _authApiClient = authApiClient;
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

    // ==================== Helper pour notifier tous les responsables SAV ====================
    
    private async Task NotifyAllResponsablesSAVAsync(string titre, string message, NotificationType type, string lienAction, int? referenceId)
    {
        try
        {
            var responsableIds = await _authApiClient.GetUserIdsByRoleAsync("ResponsableSAV");
            foreach (var responsableId in responsableIds)
            {
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
        }
        catch
        {
            // Ne pas bloquer si la notification des responsables échoue
        }
    }

    // ==================== Méthodes de notification automatique ====================

    /// <summary>
    /// Quand un CLIENT crée une réclamation : notifier les RESPONSABLES SAV uniquement
    /// (Le client ne doit pas être notifié de sa propre action)
    /// </summary>
    public async Task NotifyReclamationCreatedAsync(int reclamationId, int clientId, string clientUserId)
    {
        // Notifier tous les responsables SAV qu'une nouvelle réclamation a été créée
        await NotifyAllResponsablesSAVAsync(
            "Nouvelle réclamation",
            $"Une nouvelle réclamation #{reclamationId} a été soumise et nécessite votre attention.",
            NotificationType.ReclamationCreee,
            $"/responsable/reclamations/{reclamationId}",
            reclamationId
        );
    }

    /// <summary>
    /// Quand le statut d'une réclamation change : notifier le CLIENT
    /// </summary>
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

    /// <summary>
    /// Quand une intervention est CRÉÉE/ASSIGNÉE par le responsable : 
    /// notifier le TECHNICIEN (nouvelle tâche) et le CLIENT (intervention planifiée)
    /// </summary>
    public async Task NotifyInterventionCreatedAsync(int interventionId, int reclamationId, string technicienUserId, string? clientUserId)
    {
        // Notifier le technicien qu'il a une nouvelle intervention assignée
        await CreateNotificationAsync(new CreateNotificationDto
        {
            UserId = technicienUserId,
            Titre = "Nouvelle intervention assignée",
            Message = $"Une nouvelle intervention #{interventionId} vous a été assignée.",
            Type = NotificationType.InterventionPlanifiee.ToString(),
            LienAction = $"/technicien/interventions/{interventionId}",
            ReferenceId = interventionId
        });

        // Notifier le client qu'une intervention a été planifiée pour sa réclamation
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

    /// <summary>
    /// Quand le statut d'une intervention change (EnCours, Terminée, etc.) :
    /// - Si le TECHNICIEN démarre/termine : notifier le CLIENT et les RESPONSABLES SAV
    /// - Le technicien ne doit PAS être notifié de ses propres actions
    /// </summary>
    public async Task NotifyInterventionStatusChangedAsync(int interventionId, string newStatus, string technicienUserId, string? clientUserId)
    {
        var (titre, message, type) = newStatus switch
        {
            "EnCours" => ("Intervention en cours", $"L'intervention #{interventionId} a été démarrée.", NotificationType.InterventionEnCours),
            "Terminee" => ("Intervention terminée", $"L'intervention #{interventionId} a été terminée.", NotificationType.InterventionTerminee),
            "Annulee" => ("Intervention annulée", $"L'intervention #{interventionId} a été annulée.", NotificationType.InterventionAnnulee),
            _ => ("Intervention mise à jour", $"Le statut de l'intervention #{interventionId} a été mis à jour.", NotificationType.InterventionEnCours)
        };

        // Notifier le client (si disponible)
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

        // Notifier tous les responsables SAV
        await NotifyAllResponsablesSAVAsync(
            titre,
            message,
            type,
            $"/responsable/interventions/{interventionId}",
            interventionId
        );
    }

    /// <summary>
    /// Quand un CLIENT envoie une évaluation : notifier le TECHNICIEN et les RESPONSABLES SAV
    /// </summary>
    public async Task NotifyEvaluationReceivedAsync(int evaluationId, int interventionId, string technicienUserId)
    {
        // Notifier le technicien
        await CreateNotificationAsync(new CreateNotificationDto
        {
            UserId = technicienUserId,
            Titre = "Nouvelle évaluation reçue",
            Message = $"Vous avez reçu une nouvelle évaluation pour l'intervention #{interventionId}.",
            Type = NotificationType.NouvelleEvaluation.ToString(),
            LienAction = $"/technicien/interventions/{interventionId}",
            ReferenceId = evaluationId
        });

        // Notifier les responsables SAV
        await NotifyAllResponsablesSAVAsync(
            "Nouvelle évaluation client",
            $"Le client a soumis une évaluation pour l'intervention #{interventionId}.",
            NotificationType.NouvelleEvaluation,
            $"/responsable/evaluations",
            evaluationId
        );
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

    /// <summary>
    /// Quand un CLIENT effectue un paiement : notifier les RESPONSABLES SAV
    /// </summary>
    public async Task NotifyPaymentStatusAsync(int interventionId, bool success, string clientUserId)
    {
        if (success)
        {
            // Notifier le client du succès
            await CreateNotificationAsync(new CreateNotificationDto
            {
                UserId = clientUserId,
                Titre = "Paiement réussi",
                Message = $"Votre paiement pour l'intervention #{interventionId} a été effectué avec succès.",
                Type = NotificationType.PaiementRecu.ToString(),
                LienAction = $"/client/reclamations",
                ReferenceId = interventionId
            });

            // Notifier les responsables SAV du paiement reçu
            await NotifyAllResponsablesSAVAsync(
                "Paiement reçu",
                $"Le client a effectué le paiement pour l'intervention #{interventionId}.",
                NotificationType.PaiementRecu,
                $"/responsable/payments",
                interventionId
            );
        }
        else
        {
            // Notifier le client de l'échec
            await CreateNotificationAsync(new CreateNotificationDto
            {
                UserId = clientUserId,
                Titre = "Échec du paiement",
                Message = $"Le paiement pour l'intervention #{interventionId} a échoué. Veuillez réessayer.",
                Type = NotificationType.PaiementEchoue.ToString(),
                LienAction = $"/client/reclamations",
                ReferenceId = interventionId
            });
        }
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
