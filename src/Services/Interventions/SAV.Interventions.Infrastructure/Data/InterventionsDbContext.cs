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
    public DbSet<Technicien> Techniciens => Set<Technicien>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Technicien>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Nom).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Prenom).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Email).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Telephone).IsRequired().HasMaxLength(20);
            entity.Property(e => e.Specialite).IsRequired().HasMaxLength(100);
            
            entity.HasIndex(e => e.Email).IsUnique();
        });

        modelBuilder.Entity<Intervention>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.TechnicienNom).IsRequired(false).HasMaxLength(200);
            entity.Property(e => e.Commentaire).HasMaxLength(2000);
            entity.Property(e => e.Statut).HasConversion<string>();
            entity.Property(e => e.MontantMainOeuvre).HasColumnType("decimal(18,2)");
            
            entity.Ignore(e => e.MontantTotal);
            
            entity.HasOne(e => e.Technicien)
                .WithMany(t => t.Interventions)
                .HasForeignKey(e => e.TechnicienId)
                .OnDelete(DeleteBehavior.Restrict);
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
