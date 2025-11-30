namespace SAV.Interventions.Domain.Entities;

public class PieceUtilisee
{
    public int Id { get; set; }
    public int InterventionId { get; set; }
    public Intervention? Intervention { get; set; }
    public int PieceDetacheeId { get; set; }
    public int Quantite { get; set; }
    public decimal PrixUnitaire { get; set; }
    public decimal SousTotal => Quantite * PrixUnitaire;
}
