using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
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

    public ArticlesAchetesController(IArticleAchatService articleAchatService)
    {
        _articleAchatService = articleAchatService;
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
}
