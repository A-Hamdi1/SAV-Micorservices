namespace SAV.Clients.Domain.Entities;

public class Client
{
    public int Id { get; set; }
    public string UserId { get; set; } = string.Empty;
    public string Nom { get; set; } = string.Empty;
    public string Prenom { get; set; } = string.Empty;
    public string Telephone { get; set; } = string.Empty;
    public string Adresse { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public List<ArticleAchat> ArticlesAchetes { get; set; } = new();
    public List<Reclamation> Reclamations { get; set; } = new();
}
