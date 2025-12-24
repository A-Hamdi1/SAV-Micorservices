namespace SAV.Notifications.Domain.Entities;

public class Notification
{
    public int Id { get; set; }
    public int? ClientId { get; set; }
    public string Email { get; set; } = string.Empty;
    public string Sujet { get; set; } = string.Empty;
    public string Corps { get; set; } = string.Empty;
    public NotificationType Type { get; set; }
    public NotificationStatut Statut { get; set; } = NotificationStatut.EnAttente;
    public string? ReferenceType { get; set; } // Reclamation, Intervention, Payment
    public int? ReferenceId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? SentAt { get; set; }
    public string? ErrorMessage { get; set; }
    public int RetryCount { get; set; } = 0;
}

public enum NotificationType
{
    ReclamationCreee,
    ReclamationStatutChange,
    InterventionPlanifiee,
    InterventionTerminee,
    PaiementRecu,
    GarantieExpiration,
    RappelPaiement,
    Bienvenue
}

public enum NotificationStatut
{
    EnAttente,
    Envoyee,
    Echouee
}
