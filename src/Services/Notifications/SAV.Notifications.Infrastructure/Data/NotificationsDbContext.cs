using Microsoft.EntityFrameworkCore;
using SAV.Notifications.Domain.Entities;

namespace SAV.Notifications.Infrastructure.Data;

public class NotificationsDbContext : DbContext
{
    public NotificationsDbContext(DbContextOptions<NotificationsDbContext> options)
        : base(options)
    {
    }

    public DbSet<Notification> Notifications { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Notification>(entity =>
        {
            entity.HasKey(n => n.Id);
            entity.Property(n => n.UserId).IsRequired().HasMaxLength(450);
            entity.Property(n => n.Titre).IsRequired().HasMaxLength(200);
            entity.Property(n => n.Message).IsRequired().HasMaxLength(1000);
            entity.Property(n => n.Type).IsRequired();
            entity.Property(n => n.LienAction).HasMaxLength(500);
            
            // Index for faster queries
            entity.HasIndex(n => n.UserId);
            entity.HasIndex(n => new { n.UserId, n.EstLue });
            entity.HasIndex(n => n.DateCreation);
        });
    }
}
