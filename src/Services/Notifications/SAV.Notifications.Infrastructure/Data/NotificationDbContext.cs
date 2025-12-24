using Microsoft.EntityFrameworkCore;
using SAV.Notifications.Domain.Entities;

namespace SAV.Notifications.Infrastructure.Data;

public class NotificationDbContext : DbContext
{
    public NotificationDbContext(DbContextOptions<NotificationDbContext> options) : base(options)
    {
    }

    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<NotificationTemplate> NotificationTemplates => Set<NotificationTemplate>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Notification>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Type).HasConversion<string>();
            entity.Property(e => e.Statut).HasConversion<string>();
            entity.HasIndex(e => e.ClientId);
            entity.HasIndex(e => e.Statut);
        });

        modelBuilder.Entity<NotificationTemplate>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Type).HasConversion<string>();
            entity.HasIndex(e => e.Type).IsUnique();
        });

        // Seed default templates
        modelBuilder.Entity<NotificationTemplate>().HasData(
            new NotificationTemplate
            {
                Id = 1,
                Type = NotificationType.Bienvenue,
                Sujet = "Bienvenue chez SAV Pro!",
                CorpsHtml = @"
                    <h1>Bienvenue {{ClientNom}}!</h1>
                    <p>Merci de vous être inscrit sur notre plateforme SAV.</p>
                    <p>Vous pouvez maintenant gérer vos articles et créer des réclamations.</p>
                "
            },
            new NotificationTemplate
            {
                Id = 2,
                Type = NotificationType.ReclamationCreee,
                Sujet = "Réclamation #{{ReclamationId}} créée",
                CorpsHtml = @"
                    <h1>Bonjour {{ClientNom}},</h1>
                    <p>Votre réclamation #{{ReclamationId}} pour l'article <strong>{{ArticleNom}}</strong> a été créée avec succès.</p>
                    <p>Notre équipe va traiter votre demande dans les plus brefs délais.</p>
                "
            },
            new NotificationTemplate
            {
                Id = 3,
                Type = NotificationType.ReclamationStatutChange,
                Sujet = "Mise à jour réclamation #{{ReclamationId}}",
                CorpsHtml = @"
                    <h1>Bonjour {{ClientNom}},</h1>
                    <p>Le statut de votre réclamation #{{ReclamationId}} a été mis à jour.</p>
                    <p><strong>Nouveau statut:</strong> {{Statut}}</p>
                "
            },
            new NotificationTemplate
            {
                Id = 4,
                Type = NotificationType.InterventionPlanifiee,
                Sujet = "Intervention planifiée - {{DateIntervention}}",
                CorpsHtml = @"
                    <h1>Bonjour {{ClientNom}},</h1>
                    <p>Une intervention a été planifiée pour votre réclamation.</p>
                    <p><strong>Date:</strong> {{DateIntervention}}</p>
                    <p>Un technicien vous contactera prochainement.</p>
                "
            },
            new NotificationTemplate
            {
                Id = 5,
                Type = NotificationType.InterventionTerminee,
                Sujet = "Intervention terminée - Réclamation #{{ReclamationId}}",
                CorpsHtml = @"
                    <h1>Bonjour {{ClientNom}},</h1>
                    <p>L'intervention pour votre réclamation #{{ReclamationId}} est terminée.</p>
                    <p>Merci de votre confiance!</p>
                "
            },
            new NotificationTemplate
            {
                Id = 6,
                Type = NotificationType.PaiementRecu,
                Sujet = "Paiement reçu - {{Montant}}€",
                CorpsHtml = @"
                    <h1>Bonjour {{ClientNom}},</h1>
                    <p>Nous avons bien reçu votre paiement de <strong>{{Montant}}€</strong>.</p>
                    <p>Merci pour votre règlement!</p>
                "
            },
            new NotificationTemplate
            {
                Id = 7,
                Type = NotificationType.GarantieExpiration,
                Sujet = "Votre garantie expire bientôt!",
                CorpsHtml = @"
                    <h1>Bonjour {{ClientNom}},</h1>
                    <p>La garantie de votre article <strong>{{ArticleNom}}</strong> expire le <strong>{{DateExpiration}}</strong>.</p>
                    <p>Pensez à vérifier votre équipement avant cette date.</p>
                "
            },
            new NotificationTemplate
            {
                Id = 8,
                Type = NotificationType.RappelPaiement,
                Sujet = "Rappel: Facture en attente de paiement",
                CorpsHtml = @"
                    <h1>Bonjour {{ClientNom}},</h1>
                    <p>Nous vous rappelons qu'une facture de <strong>{{Montant}}€</strong> est en attente de paiement.</p>
                    <p>Merci de régulariser votre situation.</p>
                "
            }
        );
    }
}
