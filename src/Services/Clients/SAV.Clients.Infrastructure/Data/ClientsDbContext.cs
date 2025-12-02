using Microsoft.EntityFrameworkCore;
using SAV.Clients.Domain.Entities;

namespace SAV.Clients.Infrastructure.Data;

public class ClientsDbContext : DbContext
{
    public ClientsDbContext(DbContextOptions<ClientsDbContext> options) : base(options)
    {
    }

    public DbSet<Client> Clients => Set<Client>();
    public DbSet<ArticleAchat> ArticlesAchetes => Set<ArticleAchat>();
    public DbSet<Reclamation> Reclamations => Set<Reclamation>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Client>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.UserId).IsRequired().HasMaxLength(450);
            entity.Property(e => e.Nom).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Prenom).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Telephone).IsRequired().HasMaxLength(20);
            entity.Property(e => e.Adresse).IsRequired().HasMaxLength(500);
            
            entity.HasIndex(e => e.UserId).IsUnique();
        });

        modelBuilder.Entity<ArticleAchat>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.NumeroSerie).IsRequired().HasMaxLength(100);
            
            entity.HasOne(e => e.Client)
                .WithMany(c => c.ArticlesAchetes)
                .HasForeignKey(e => e.ClientId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Reclamation>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Description).IsRequired().HasMaxLength(2000);
            entity.Property(e => e.CommentaireResponsable).HasMaxLength(2000);
            entity.Property(e => e.Statut).HasConversion<string>();
            
            entity.HasOne(e => e.Client)
                .WithMany(c => c.Reclamations)
                .HasForeignKey(e => e.ClientId)
                .OnDelete(DeleteBehavior.Cascade)
                .IsRequired();
            
            entity.HasOne(e => e.ArticleAchat)
                .WithMany(a => a.Reclamations)
                .HasForeignKey(e => e.ArticleAchatId)
                .OnDelete(DeleteBehavior.Restrict)
                .IsRequired();
        });
    }
}
