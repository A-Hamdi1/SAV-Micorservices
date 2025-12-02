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

    public async Task<bool> IsUnderWarrantyAsync(int articleAchatId)
    {
        var articleAchat = await _context.ArticlesAchetes.FindAsync(articleAchatId);
        return articleAchat?.SousGarantie ?? false;
    }

    public async Task<List<ArticleAchatDto>> GetAllArticlesAchatesAsync(int? clientId = null, bool? sousGarantie = null)
    {
        var query = _context.ArticlesAchetes
            .Include(a => a.Client)
            .AsQueryable();

        if (clientId.HasValue)
        {
            query = query.Where(a => a.ClientId == clientId.Value);
        }

        if (sousGarantie.HasValue)
        {
            query = query.Where(a => a.SousGarantie == sousGarantie.Value);
        }

        var articlesAchetes = await query
            .OrderByDescending(a => a.DateAchat)
            .ToListAsync();

        var result = new List<ArticleAchatDto>();

        foreach (var articleAchat in articlesAchetes)
        {
            var articleInfo = await _articlesApiClient.GetArticleByIdAsync(articleAchat.ArticleId);
            
            result.Add(new ArticleAchatDto
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

        return result;
    }

    public async Task<ArticleAchatDto?> GetArticleAchatByIdAsync(int id)
    {
        var articleAchat = await _context.ArticlesAchetes
            .Include(a => a.Client)
            .FirstOrDefaultAsync(a => a.Id == id);

        if (articleAchat == null)
            return null;

        var articleInfo = await _articlesApiClient.GetArticleByIdAsync(articleAchat.ArticleId);
        
        return new ArticleAchatDto
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
        };
    }

    public async Task<List<ArticleAchatDto>> GetArticlesByClientIdAsync(int clientId)
    {
        var articlesAchetes = await _context.ArticlesAchetes
            .Where(a => a.ClientId == clientId)
            .OrderByDescending(a => a.DateAchat)
            .ToListAsync();

        var result = new List<ArticleAchatDto>();

        foreach (var articleAchat in articlesAchetes)
        {
            var articleInfo = await _articlesApiClient.GetArticleByIdAsync(articleAchat.ArticleId);
            
            result.Add(new ArticleAchatDto
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

        return result;
    }

    public async Task<List<ArticleAchatDto>> GetArticlesSousGarantieByClientIdAsync(int clientId)
    {
        var articlesAchetes = await _context.ArticlesAchetes
            .Where(a => a.ClientId == clientId)
            .OrderByDescending(a => a.DateAchat)
            .ToListAsync();

        // Filter by warranty status in memory since SousGarantie is a calculated property
        var articlesUnderWarranty = articlesAchetes.Where(a => a.SousGarantie).ToList();

        var result = new List<ArticleAchatDto>();

        foreach (var articleAchat in articlesUnderWarranty)
        {
            var articleInfo = await _articlesApiClient.GetArticleByIdAsync(articleAchat.ArticleId);
            
            result.Add(new ArticleAchatDto
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

        return result;
    }

    public async Task<ArticleAchatDto?> GetArticleByNumeroSerieAsync(string numeroSerie)
    {
        var articleAchat = await _context.ArticlesAchetes
            .Include(a => a.Client)
            .FirstOrDefaultAsync(a => a.NumeroSerie == numeroSerie);

        if (articleAchat == null)
            return null;

        var articleInfo = await _articlesApiClient.GetArticleByIdAsync(articleAchat.ArticleId);
        
        return new ArticleAchatDto
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
        };
    }

    public async Task<ArticleAchatDto?> UpdateArticleAchatAsync(int id, UpdateArticleAchatDto dto)
    {
        var articleAchat = await _context.ArticlesAchetes
            .Include(a => a.Client)
            .FirstOrDefaultAsync(a => a.Id == id);

        if (articleAchat == null)
            return null;

        // Récupérer les infos de l'article pour recalculer la garantie
        var articleInfo = await _articlesApiClient.GetArticleByIdAsync(articleAchat.ArticleId);
        if (articleInfo == null)
            return null;

        articleAchat.DateAchat = dto.DateAchat;
        articleAchat.NumeroSerie = dto.NumeroSerie;
        articleAchat.DureeGarantieJours = articleInfo.DureeGarantie * 30; // Recalcul

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

    public async Task<bool> DeleteArticleAchatAsync(int id)
    {
        var articleAchat = await _context.ArticlesAchetes
            .Include(a => a.Reclamations)
            .FirstOrDefaultAsync(a => a.Id == id);

        if (articleAchat == null)
            return false;

        // Ne pas supprimer si l'article a des réclamations
        if (articleAchat.Reclamations.Any())
            return false;

        _context.ArticlesAchetes.Remove(articleAchat);
        await _context.SaveChangesAsync();

        return true;
    }

    public async Task<ArticleAchatStatsDto> GetGarantieStatsAsync()
    {
        var articlesAchetes = await _context.ArticlesAchetes
            .Include(a => a.Client)
            .ToListAsync();

        var nombreTotal = articlesAchetes.Count;
        var nombreSousGarantie = articlesAchetes.Count(a => a.SousGarantie);
        var nombreHorsGarantie = nombreTotal - nombreSousGarantie;
        var pourcentage = nombreTotal > 0 ? Math.Round((decimal)nombreSousGarantie / nombreTotal * 100, 2) : 0;

        // Articles sous garantie expirant dans les 30 prochains jours
        var garantiesExpirant = new List<ArticleAchatExpirationDto>();

        foreach (var article in articlesAchetes.Where(a => a.SousGarantie))
        {
            var dateExpiration = article.DateAchat.AddDays(article.DureeGarantieJours);
            var joursRestants = (int)(dateExpiration - DateTime.UtcNow).TotalDays;

            if (joursRestants >= 0 && joursRestants <= 30)
            {
                var articleInfo = await _articlesApiClient.GetArticleByIdAsync(article.ArticleId);
                
                garantiesExpirant.Add(new ArticleAchatExpirationDto
                {
                    Id = article.Id,
                    ClientNom = $"{article.Client.Prenom} {article.Client.Nom}",
                    ArticleNom = articleInfo?.Nom ?? "Article introuvable",
                    NumeroSerie = article.NumeroSerie,
                    DateExpiration = dateExpiration,
                    JoursRestants = joursRestants
                });
            }
        }

        return new ArticleAchatStatsDto
        {
            NombreTotalArticles = nombreTotal,
            NombreArticlesSousGarantie = nombreSousGarantie,
            NombreArticlesHorsGarantie = nombreHorsGarantie,
            PourcentageSousGarantie = pourcentage,
            GarantiesExpirantProchainement = garantiesExpirant.OrderBy(g => g.JoursRestants).ToList()
        };
    }
}
