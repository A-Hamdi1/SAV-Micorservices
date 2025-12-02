namespace SAV.Clients.Domain.Entities;

public class ArticleAchat
{
    public int Id { get; set; }
    public int ClientId { get; set; }
    public Client? Client { get; set; }
    public int ArticleId { get; set; }
    public DateTime DateAchat { get; set; }
    public string NumeroSerie { get; set; } = string.Empty;
    public int DureeGarantieJours { get; set; }
    public bool SousGarantie => (DateTime.UtcNow - DateAchat).TotalDays < DureeGarantieJours;
    public List<Reclamation> Reclamations { get; set; } = new();
}
