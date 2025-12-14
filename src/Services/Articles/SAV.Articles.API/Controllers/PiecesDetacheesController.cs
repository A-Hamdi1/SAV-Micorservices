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
}

public class ReduceStockDto
{
    public int Quantite { get; set; }
}
