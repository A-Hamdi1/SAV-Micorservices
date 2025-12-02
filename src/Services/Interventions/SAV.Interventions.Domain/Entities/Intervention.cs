namespace SAV.Interventions.Domain.Entities;

public class Intervention
{
    public int Id { get; set; }
    public int ReclamationId { get; set; }
    
    // Nouveau système avec Technicien
    public int? TechnicienId { get; set; }
    public Technicien? Technicien { get; set; }
    
    // Ancien système (conservé pour compatibilité)
    public string TechnicienNom { get; set; } = string.Empty;
    
    public DateTime DateIntervention { get; set; }
    public InterventionStatut Statut { get; set; } = InterventionStatut.Planifiee;
    public bool EstGratuite { get; set; }
    public decimal? MontantMainOeuvre { get; set; }
    public string? Commentaire { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public List<PieceUtilisee> PiecesUtilisees { get; set; } = new();

    public decimal MontantTotal
    {
        get
        {
            if (EstGratuite)
                return 0;

            var montantPieces = PiecesUtilisees?.Sum(p => p.SousTotal) ?? 0;
            var montantMainOeuvre = MontantMainOeuvre ?? 0;

            return montantPieces + montantMainOeuvre;
        }
    }
}

public enum InterventionStatut
{
    Planifiee,
    EnCours,
    Terminee,
    Annulee
}
