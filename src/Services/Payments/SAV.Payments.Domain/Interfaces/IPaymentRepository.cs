using SAV.Payments.Domain.Entities;

namespace SAV.Payments.Domain.Interfaces;

public interface IPaymentRepository
{
    Task<Payment?> GetByIdAsync(int id);
    Task<Payment?> GetByInterventionIdAsync(int interventionId);
    Task<Payment?> GetByStripeSessionIdAsync(string sessionId);
    Task<Payment?> GetByStripePaymentIntentIdAsync(string paymentIntentId);
    Task<IEnumerable<Payment>> GetByClientIdAsync(int clientId);
    Task<IEnumerable<Payment>> GetAllAsync();
    Task<IEnumerable<Payment>> GetByStatutAsync(PaymentStatut statut);
    Task<Payment> CreateAsync(Payment payment);
    Task UpdateAsync(Payment payment);
    Task DeleteAsync(int id);
    Task<decimal> GetTotalRevenueAsync(DateTime? startDate = null, DateTime? endDate = null);
    Task<int> GetPaymentCountByStatutAsync(PaymentStatut statut);
}
