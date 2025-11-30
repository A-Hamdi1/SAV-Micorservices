namespace SAV.Clients.Domain.Entities;

public class Reclamation
{
    public int Id { get; set; }
    public int ClientId { get; set; }
    public Client? Client { get; set; }
    public int ArticleAchatId { get; set; }
    public ArticleAchat? ArticleAchat { get; set; }
    public string Description { get; set; } = string.Empty;
    public ReclamationStatut Statut { get; set; } = ReclamationStatut.EnAttente;
    public DateTime DateCreation { get; set; } = DateTime.UtcNow;
    public DateTime? DateResolution { get; set; }
    public string? CommentaireResponsable { get; set; }
}

public enum ReclamationStatut
{
    EnAttente,
    EnCours,
    Resolue,
    Rejetee
}
