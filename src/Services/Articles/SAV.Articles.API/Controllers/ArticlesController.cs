using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SAV.Articles.API.Filters;
using SAV.Articles.Application.Interfaces;
using SAV.Shared.Common;
using SAV.Shared.DTOs.Articles;

namespace SAV.Articles.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ArticlesController : ControllerBase
{
    private readonly IArticleService _articleService;
    private readonly ILogger<ArticlesController> _logger;

    public ArticlesController(IArticleService articleService, ILogger<ArticlesController> logger)
    {
        _articleService = articleService;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<ArticleListDto>>> GetArticles(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? search = null,
        [FromQuery] string? categorie = null)
    {
        try
        {
            var result = await _articleService.GetAllArticlesAsync(page, pageSize, search, categorie);
            
            return Ok(new ApiResponse<ArticleListDto>
            {
                Success = true,
                Data = result,
                Message = "Articles récupérés avec succès"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting articles");
            return StatusCode(500, new ApiResponse<ArticleListDto>
            {
                Success = false,
                Message = "Une erreur s'est produite",
                Errors = new List<string> { ex.Message }
            });
        }
    }

    [HttpGet("{id}")]
    [ApiKeyAuth] // Sécurisé pour la communication inter-services
    public async Task<ActionResult<ApiResponse<ArticleDto>>> GetArticle(int id)
    {
        try
        {
            var article = await _articleService.GetArticleByIdAsync(id);
            
            if (article == null)
            {
                return NotFound(new ApiResponse<ArticleDto>
                {
                    Success = false,
                    Message = "Article non trouvé"
                });
            }

            return Ok(new ApiResponse<ArticleDto>
            {
                Success = true,
                Data = article,
                Message = "Article récupéré avec succès"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting article {Id}", id);
            return StatusCode(500, new ApiResponse<ArticleDto>
            {
                Success = false,
                Message = "Une erreur s'est produite",
                Errors = new List<string> { ex.Message }
            });
        }
    }

    [HttpPost]
    [Authorize(Roles = "ResponsableSAV")]
    public async Task<ActionResult<ApiResponse<ArticleDto>>> CreateArticle([FromBody] CreateArticleDto dto)
    {
        try
        {
            var article = await _articleService.CreateArticleAsync(dto);
            
            return CreatedAtAction(nameof(GetArticle), new { id = article.Id }, new ApiResponse<ArticleDto>
            {
                Success = true,
                Data = article,
                Message = "Article créé avec succès"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating article");
            return StatusCode(500, new ApiResponse<ArticleDto>
            {
                Success = false,
                Message = "Une erreur s'est produite",
                Errors = new List<string> { ex.Message }
            });
        }
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "ResponsableSAV")]
    public async Task<ActionResult<ApiResponse<ArticleDto>>> UpdateArticle(int id, [FromBody] UpdateArticleDto dto)
    {
        try
        {
            var article = await _articleService.UpdateArticleAsync(id, dto);
            
            if (article == null)
            {
                return NotFound(new ApiResponse<ArticleDto>
                {
                    Success = false,
                    Message = "Article non trouvé"
                });
            }

            return Ok(new ApiResponse<ArticleDto>
            {
                Success = true,
                Data = article,
                Message = "Article mis à jour avec succès"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating article {Id}", id);
            return StatusCode(500, new ApiResponse<ArticleDto>
            {
                Success = false,
                Message = "Une erreur s'est produite",
                Errors = new List<string> { ex.Message }
            });
        }
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "ResponsableSAV")]
    public async Task<ActionResult<ApiResponse>> DeleteArticle(int id)
    {
        try
        {
            var result = await _articleService.DeleteArticleAsync(id);
            
            if (!result)
            {
                return NotFound(new ApiResponse
                {
                    Success = false,
                    Message = "Article non trouvé"
                });
            }

            return Ok(new ApiResponse
            {
                Success = true,
                Message = "Article supprimé avec succès"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting article {Id}", id);
            return StatusCode(500, new ApiResponse
            {
                Success = false,
                Message = "Une erreur s'est produite",
                Errors = new List<string> { ex.Message }
            });
        }
    }

    [HttpGet("{id}/pieces-detachees")]
    public async Task<ActionResult<ApiResponse<List<PieceDetacheeDto>>>> GetPiecesDetachees(int id)
    {
        try
        {
            var pieces = await _articleService.GetPiecesDetacheesAsync(id);
            
            return Ok(new ApiResponse<List<PieceDetacheeDto>>
            {
                Success = true,
                Data = pieces,
                Message = "Pièces détachées récupérées avec succès"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting pieces detachees for article {Id}", id);
            return StatusCode(500, new ApiResponse<List<PieceDetacheeDto>>
            {
                Success = false,
                Message = "Une erreur s'est produite",
                Errors = new List<string> { ex.Message }
            });
        }
    }

    [HttpGet("stats")]
    [Authorize(Roles = "ResponsableSAV")]
    public async Task<ActionResult<ApiResponse<ArticleStatsDto>>> GetArticlesStats()
    {
        try
        {
            var stats = await _articleService.GetArticlesStatsAsync();

            return Ok(new ApiResponse<ArticleStatsDto>
            {
                Success = true,
                Data = stats,
                Message = "Statistiques des articles récupérées avec succès"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting articles stats");
            return StatusCode(500, new ApiResponse<ArticleStatsDto>
            {
                Success = false,
                Message = "Une erreur s'est produite",
                Errors = new List<string> { ex.Message }
            });
        }
    }
}
