namespace SAV.Clients.Application.Interfaces;

/// <summary>
/// Interface for communicating with the Notifications microservice
/// </summary>
public interface INotificationsApiClient
{
    Task NotifyReclamationCreatedAsync(int reclamationId, int clientId, string clientUserId);
    Task NotifyReclamationStatusChangedAsync(int reclamationId, string newStatus, string clientUserId);
}
