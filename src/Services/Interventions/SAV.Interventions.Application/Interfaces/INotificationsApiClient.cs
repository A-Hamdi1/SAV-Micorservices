namespace SAV.Interventions.Application.Interfaces;

public interface INotificationsApiClient
{
    Task NotifyInterventionCreatedAsync(int interventionId, int reclamationId, string technicienUserId, string? clientUserId);
    Task NotifyInterventionStatusChangedAsync(int interventionId, string newStatus, string technicienUserId, string? clientUserId);
    Task NotifyEvaluationReceivedAsync(int evaluationId, int interventionId, string technicienUserId);
}
