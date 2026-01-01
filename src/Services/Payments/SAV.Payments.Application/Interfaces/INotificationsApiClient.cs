namespace SAV.Payments.Application.Interfaces;

public interface INotificationsApiClient
{
    Task NotifyPaymentSuccessAsync(int interventionId, string clientUserId, decimal montant);
    Task NotifyPaymentFailedAsync(int interventionId, string clientUserId);
}
