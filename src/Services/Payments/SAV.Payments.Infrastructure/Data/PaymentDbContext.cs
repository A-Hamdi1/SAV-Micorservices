using Microsoft.EntityFrameworkCore;
using SAV.Payments.Domain.Entities;

namespace SAV.Payments.Infrastructure.Data;

public class PaymentDbContext : DbContext
{
    public PaymentDbContext(DbContextOptions<PaymentDbContext> options) : base(options)
    {
    }

    public DbSet<Payment> Payments => Set<Payment>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Payment>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Montant).HasPrecision(18, 2);
            entity.Property(e => e.Statut).HasConversion<string>();
            entity.Property(e => e.Methode).HasConversion<string>();
            entity.HasIndex(e => e.InterventionId);
            entity.HasIndex(e => e.ClientId);
            entity.HasIndex(e => e.StripeSessionId);
            entity.HasIndex(e => e.StripePaymentIntentId);
        });
    }
}
