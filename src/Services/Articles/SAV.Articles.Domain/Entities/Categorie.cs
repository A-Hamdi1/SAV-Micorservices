namespace SAV.Articles.Domain.Entities;

public class Categorie
{
    public int Id { get; set; }
    public string Nom { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public List<Article> Articles { get; set; } = new();
}
