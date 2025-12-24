namespace SAV.Articles.Domain.Entities;

public class PieceDetachee
{
    public int Id { get; set; }
    public int ArticleId { get; set; }
    public Article Article { get; set; } = null!;
    public string Nom { get; set; } = string.Empty;
    public string Reference { get; set; } = string.Empty;
    public decimal Prix { get; set; }
    public int Stock { get; set; }
    public int SeuilAlerte { get; set; } = 10;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
    public List<MouvementStock> MouvementsStock { get; set; } = new();
}

public class MouvementStock
{
    public int Id { get; set; }
    public int PieceDetacheeId { get; set; }
    public PieceDetachee PieceDetachee { get; set; } = null!;
    public MouvementType Type { get; set; }
    public int Quantite { get; set; }
    public int StockAvant { get; set; }
    public int StockApres { get; set; }
    public string? Raison { get; set; }
    public int? InterventionId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public enum MouvementType
{
    Entree,
    Sortie,
    Correction
}
