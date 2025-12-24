using Microsoft.EntityFrameworkCore;
using SAV.Articles.Application.Interfaces;
using SAV.Articles.Domain.Entities;
using SAV.Articles.Infrastructure.Data;
using SAV.Shared.DTOs.Articles;

namespace SAV.Articles.Infrastructure.Services;

public class PieceDetacheeService : IPieceDetacheeService
{
    private readonly ArticlesDbContext _context;

    public PieceDetacheeService(ArticlesDbContext context)
    {
        _context = context;
    }

    public async Task<PieceDetacheeDto> CreatePieceDetacheeAsync(CreatePieceDetacheeDto dto)
    {
        var piece = new PieceDetachee
        {
            ArticleId = dto.ArticleId,
            Nom = dto.Nom,
            Reference = dto.Reference,
            Prix = dto.Prix,
            Stock = dto.Stock,
            SeuilAlerte = 10
        };

        _context.PiecesDetachees.Add(piece);
        await _context.SaveChangesAsync();

        // Enregistrer mouvement initial
        await EnregistrerMouvementAsync(piece.Id, MouvementType.Entree, dto.Stock, 0, dto.Stock, "Stock initial");

        return MapToDto(piece);
    }

    public async Task<PieceDetacheeDto?> GetPieceDetacheeByIdAsync(int id)
    {
        var piece = await _context.PiecesDetachees.FindAsync(id);
        return piece == null ? null : MapToDto(piece);
    }

    public async Task<IEnumerable<PieceDetacheeDto>> GetAllPiecesDetacheesAsync()
    {
        var pieces = await _context.PiecesDetachees
            .Include(p => p.Article)
            .OrderBy(p => p.Nom)
            .ToListAsync();
        
        return pieces.Select(MapToDto);
    }

    public async Task<IEnumerable<PieceDetacheeDto>> GetPiecesDetacheesByArticleIdAsync(int articleId)
    {
        var pieces = await _context.PiecesDetachees
            .Where(p => p.ArticleId == articleId)
            .OrderBy(p => p.Nom)
            .ToListAsync();
        
        return pieces.Select(MapToDto);
    }

    public async Task<PieceDetacheeDto?> UpdatePieceDetacheeAsync(int id, UpdatePieceDetacheeDto dto)
    {
        var piece = await _context.PiecesDetachees.FindAsync(id);
        if (piece == null)
            return null;

        if (dto.Nom != null)
            piece.Nom = dto.Nom;
        if (dto.Reference != null)
            piece.Reference = dto.Reference;
        if (dto.Prix.HasValue)
            piece.Prix = dto.Prix.Value;
        if (dto.SeuilAlerte.HasValue)
            piece.SeuilAlerte = dto.SeuilAlerte.Value;
        piece.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return MapToDto(piece);
    }

    public async Task<bool> DeletePieceDetacheeAsync(int id)
    {
        var piece = await _context.PiecesDetachees.FindAsync(id);
        if (piece == null)
            return false;

        _context.PiecesDetachees.Remove(piece);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> ReduceStockAsync(int pieceId, int quantite)
    {
        var piece = await _context.PiecesDetachees.FindAsync(pieceId);
        
        if (piece == null || piece.Stock < quantite)
            return false;

        var stockAvant = piece.Stock;
        piece.Stock -= quantite;
        piece.UpdatedAt = DateTime.UtcNow;

        await EnregistrerMouvementAsync(pieceId, MouvementType.Sortie, quantite, stockAvant, piece.Stock, "Utilisation intervention");
        await _context.SaveChangesAsync();
        
        return true;
    }

    public async Task<bool> AddStockAsync(int pieceId, int quantite)
    {
        var piece = await _context.PiecesDetachees.FindAsync(pieceId);
        
        if (piece == null)
            return false;

        var stockAvant = piece.Stock;
        piece.Stock += quantite;
        piece.UpdatedAt = DateTime.UtcNow;

        await EnregistrerMouvementAsync(pieceId, MouvementType.Entree, quantite, stockAvant, piece.Stock, "Réapprovisionnement");
        await _context.SaveChangesAsync();
        
        return true;
    }

    public async Task<IEnumerable<PieceDetacheeDto>> GetPiecesLowStockAsync(int seuil = 10)
    {
        var pieces = await _context.PiecesDetachees
            .Where(p => p.Stock <= p.SeuilAlerte)
            .OrderBy(p => p.Stock)
            .ToListAsync();
        
        return pieces.Select(MapToDto);
    }

    public async Task<IEnumerable<MouvementStockDto>> GetMouvementsStockAsync(int pieceId)
    {
        var mouvements = await _context.MouvementsStock
            .Include(m => m.PieceDetachee)
            .Where(m => m.PieceDetacheeId == pieceId)
            .OrderByDescending(m => m.CreatedAt)
            .Take(50)
            .ToListAsync();

        return mouvements.Select(m => new MouvementStockDto
        {
            Id = m.Id,
            PieceDetacheeId = m.PieceDetacheeId,
            NomPiece = m.PieceDetachee.Nom,
            TypeMouvement = m.Type.ToString(),
            Quantite = m.Quantite,
            StockAvant = m.StockAvant,
            StockApres = m.StockApres,
            Raison = m.Raison,
            InterventionId = m.InterventionId,
            DateMouvement = m.CreatedAt
        });
    }

    public async Task<StockStatsDto> GetStockStatsAsync()
    {
        var pieces = await _context.PiecesDetachees.Include(p => p.Article).ToListAsync();
        
        var piecesEnAlerte = pieces.Where(p => p.Stock <= p.SeuilAlerte && p.Stock > 0).ToList();
        var piecesRupture = pieces.Where(p => p.Stock == 0).ToList();

        var mouvementsRecents = await _context.MouvementsStock
            .Include(m => m.PieceDetachee)
            .OrderByDescending(m => m.CreatedAt)
            .Take(10)
            .ToListAsync();
        
        return new StockStatsDto
        {
            TotalPieces = pieces.Count,
            TotalStockItems = pieces.Sum(p => p.Stock),
            PiecesEnAlerte = piecesEnAlerte.Count,
            PiecesRuptureStock = piecesRupture.Count,
            ValeurTotaleStock = pieces.Sum(p => p.Stock * p.Prix),
            PiecesLesPlusUtilisees = new List<TopPieceDto>(),
            PiecesEnAlerteDetails = piecesEnAlerte.Select(p => new PieceAlerteDto
            {
                Id = p.Id,
                Nom = p.Nom,
                Reference = p.Reference,
                Stock = p.Stock,
                SeuilAlerte = p.SeuilAlerte,
                ArticleId = p.ArticleId,
                ArticleNom = p.Article?.Nom ?? ""
            }).ToList(),
            MouvementsRecents = mouvementsRecents.Select(m => new MouvementStockRecentDto
            {
                Id = m.Id,
                PieceNom = m.PieceDetachee.Nom,
                TypeMouvement = m.Type.ToString(),
                Quantite = m.Quantite,
                DateMouvement = m.CreatedAt
            }).ToList()
        };
    }

    private async Task EnregistrerMouvementAsync(int pieceId, MouvementType type, int quantite, int stockAvant, int stockApres, string? raison = null, int? interventionId = null)
    {
        var mouvement = new MouvementStock
        {
            PieceDetacheeId = pieceId,
            Type = type,
            Quantite = quantite,
            StockAvant = stockAvant,
            StockApres = stockApres,
            Raison = raison,
            InterventionId = interventionId
        };

        _context.MouvementsStock.Add(mouvement);
        await _context.SaveChangesAsync();
    }

    private static PieceDetacheeDto MapToDto(PieceDetachee piece) => new()
    {
        Id = piece.Id,
        ArticleId = piece.ArticleId,
        Nom = piece.Nom,
        Reference = piece.Reference,
        Prix = piece.Prix,
        Stock = piece.Stock,
        EstEnAlerte = piece.Stock <= piece.SeuilAlerte
    };
}
