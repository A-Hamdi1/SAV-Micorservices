using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SAV.Clients.API.Filters;
using SAV.Clients.Application.Interfaces;
using SAV.Shared.Common;
using SAV.Shared.DTOs.Clients;
using System.Security.Claims;

namespace SAV.Clients.API.Controllers;

[ApiController]
[Route("api/articles-achetes")]
public class ArticlesAchetesController : ControllerBase
{
    private readonly IArticleAchatService _articleAchatService;
    private readonly ILogger<ArticlesAchetesController> _logger;

    public ArticlesAchetesController(
        IArticleAchatService articleAchatService,
        ILogger<ArticlesAchetesController> logger)
    {
        _articleAchatService = articleAchatService;
        _logger = logger;
    }

    [HttpGet("me")]
    [Authorize(Roles = "Client")]
    public async Task<ActionResult<ApiResponse<List<ArticleAchatDto>>>> GetMyArticles()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized(new ApiResponse<List<ArticleAchatDto>>
            {
                Success = false,
                Message = "Utilisateur non authentifié"
            });
        }

        var articles = await _articleAchatService.GetClientArticlesAsync(userId);
        
        return Ok(new ApiResponse<List<ArticleAchatDto>>
        {
            Success = true,
            Data = articles
        });
    }

    [HttpPost("me")]
    [Authorize(Roles = "Client")]
    public async Task<ActionResult<ApiResponse<ArticleAchatDto>>> CreateArticleAchat([FromBody] CreateArticleAchatDto dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized(new ApiResponse<ArticleAchatDto>
            {
                Success = false,
                Message = "Utilisateur non authentifié"
            });
        }

        var article = await _articleAchatService.CreateArticleAchatAsync(userId, dto);
        
        if (article == null)
        {
            return BadRequest(new ApiResponse<ArticleAchatDto>
            {
                Success = false,
                Message = "Impossible d'enregistrer l'article acheté"
            });
        }

        return CreatedAtAction(nameof(GetMyArticles), new ApiResponse<ArticleAchatDto>
        {
            Success = true,
            Data = article,
            Message = "Article acheté enregistré avec succès"
        });
    }

    [HttpGet("{id}/garantie")]
    [AllowApiKeyOrJwt]
    public async Task<ActionResult<ApiResponse<bool>>> CheckGarantie(int id)
    {
        try
        {
            var isUnderWarranty = await _articleAchatService.IsUnderWarrantyAsync(id);
            
            return Ok(new ApiResponse<bool>
            {
                Success = true,
                Data = isUnderWarranty,
                Message = isUnderWarranty ? "Article sous garantie" : "Article hors garantie"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking warranty for article achat {Id}", id);
            return StatusCode(500, new ApiResponse<bool>
            {
                Success = false,
                Message = "Une erreur s'est produite",
                Errors = new List<string> { ex.Message }
            });
        }
    }

    [HttpGet]
    [Authorize(Roles = "ResponsableSAV")]
    public async Task<ActionResult<ApiResponse<List<ArticleAchatDto>>>> GetAllArticlesAchates(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] int? clientId = null,
        [FromQuery] bool? sousGarantie = null)
    {
        var articles = await _articleAchatService.GetAllArticlesAchatesAsync(clientId, sousGarantie);

        return Ok(new ApiResponse<List<ArticleAchatDto>>
        {
            Success = true,
            Data = articles,
            Message = $"{articles.Count} article(s) acheté(s) trouvé(s)"
        });
    }

    [HttpGet("{id}")]
    [Authorize(Roles = "ResponsableSAV")]
    public async Task<ActionResult<ApiResponse<ArticleAchatDto>>> GetArticleAchatById(int id)
    {
        var article = await _articleAchatService.GetArticleAchatByIdAsync(id);

        if (article == null)
        {
            return NotFound(new ApiResponse<ArticleAchatDto>
            {
                Success = false,
                Message = "Article acheté non trouvé"
            });
        }

        return Ok(new ApiResponse<ArticleAchatDto>
        {
            Success = true,
            Data = article
        });
    }

    [HttpGet("client/{clientId}")]
    [Authorize(Roles = "ResponsableSAV")]
    public async Task<ActionResult<ApiResponse<List<ArticleAchatDto>>>> GetArticlesByClientId(int clientId)
    {
        var articles = await _articleAchatService.GetArticlesByClientIdAsync(clientId);

        return Ok(new ApiResponse<List<ArticleAchatDto>>
        {
            Success = true,
            Data = articles,
            Message = $"{articles.Count} article(s) trouvé(s) pour ce client"
        });
    }

    [HttpGet("client/{clientId}/garantie")]
    [Authorize(Roles = "ResponsableSAV")]
    public async Task<ActionResult<ApiResponse<List<ArticleAchatDto>>>> GetArticlesSousGarantieByClientId(int clientId)
    {
        var articles = await _articleAchatService.GetArticlesSousGarantieByClientIdAsync(clientId);

        return Ok(new ApiResponse<List<ArticleAchatDto>>
        {
            Success = true,
            Data = articles,
            Message = $"{articles.Count} article(s) sous garantie pour ce client"
        });
    }

    [HttpGet("garantie/{numeroSerie}")]
    [Authorize(Roles = "ResponsableSAV")]
    public async Task<ActionResult<ApiResponse<ArticleAchatDto>>> GetArticleByNumeroSerie(string numeroSerie)
    {
        var article = await _articleAchatService.GetArticleByNumeroSerieAsync(numeroSerie);

        if (article == null)
        {
            return NotFound(new ApiResponse<ArticleAchatDto>
            {
                Success = false,
                Message = "Article non trouvé avec ce numéro de série"
            });
        }

        return Ok(new ApiResponse<ArticleAchatDto>
        {
            Success = true,
            Data = article,
            Message = article.SousGarantie ? "Article sous garantie" : "Article hors garantie"
        });
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "ResponsableSAV")]
    public async Task<ActionResult<ApiResponse<ArticleAchatDto>>> UpdateArticleAchat(
        int id,
        [FromBody] UpdateArticleAchatDto dto)
    {
        var article = await _articleAchatService.UpdateArticleAchatAsync(id, dto);

        if (article == null)
        {
            return NotFound(new ApiResponse<ArticleAchatDto>
            {
                Success = false,
                Message = "Article acheté non trouvé"
            });
        }

        return Ok(new ApiResponse<ArticleAchatDto>
        {
            Success = true,
            Data = article,
            Message = "Article acheté mis à jour avec succès"
        });
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "ResponsableSAV")]
    public async Task<ActionResult<ApiResponse>> DeleteArticleAchat(int id)
    {
        var result = await _articleAchatService.DeleteArticleAchatAsync(id);

        if (!result)
        {
            return BadRequest(new ApiResponse
            {
                Success = false,
                Message = "Impossible de supprimer l'article. Il a peut-être des réclamations associées."
            });
        }

        return Ok(new ApiResponse
        {
            Success = true,
            Message = "Article acheté supprimé avec succès"
        });
    }

    [HttpGet("stats/garanties")]
    [Authorize(Roles = "ResponsableSAV")]
    public async Task<ActionResult<ApiResponse<ArticleAchatStatsDto>>> GetGarantieStats()
    {
        var stats = await _articleAchatService.GetGarantieStatsAsync();

        return Ok(new ApiResponse<ArticleAchatStatsDto>
        {
            Success = true,
            Data = stats,
            Message = "Statistiques des garanties récupérées avec succès"
        });
    }
}
