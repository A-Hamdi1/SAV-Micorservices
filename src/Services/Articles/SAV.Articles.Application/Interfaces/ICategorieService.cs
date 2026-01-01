using SAV.Shared.DTOs.Articles;

namespace SAV.Articles.Application.Interfaces;

public interface ICategorieService
{
    Task<IEnumerable<CategorieDto>> GetAllAsync();
    Task<CategorieDto?> GetByIdAsync(int id);
    Task<CategorieDto> CreateAsync(CreateCategorieDto dto);
    Task<CategorieDto?> UpdateAsync(int id, UpdateCategorieDto dto);
    Task<bool> DeleteAsync(int id);
}
