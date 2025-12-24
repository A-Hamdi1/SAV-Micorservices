using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SAV.Articles.API.Filters;
using SAV.Articles.Application.Interfaces;
using SAV.Shared.Common;
using SAV.Shared.DTOs.Articles;

namespace SAV.Articles.API.Controllers;

[ApiController]
[Route("api/pieces-detachees")]
public class PiecesDetacheesController : ControllerBase
{
    private readonly IPieceDetacheeService _pieceService;
    private readonly ILogger<PiecesDetacheesController> _logger;

    public PiecesDetacheesController(IPieceDetacheeService pieceService, ILogger<PiecesDetacheesController> logger)
    {
        _pieceService = pieceService;
        _logger = logger;
    }

    [HttpPost]
    [Authorize(Roles = "ResponsableSAV")]
    public async Task<ActionResult<ApiResponse<PieceDetacheeDto>>> CreatePieceDetachee([FromBody] CreatePieceDetacheeDto dto)
    {
        try
        {
            var piece = await _pieceService.CreatePieceDetacheeAsync(dto);
            
            return Ok(new ApiResponse<PieceDetacheeDto>
            {
                Success = true,
                Data = piece,
                Message = "Pièce détachée créée avec succès"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating piece detachee");
            return StatusCode(500, new ApiResponse<PieceDetacheeDto>
            {
                Success = false,
                Message = "Une erreur s'est produite",
                Errors = new List<string> { ex.Message }
            });
        }
    }

    [HttpGet("{id}")]
    [ApiKeyAuth] // Accepts both JWT Bearer and API Key for inter-service communication
    public async Task<ActionResult<ApiResponse<PieceDetacheeDto>>> GetPieceDetachee(int id)
    {
        try
        {
            var piece = await _pieceService.GetPieceDetacheeByIdAsync(id);
            
            if (piece == null)
            {
                return NotFound(new ApiResponse<PieceDetacheeDto>
                {
                    Success = false,
                    Message = "Pièce détachée non trouvée"
                });
            }

            return Ok(new ApiResponse<PieceDetacheeDto>
            {
                Success = true,
                Data = piece,
                Message = "Pièce détachée récupérée avec succès"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting piece detachee {Id}", id);
            return StatusCode(500, new ApiResponse<PieceDetacheeDto>
            {
                Success = false,
                Message = "Une erreur s'est produite",
                Errors = new List<string> { ex.Message }
            });
        }
    }

    [HttpPatch("{id}/stock/reduce")]
    [ApiKeyAuth] // Accepts both JWT Bearer and API Key for inter-service communication
    public async Task<ActionResult<ApiResponse<bool>>> ReduceStock(int id, [FromBody] ReduceStockDto dto)
    {
        try
        {
            var success = await _pieceService.ReduceStockAsync(id, dto.Quantite);
            
            if (!success)
            {
                return BadRequest(new ApiResponse<bool>
                {
                    Success = false,
                    Data = false,
                    Message = "Stock insuffisant ou pièce non trouvée"
                });
            }

            return Ok(new ApiResponse<bool>
            {
                Success = true,
                Data = true,
                Message = "Stock réduit avec succès"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error reducing stock for piece {Id}", id);
            return StatusCode(500, new ApiResponse<bool>
            {
                Success = false,
                Message = "Une erreur s'est produite",
                Errors = new List<string> { ex.Message }
            });
        }
    }

    /// <summary>
    /// Obtenir toutes les pièces détachées
    /// </summary>
    [HttpGet]
    [Authorize]
    public async Task<ActionResult<ApiResponse<IEnumerable<PieceDetacheeDto>>>> GetAllPieces()
    {
        var pieces = await _pieceService.GetAllPiecesDetacheesAsync();
        return Ok(new ApiResponse<IEnumerable<PieceDetacheeDto>>
        {
            Success = true,
            Data = pieces
        });
    }

    /// <summary>
    /// Obtenir les pièces d'un article
    /// </summary>
    [HttpGet("article/{articleId}")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<IEnumerable<PieceDetacheeDto>>>> GetPiecesByArticle(int articleId)
    {
        var pieces = await _pieceService.GetPiecesDetacheesByArticleIdAsync(articleId);
        return Ok(new ApiResponse<IEnumerable<PieceDetacheeDto>>
        {
            Success = true,
            Data = pieces
        });
    }

    /// <summary>
    /// Mettre à jour une pièce
    /// </summary>
    [HttpPut("{id}")]
    [Authorize(Roles = "ResponsableSAV")]
    public async Task<ActionResult<ApiResponse<PieceDetacheeDto>>> UpdatePiece(int id, [FromBody] UpdatePieceDetacheeDto dto)
    {
        var piece = await _pieceService.UpdatePieceDetacheeAsync(id, dto);
        if (piece == null)
            return NotFound(new ApiResponse<PieceDetacheeDto> { Success = false, Message = "Pièce non trouvée" });
        
        return Ok(new ApiResponse<PieceDetacheeDto>
        {
            Success = true,
            Data = piece,
            Message = "Pièce mise à jour"
        });
    }

    /// <summary>
    /// Supprimer une pièce
    /// </summary>
    [HttpDelete("{id}")]
    [Authorize(Roles = "ResponsableSAV")]
    public async Task<ActionResult<ApiResponse>> DeletePiece(int id)
    {
        var result = await _pieceService.DeletePieceDetacheeAsync(id);
        if (!result)
            return NotFound(new ApiResponse { Success = false, Message = "Pièce non trouvée" });
        
        return Ok(new ApiResponse { Success = true, Message = "Pièce supprimée" });
    }

    /// <summary>
    /// Ajouter du stock
    /// </summary>
    [HttpPatch("{id}/stock/add")]
    [Authorize(Roles = "ResponsableSAV")]
    public async Task<ActionResult<ApiResponse<bool>>> AddStock(int id, [FromBody] AddStockDto dto)
    {
        var success = await _pieceService.AddStockAsync(id, dto.Quantite);
        if (!success)
            return NotFound(new ApiResponse<bool> { Success = false, Message = "Pièce non trouvée" });
        
        return Ok(new ApiResponse<bool> { Success = true, Data = true, Message = "Stock ajouté" });
    }

    /// <summary>
    /// Obtenir les pièces en alerte stock
    /// </summary>
    [HttpGet("low-stock")]
    [Authorize(Roles = "ResponsableSAV")]
    public async Task<ActionResult<ApiResponse<IEnumerable<PieceDetacheeDto>>>> GetLowStock([FromQuery] int seuil = 10)
    {
        var pieces = await _pieceService.GetPiecesLowStockAsync(seuil);
        return Ok(new ApiResponse<IEnumerable<PieceDetacheeDto>>
        {
            Success = true,
            Data = pieces
        });
    }

    /// <summary>
    /// Obtenir les mouvements de stock d'une pièce
    /// </summary>
    [HttpGet("{id}/mouvements")]
    [Authorize(Roles = "ResponsableSAV")]
    public async Task<ActionResult<ApiResponse<IEnumerable<MouvementStockDto>>>> GetMouvements(int id)
    {
        var mouvements = await _pieceService.GetMouvementsStockAsync(id);
        return Ok(new ApiResponse<IEnumerable<MouvementStockDto>>
        {
            Success = true,
            Data = mouvements
        });
    }

    /// <summary>
    /// Obtenir les statistiques de stock
    /// </summary>
    [HttpGet("stats")]
    [Authorize(Roles = "ResponsableSAV")]
    public async Task<ActionResult<ApiResponse<StockStatsDto>>> GetStockStats()
    {
        var stats = await _pieceService.GetStockStatsAsync();
        return Ok(new ApiResponse<StockStatsDto>
        {
            Success = true,
            Data = stats
        });
    }
}

public class ReduceStockDto
{
    public int Quantite { get; set; }
}

public class AddStockDto
{
    public int Quantite { get; set; }
}
