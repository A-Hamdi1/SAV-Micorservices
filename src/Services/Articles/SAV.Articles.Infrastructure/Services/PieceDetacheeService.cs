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
            Stock = dto.Stock
        };

        _context.PiecesDetachees.Add(piece);
        await _context.SaveChangesAsync();

        return new PieceDetacheeDto
        {
            Id = piece.Id,
            ArticleId = piece.ArticleId,
            Nom = piece.Nom,
            Reference = piece.Reference,
            Prix = piece.Prix,
            Stock = piece.Stock
        };
    }

    public async Task<PieceDetacheeDto?> GetPieceDetacheeByIdAsync(int id)
    {
        var piece = await _context.PiecesDetachees.FindAsync(id);
        
        if (piece == null)
        {
            return null;
        }

        return new PieceDetacheeDto
        {
            Id = piece.Id,
            ArticleId = piece.ArticleId,
            Nom = piece.Nom,
            Reference = piece.Reference,
            Prix = piece.Prix,
            Stock = piece.Stock
        };
    }
}
