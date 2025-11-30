using SAV.Shared.DTOs.Clients;

namespace SAV.Clients.Application.Interfaces;

public interface IArticleAchatService
{
    Task<List<ArticleAchatDto>> GetClientArticlesAsync(string userId);
    Task<ArticleAchatDto?> CreateArticleAchatAsync(string userId, CreateArticleAchatDto dto);
}
