namespace SAV.Interventions.Application.Interfaces;

public interface INotificationsApiClient
{
    Task NotifyInterventionCreatedAsync(int interventionId, int reclamationId, string technicienUserId, string? clientUserId);
    Task NotifyInterventionStatusChangedAsync(int interventionId, string newStatus, string technicienUserId, string? clientUserId);
    Task NotifyEvaluationReceivedAsync(int evaluationId, int interventionId, string technicienUserId);
    
    // RDV Notifications
    Task NotifyRdvRequestedAsync(int rdvId, string clientUserId, DateTime dateProposee);
    Task NotifyRdvConfirmedAsync(int rdvId, string clientUserId, DateTime dateConfirmee);
    Task NotifyRdvRejectedAsync(int rdvId, string clientUserId, string? motif);
    Task NotifyRdvCancelledAsync(int rdvId, string clientUserId, bool cancelledByClient);
}
