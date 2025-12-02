using SAV.Shared.DTOs.Clients;

namespace SAV.Clients.Application.Interfaces;

public interface IArticleAchatService
{
    Task<List<ArticleAchatDto>> GetClientArticlesAsync(string userId);
    Task<ArticleAchatDto?> CreateArticleAchatAsync(string userId, CreateArticleAchatDto dto);
    Task<bool> IsUnderWarrantyAsync(int articleAchatId);
    Task<List<ArticleAchatDto>> GetAllArticlesAchatesAsync(int? clientId = null, bool? sousGarantie = null);
    Task<ArticleAchatDto?> GetArticleAchatByIdAsync(int id);
    Task<List<ArticleAchatDto>> GetArticlesByClientIdAsync(int clientId);
    Task<List<ArticleAchatDto>> GetArticlesSousGarantieByClientIdAsync(int clientId);
    Task<ArticleAchatDto?> GetArticleByNumeroSerieAsync(string numeroSerie);
    Task<ArticleAchatDto?> UpdateArticleAchatAsync(int id, UpdateArticleAchatDto dto);
    Task<bool> DeleteArticleAchatAsync(int id);
    Task<ArticleAchatStatsDto> GetGarantieStatsAsync();
}
