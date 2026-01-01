namespace SAV.Articles.Domain.Entities;

public class Article
{
    public int Id { get; set; }
    public string Reference { get; set; } = string.Empty;
    public string Nom { get; set; } = string.Empty;
    
    // Relation avec Categorie
    public int? CategorieId { get; set; }
    public Categorie? Categorie { get; set; }
    
    // Ancien champ conservé pour compatibilité (sera rempli à partir de Categorie.Nom)
    public string CategorieNom { get; set; } = string.Empty;
    
    public decimal PrixVente { get; set; }
    public int DureeGarantie { get; set; } // En mois
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public List<PieceDetachee> PiecesDetachees { get; set; } = new();
}
