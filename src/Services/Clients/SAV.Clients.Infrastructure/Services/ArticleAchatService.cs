using Microsoft.EntityFrameworkCore;
using SAV.Clients.Application.Interfaces;
using SAV.Clients.Infrastructure.Data;
using SAV.Shared.DTOs.Clients;

namespace SAV.Clients.Infrastructure.Services;

public class ArticleAchatService : IArticleAchatService
{
    private readonly ClientsDbContext _context;
    private readonly IArticlesApiClient _articlesApiClient;

    public ArticleAchatService(ClientsDbContext context, IArticlesApiClient articlesApiClient)
    {
        _context = context;
        _articlesApiClient = articlesApiClient;
    }

    public async Task<List<ArticleAchatDto>> GetClientArticlesAsync(string userId)
    {
        var client = await _context.Clients
            .Include(c => c.ArticlesAchetes)
            .FirstOrDefaultAsync(c => c.UserId == userId);

        if (client == null)
            return new List<ArticleAchatDto>();

        var articles = new List<ArticleAchatDto>();

        foreach (var articleAchat in client.ArticlesAchetes)
        {
            var articleInfo = await _articlesApiClient.GetArticleByIdAsync(articleAchat.ArticleId);
            
            articles.Add(new ArticleAchatDto
            {
                Id = articleAchat.Id,
                ClientId = articleAchat.ClientId,
                ArticleId = articleAchat.ArticleId,
                ArticleNom = articleInfo?.Nom ?? "Article introuvable",
                ArticleReference = articleInfo?.Reference ?? "",
                DateAchat = articleAchat.DateAchat,
                NumeroSerie = articleAchat.NumeroSerie,
                SousGarantie = articleAchat.SousGarantie,
                DureeGarantieJours = articleAchat.DureeGarantieJours
            });
        }

        return articles;
    }

    public async Task<ArticleAchatDto?> CreateArticleAchatAsync(string userId, CreateArticleAchatDto dto)
    {
        var client = await _context.Clients
            .FirstOrDefaultAsync(c => c.UserId == userId);

        if (client == null)
            return null;

        var articleInfo = await _articlesApiClient.GetArticleByIdAsync(dto.ArticleId);
        if (articleInfo == null)
            return null;

        var articleAchat = new Domain.Entities.ArticleAchat
        {
            ClientId = client.Id,
            ArticleId = dto.ArticleId,
            DateAchat = dto.DateAchat,
            NumeroSerie = dto.NumeroSerie,
            DureeGarantieJours = articleInfo.DureeGarantie * 30 // Conversion mois -> jours
        };

        _context.ArticlesAchetes.Add(articleAchat);
        await _context.SaveChangesAsync();

        return new ArticleAchatDto
        {
            Id = articleAchat.Id,
            ClientId = articleAchat.ClientId,
            ArticleId = articleAchat.ArticleId,
            ArticleNom = articleInfo.Nom,
            ArticleReference = articleInfo.Reference,
            DateAchat = articleAchat.DateAchat,
            NumeroSerie = articleAchat.NumeroSerie,
            SousGarantie = articleAchat.SousGarantie,
            DureeGarantieJours = articleAchat.DureeGarantieJours
        };
    }
}
