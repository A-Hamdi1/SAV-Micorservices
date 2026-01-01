using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SAV.Articles.Application.Interfaces;
using SAV.Shared.Common;
using SAV.Shared.DTOs.Articles;

namespace SAV.Articles.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CategoriesController : ControllerBase
{
    private readonly ICategorieService _categorieService;
    private readonly ILogger<CategoriesController> _logger;

    public CategoriesController(ICategorieService categorieService, ILogger<CategoriesController> logger)
    {
        _categorieService = categorieService;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<IEnumerable<CategorieDto>>>> GetCategories()
    {
        try
        {
            var categories = await _categorieService.GetAllAsync();
            return Ok(new ApiResponse<IEnumerable<CategorieDto>>
            {
                Success = true,
                Data = categories,
                Message = "Catégories récupérées avec succès"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting categories");
            return StatusCode(500, new ApiResponse<IEnumerable<CategorieDto>>
            {
                Success = false,
                Message = "Une erreur s'est produite",
                Errors = new List<string> { ex.Message }
            });
        }
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<CategorieDto>>> GetCategorie(int id)
    {
        try
        {
            var categorie = await _categorieService.GetByIdAsync(id);
            if (categorie == null)
            {
                return NotFound(new ApiResponse<CategorieDto>
                {
                    Success = false,
                    Message = "Catégorie non trouvée"
                });
            }

            return Ok(new ApiResponse<CategorieDto>
            {
                Success = true,
                Data = categorie,
                Message = "Catégorie récupérée avec succès"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting category {Id}", id);
            return StatusCode(500, new ApiResponse<CategorieDto>
            {
                Success = false,
                Message = "Une erreur s'est produite",
                Errors = new List<string> { ex.Message }
            });
        }
    }

    [HttpPost]
    [Authorize(Roles = Roles.ResponsableSAV)]
    public async Task<ActionResult<ApiResponse<CategorieDto>>> CreateCategorie([FromBody] CreateCategorieDto dto)
    {
        try
        {
            var categorie = await _categorieService.CreateAsync(dto);
            return CreatedAtAction(nameof(GetCategorie), new { id = categorie.Id }, new ApiResponse<CategorieDto>
            {
                Success = true,
                Data = categorie,
                Message = "Catégorie créée avec succès"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating category");
            return StatusCode(500, new ApiResponse<CategorieDto>
            {
                Success = false,
                Message = "Une erreur s'est produite",
                Errors = new List<string> { ex.Message }
            });
        }
    }

    [HttpPut("{id}")]
    [Authorize(Roles = Roles.ResponsableSAV)]
    public async Task<ActionResult<ApiResponse<CategorieDto>>> UpdateCategorie(int id, [FromBody] UpdateCategorieDto dto)
    {
        try
        {
            var categorie = await _categorieService.UpdateAsync(id, dto);
            if (categorie == null)
            {
                return NotFound(new ApiResponse<CategorieDto>
                {
                    Success = false,
                    Message = "Catégorie non trouvée"
                });
            }

            return Ok(new ApiResponse<CategorieDto>
            {
                Success = true,
                Data = categorie,
                Message = "Catégorie mise à jour avec succès"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating category {Id}", id);
            return StatusCode(500, new ApiResponse<CategorieDto>
            {
                Success = false,
                Message = "Une erreur s'est produite",
                Errors = new List<string> { ex.Message }
            });
        }
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = Roles.ResponsableSAV)]
    public async Task<ActionResult<ApiResponse<bool>>> DeleteCategorie(int id)
    {
        try
        {
            var result = await _categorieService.DeleteAsync(id);
            if (!result)
            {
                return NotFound(new ApiResponse<bool>
                {
                    Success = false,
                    Message = "Catégorie non trouvée"
                });
            }

            return Ok(new ApiResponse<bool>
            {
                Success = true,
                Data = true,
                Message = "Catégorie supprimée avec succès"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting category {Id}", id);
            return StatusCode(500, new ApiResponse<bool>
            {
                Success = false,
                Message = "Une erreur s'est produite",
                Errors = new List<string> { ex.Message }
            });
        }
    }
}
