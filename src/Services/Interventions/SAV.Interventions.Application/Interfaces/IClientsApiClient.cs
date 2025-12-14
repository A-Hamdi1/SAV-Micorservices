namespace SAV.Interventions.Application.Interfaces;

public interface IClientsApiClient
{
    Task<ReclamationApiDto?> GetReclamationByIdAsync(int reclamationId);
    Task<bool> IsArticleUnderWarrantyAsync(int articleAchatId);
    Task<bool> UpdateReclamationStatutAsync(int reclamationId, string statut);
}

public class ReclamationApiDto
{
    public int Id { get; set; }
    public int ClientId { get; set; }
    public int ArticleAchatId { get; set; }
    public string Description { get; set; } = string.Empty;
    public string Statut { get; set; } = string.Empty;
}
