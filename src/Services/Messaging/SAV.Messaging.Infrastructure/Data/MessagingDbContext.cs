using Microsoft.EntityFrameworkCore;
using SAV.Messaging.Domain.Entities;

namespace SAV.Messaging.Infrastructure.Data;

public class MessagingDbContext : DbContext
{
    public MessagingDbContext(DbContextOptions<MessagingDbContext> options)
        : base(options)
    {
    }

    public DbSet<Conversation> Conversations { get; set; }
    public DbSet<Message> Messages { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Conversation>(entity =>
        {
            entity.HasKey(c => c.Id);
            
            entity.Property(c => c.ParticipantUserId)
                .IsRequired()
                .HasMaxLength(450);
            
            entity.Property(c => c.ParticipantNom)
                .IsRequired()
                .HasMaxLength(200);
            
            entity.Property(c => c.ResponsableUserId)
                .IsRequired()
                .HasMaxLength(450);
            
            entity.Property(c => c.ResponsableNom)
                .IsRequired()
                .HasMaxLength(200);
            
            entity.Property(c => c.Sujet)
                .HasMaxLength(500);
            
            entity.Property(c => c.DernierMessageApercu)
                .HasMaxLength(200);

            // Index pour les requêtes fréquentes
            entity.HasIndex(c => c.ParticipantUserId);
            entity.HasIndex(c => c.ResponsableUserId);
            entity.HasIndex(c => new { c.ParticipantUserId, c.EstArchivee });
            entity.HasIndex(c => new { c.ResponsableUserId, c.EstArchivee });
            entity.HasIndex(c => c.DernierMessageDate);

            // Relation avec les messages
            entity.HasMany(c => c.Messages)
                .WithOne(m => m.Conversation)
                .HasForeignKey(m => m.ConversationId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Message>(entity =>
        {
            entity.HasKey(m => m.Id);
            
            entity.Property(m => m.ExpediteurUserId)
                .IsRequired()
                .HasMaxLength(450);
            
            entity.Property(m => m.ExpediteurNom)
                .IsRequired()
                .HasMaxLength(200);
            
            entity.Property(m => m.Contenu)
                .IsRequired()
                .HasMaxLength(4000);
            
            entity.Property(m => m.PieceJointeUrl)
                .HasMaxLength(1000);
            
            entity.Property(m => m.PieceJointeNom)
                .HasMaxLength(500);

            // Index pour les requêtes fréquentes
            entity.HasIndex(m => m.ConversationId);
            entity.HasIndex(m => m.DateEnvoi);
            entity.HasIndex(m => new { m.ConversationId, m.EstLu });
        });
    }
}
