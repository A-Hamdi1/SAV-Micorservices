using Microsoft.EntityFrameworkCore;
using SAV.Interventions.Domain.Entities;

namespace SAV.Interventions.Infrastructure.Data;

public class InterventionsDbContext : DbContext
{
    public InterventionsDbContext(DbContextOptions<InterventionsDbContext> options) : base(options)
    {
    }

    public DbSet<Intervention> Interventions => Set<Intervention>();
    public DbSet<PieceUtilisee> PiecesUtilisees => Set<PieceUtilisee>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Intervention>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.TechnicienNom).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Commentaire).HasMaxLength(2000);
            entity.Property(e => e.Statut).HasConversion<string>();
            entity.Property(e => e.MontantMainOeuvre).HasColumnType("decimal(18,2)");
            
            entity.Ignore(e => e.MontantTotal);
        });

        modelBuilder.Entity<PieceUtilisee>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.PrixUnitaire).HasColumnType("decimal(18,2)");
            
            entity.Ignore(e => e.SousTotal);
            
            entity.HasOne(e => e.Intervention)
                .WithMany(i => i.PiecesUtilisees)
                .HasForeignKey(e => e.InterventionId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
