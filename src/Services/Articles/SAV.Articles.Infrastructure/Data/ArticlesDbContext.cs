using Microsoft.EntityFrameworkCore;
using SAV.Articles.Domain.Entities;

namespace SAV.Articles.Infrastructure.Data;

public class ArticlesDbContext : DbContext
{
    public ArticlesDbContext(DbContextOptions<ArticlesDbContext> options) : base(options)
    {
    }

    public DbSet<Article> Articles { get; set; }
    public DbSet<Categorie> Categories { get; set; }
    public DbSet<PieceDetachee> PiecesDetachees { get; set; }
    public DbSet<MouvementStock> MouvementsStock { get; set; }

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.Entity<Categorie>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Nom).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Description).HasMaxLength(500);
            entity.HasIndex(e => e.Nom).IsUnique();
            
            entity.HasMany(e => e.Articles)
                  .WithOne(a => a.Categorie)
                  .HasForeignKey(a => a.CategorieId)
                  .OnDelete(DeleteBehavior.SetNull);
        });

        builder.Entity<Article>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Reference).IsRequired().HasMaxLength(50);
            entity.Property(e => e.Nom).IsRequired().HasMaxLength(200);
            entity.Property(e => e.CategorieNom).HasMaxLength(100);
            entity.Property(e => e.PrixVente).HasColumnType("decimal(18,2)");
            entity.HasIndex(e => e.Reference).IsUnique();
            
            entity.HasMany(e => e.PiecesDetachees)
                  .WithOne(p => p.Article)
                  .HasForeignKey(p => p.ArticleId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<PieceDetachee>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Nom).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Reference).IsRequired().HasMaxLength(50);
            entity.Property(e => e.Prix).HasColumnType("decimal(18,2)");
            entity.HasIndex(e => e.Reference);
            
            entity.HasMany(e => e.MouvementsStock)
                  .WithOne(m => m.PieceDetachee)
                  .HasForeignKey(m => m.PieceDetacheeId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<MouvementStock>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Type).HasConversion<string>();
            entity.Property(e => e.Raison).HasMaxLength(500);
            entity.HasIndex(e => e.PieceDetacheeId);
            entity.HasIndex(e => e.CreatedAt);
        });
    }
}
