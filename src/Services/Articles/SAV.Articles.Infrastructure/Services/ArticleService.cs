using Microsoft.EntityFrameworkCore;
using SAV.Articles.Application.Interfaces;
using SAV.Articles.Domain.Entities;
using SAV.Articles.Infrastructure.Data;
using SAV.Shared.DTOs.Articles;

namespace SAV.Articles.Infrastructure.Services;

public class ArticleService : IArticleService
{
    private readonly ArticlesDbContext _context;

    public ArticleService(ArticlesDbContext context)
    {
        _context = context;
    }

    public async Task<ArticleListDto> GetAllArticlesAsync(int page, int pageSize, string? search, string? categorie)
    {
        var query = _context.Articles.AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            query = query.Where(a => a.Nom.Contains(search) || a.Reference.Contains(search));
        }

        if (!string.IsNullOrWhiteSpace(categorie))
        {
            query = query.Where(a => a.Categorie == categorie);
        }

        var totalCount = await query.CountAsync();
        var items = await query
            .OrderByDescending(a => a.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(a => new ArticleDto
            {
                Id = a.Id,
                Reference = a.Reference,
                Nom = a.Nom,
                Categorie = a.Categorie,
                PrixVente = a.PrixVente,
                DureeGarantie = a.DureeGarantie,
                CreatedAt = a.CreatedAt
            })
            .ToListAsync();

        return new ArticleListDto
        {
            Items = items,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<ArticleDto?> GetArticleByIdAsync(int id)
    {
        var article = await _context.Articles.FindAsync(id);
        
        if (article == null)
        {
            return null;
        }

        return new ArticleDto
        {
            Id = article.Id,
            Reference = article.Reference,
            Nom = article.Nom,
            Categorie = article.Categorie,
            PrixVente = article.PrixVente,
            DureeGarantie = article.DureeGarantie,
            CreatedAt = article.CreatedAt
        };
    }

    public async Task<ArticleDto> CreateArticleAsync(CreateArticleDto dto)
    {
        var article = new Article
        {
            Reference = dto.Reference,
            Nom = dto.Nom,
            Categorie = dto.Categorie,
            PrixVente = dto.PrixVente,
            DureeGarantie = dto.DureeGarantie
        };

        _context.Articles.Add(article);
        await _context.SaveChangesAsync();

        return new ArticleDto
        {
            Id = article.Id,
            Reference = article.Reference,
            Nom = article.Nom,
            Categorie = article.Categorie,
            PrixVente = article.PrixVente,
            DureeGarantie = article.DureeGarantie,
            CreatedAt = article.CreatedAt
        };
    }

    public async Task<ArticleDto?> UpdateArticleAsync(int id, UpdateArticleDto dto)
    {
        var article = await _context.Articles.FindAsync(id);
        
        if (article == null)
        {
            return null;
        }

        article.Nom = dto.Nom;
        article.Categorie = dto.Categorie;
        article.PrixVente = dto.PrixVente;
        article.DureeGarantie = dto.DureeGarantie;

        await _context.SaveChangesAsync();

        return new ArticleDto
        {
            Id = article.Id,
            Reference = article.Reference,
            Nom = article.Nom,
            Categorie = article.Categorie,
            PrixVente = article.PrixVente,
            DureeGarantie = article.DureeGarantie,
            CreatedAt = article.CreatedAt
        };
    }

    public async Task<bool> DeleteArticleAsync(int id)
    {
        var article = await _context.Articles.FindAsync(id);
        
        if (article == null)
        {
            return false;
        }

        _context.Articles.Remove(article);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<List<PieceDetacheeDto>> GetPiecesDetacheesAsync(int articleId)
    {
        return await _context.PiecesDetachees
            .Where(p => p.ArticleId == articleId)
            .Select(p => new PieceDetacheeDto
            {
                Id = p.Id,
                ArticleId = p.ArticleId,
                Nom = p.Nom,
                Reference = p.Reference,
                Prix = p.Prix,
                Stock = p.Stock,
                EstEnAlerte = p.Stock <= p.SeuilAlerte
            })
            .ToListAsync();
    }

    public async Task<ArticleStatsDto> GetArticlesStatsAsync()
    {
        var articles = await _context.Articles.ToListAsync();
        var piecesDetachees = await _context.PiecesDetachees.ToListAsync();

        var nombreTotalArticles = articles.Count;
        var nombrePiecesDetachees = piecesDetachees.Count;
        var valeurStockTotal = piecesDetachees.Sum(p => p.Prix * p.Stock);
        var prixMoyenArticle = articles.Any() ? articles.Average(a => a.PrixVente) : 0;

        // Stats par catégorie
        var parCategorie = articles
            .GroupBy(a => a.Categorie)
            .Select(g => new ArticleCategoryStatsDto
            {
                Categorie = g.Key,
                Nombre = g.Count(),
                PrixMoyen = Math.Round(g.Average(a => a.PrixVente), 2)
            })
            .OrderByDescending(c => c.Nombre)
            .ToList();

        // Top articles (pour l'instant, on retourne simplement les plus récents)
        // Dans une vraie implémentation, on irait chercher les données de ventes
        var articlesLesPlusVendus = articles
            .OrderByDescending(a => a.CreatedAt)
            .Take(10)
            .Select(a => new ArticleTopDto
            {
                Id = a.Id,
                Nom = a.Nom,
                Reference = a.Reference,
                Categorie = a.Categorie,
                NombreVentes = 0 // TODO: À implémenter avec les vraies données de ventes
            })
            .ToList();

        return new ArticleStatsDto
        {
            NombreTotalArticles = nombreTotalArticles,
            NombrePiecesDetachees = nombrePiecesDetachees,
            ValeurStockTotal = valeurStockTotal,
            PrixMoyenArticle = Math.Round(prixMoyenArticle, 2),
            ParCategorie = parCategorie,
            ArticlesLesPlusVendus = articlesLesPlusVendus
        };
    }
}
