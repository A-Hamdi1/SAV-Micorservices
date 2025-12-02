using SAV.Shared.DTOs.Articles;

namespace SAV.Articles.Application.Interfaces;

public interface IArticleService
{
    Task<ArticleListDto> GetAllArticlesAsync(int page, int pageSize, string? search, string? categorie);
    Task<ArticleDto?> GetArticleByIdAsync(int id);
    Task<ArticleDto> CreateArticleAsync(CreateArticleDto dto);
    Task<ArticleDto?> UpdateArticleAsync(int id, UpdateArticleDto dto);
    Task<bool> DeleteArticleAsync(int id);
    Task<List<PieceDetacheeDto>> GetPiecesDetacheesAsync(int articleId);
    Task<ArticleStatsDto> GetArticlesStatsAsync();
}
