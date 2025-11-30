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
}
