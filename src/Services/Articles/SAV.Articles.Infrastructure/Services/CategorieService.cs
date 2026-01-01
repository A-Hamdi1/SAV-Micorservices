using Microsoft.EntityFrameworkCore;
using SAV.Articles.Application.Interfaces;
using SAV.Articles.Domain.Entities;
using SAV.Articles.Infrastructure.Data;
using SAV.Shared.DTOs.Articles;

namespace SAV.Articles.Infrastructure.Services;

public class CategorieService : ICategorieService
{
    private readonly ArticlesDbContext _context;

    public CategorieService(ArticlesDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<CategorieDto>> GetAllAsync()
    {
        return await _context.Categories
            .Include(c => c.Articles)
            .Select(c => new CategorieDto(
                c.Id,
                c.Nom,
                c.Description,
                c.CreatedAt,
                c.Articles.Count
            ))
            .ToListAsync();
    }

    public async Task<CategorieDto?> GetByIdAsync(int id)
    {
        var categorie = await _context.Categories
            .Include(c => c.Articles)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (categorie == null) return null;

        return new CategorieDto(
            categorie.Id,
            categorie.Nom,
            categorie.Description,
            categorie.CreatedAt,
            categorie.Articles.Count
        );
    }

    public async Task<CategorieDto> CreateAsync(CreateCategorieDto dto)
    {
        var categorie = new Categorie
        {
            Nom = dto.Nom,
            Description = dto.Description,
            CreatedAt = DateTime.UtcNow
        };

        _context.Categories.Add(categorie);
        await _context.SaveChangesAsync();

        return new CategorieDto(
            categorie.Id,
            categorie.Nom,
            categorie.Description,
            categorie.CreatedAt,
            0
        );
    }

    public async Task<CategorieDto?> UpdateAsync(int id, UpdateCategorieDto dto)
    {
        var categorie = await _context.Categories
            .Include(c => c.Articles)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (categorie == null) return null;

        categorie.Nom = dto.Nom;
        categorie.Description = dto.Description;

        await _context.SaveChangesAsync();

        return new CategorieDto(
            categorie.Id,
            categorie.Nom,
            categorie.Description,
            categorie.CreatedAt,
            categorie.Articles.Count
        );
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var categorie = await _context.Categories.FindAsync(id);
        if (categorie == null) return false;

        _context.Categories.Remove(categorie);
        await _context.SaveChangesAsync();
        return true;
    }
}
