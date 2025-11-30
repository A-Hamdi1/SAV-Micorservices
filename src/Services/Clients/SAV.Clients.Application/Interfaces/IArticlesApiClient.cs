namespace SAV.Clients.Application.Interfaces;

public interface IArticlesApiClient
{
    Task<ArticleApiDto?> GetArticleByIdAsync(int articleId);
}

public class ArticleApiDto
{
    public int Id { get; set; }
    public string Reference { get; set; } = string.Empty;
    public string Nom { get; set; } = string.Empty;
    public string Categorie { get; set; } = string.Empty;
    public decimal PrixVente { get; set; }
    public int DureeGarantie { get; set; }
}
