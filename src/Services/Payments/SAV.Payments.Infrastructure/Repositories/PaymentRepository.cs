using Microsoft.EntityFrameworkCore;
using SAV.Payments.Domain.Entities;
using SAV.Payments.Domain.Interfaces;
using SAV.Payments.Infrastructure.Data;

namespace SAV.Payments.Infrastructure.Repositories;

public class PaymentRepository : IPaymentRepository
{
    private readonly PaymentDbContext _context;

    public PaymentRepository(PaymentDbContext context)
    {
        _context = context;
    }

    public async Task<Payment?> GetByIdAsync(int id)
    {
        return await _context.Payments.FindAsync(id);
    }

    public async Task<Payment?> GetByInterventionIdAsync(int interventionId)
    {
        return await _context.Payments
            .FirstOrDefaultAsync(p => p.InterventionId == interventionId);
    }

    public async Task<Payment?> GetByStripeSessionIdAsync(string sessionId)
    {
        return await _context.Payments
            .FirstOrDefaultAsync(p => p.StripeSessionId == sessionId);
    }

    public async Task<Payment?> GetByStripePaymentIntentIdAsync(string paymentIntentId)
    {
        return await _context.Payments
            .FirstOrDefaultAsync(p => p.StripePaymentIntentId == paymentIntentId);
    }

    public async Task<IEnumerable<Payment>> GetByClientIdAsync(int clientId)
    {
        return await _context.Payments
            .Where(p => p.ClientId == clientId)
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync();
    }

    public async Task<IEnumerable<Payment>> GetAllAsync()
    {
        return await _context.Payments
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync();
    }

    public async Task<IEnumerable<Payment>> GetByStatutAsync(PaymentStatut statut)
    {
        return await _context.Payments
            .Where(p => p.Statut == statut)
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync();
    }

    public async Task<Payment> CreateAsync(Payment payment)
    {
        _context.Payments.Add(payment);
        await _context.SaveChangesAsync();
        return payment;
    }

    public async Task UpdateAsync(Payment payment)
    {
        _context.Entry(payment).State = EntityState.Modified;
        await _context.SaveChangesAsync();
    }

    public async Task DeleteAsync(int id)
    {
        var payment = await _context.Payments.FindAsync(id);
        if (payment != null)
        {
            _context.Payments.Remove(payment);
            await _context.SaveChangesAsync();
        }
    }

    public async Task<decimal> GetTotalRevenueAsync(DateTime? startDate = null, DateTime? endDate = null)
    {
        var query = _context.Payments
            .Where(p => p.Statut == PaymentStatut.Reussi);

        if (startDate.HasValue)
            query = query.Where(p => p.PaidAt >= startDate.Value);

        if (endDate.HasValue)
            query = query.Where(p => p.PaidAt <= endDate.Value);

        return await query.SumAsync(p => p.Montant);
    }

    public async Task<int> GetPaymentCountByStatutAsync(PaymentStatut statut)
    {
        return await _context.Payments.CountAsync(p => p.Statut == statut);
    }
}
