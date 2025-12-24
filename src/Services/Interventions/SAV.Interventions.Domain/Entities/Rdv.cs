namespace SAV.Interventions.Domain.Entities;

public class CreneauDisponible
{
    public int Id { get; set; }
    public int TechnicienId { get; set; }
    public Technicien Technicien { get; set; } = null!;
    public DateTime DateDebut { get; set; }
    public DateTime DateFin { get; set; }
    public bool EstReserve { get; set; } = false;
    public int? InterventionId { get; set; }
    public Intervention? Intervention { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class DemandeRdv
{
    public int Id { get; set; }
    public int ReclamationId { get; set; }
    public int ClientId { get; set; }
    public int? CreneauId { get; set; }
    public CreneauDisponible? Creneau { get; set; }
    public DateTime? DateSouhaitee { get; set; }
    public string? PreferenceMoment { get; set; } // Matin, Après-midi, Soir
    public DemandeRdvStatut Statut { get; set; } = DemandeRdvStatut.EnAttente;
    public string? Commentaire { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? TraiteeAt { get; set; }
}

public enum DemandeRdvStatut
{
    EnAttente,
    Confirmee,
    Refusee,
    Annulee
}
