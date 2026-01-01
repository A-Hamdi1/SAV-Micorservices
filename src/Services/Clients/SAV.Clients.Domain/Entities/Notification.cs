namespace SAV.Clients.Domain.Entities;

public class Notification
{
    public int Id { get; set; }
    public string UserId { get; set; } = string.Empty;
    public string Titre { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public NotificationType Type { get; set; }
    public bool EstLue { get; set; } = false;
    public string? LienAction { get; set; }
    public int? ReferenceId { get; set; }
    public DateTime DateCreation { get; set; } = DateTime.UtcNow;
    public DateTime? DateLecture { get; set; }
}

public enum NotificationType
{
    ReclamationCreee,
    ReclamationMiseAJour,
    ReclamationResolue,
    ReclamationRejetee,
    InterventionPlanifiee,
    InterventionEnCours,
    InterventionTerminee,
    InterventionAnnulee,
    NouvelleEvaluation,
    RdvPlanifie,
    RdvConfirme,
    RdvAnnule,
    PaiementRecu,
    PaiementEchoue,
    Systeme
}
