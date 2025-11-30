using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SAV.Clients.Application.Interfaces;
using SAV.Shared.Common;
using SAV.Shared.DTOs.Clients;
using System.Security.Claims;

namespace SAV.Clients.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ReclamationsController : ControllerBase
{
    private readonly IReclamationService _reclamationService;

    public ReclamationsController(IReclamationService reclamationService)
    {
        _reclamationService = reclamationService;
    }

    [HttpPost]
    [Authorize(Roles = "Client")]
    public async Task<ActionResult<ApiResponse<ReclamationDto>>> CreateReclamation([FromBody] CreateReclamationDto dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized(new ApiResponse<ReclamationDto>
            {
                Success = false,
                Message = "Utilisateur non authentifié"
            });
        }

        var reclamation = await _reclamationService.CreateReclamationAsync(userId, dto);
        
        if (reclamation == null)
        {
            return BadRequest(new ApiResponse<ReclamationDto>
            {
                Success = false,
                Message = "Impossible de créer la réclamation"
            });
        }

        return CreatedAtAction(nameof(GetReclamationById), new { id = reclamation.Id }, new ApiResponse<ReclamationDto>
        {
            Success = true,
            Data = reclamation,
            Message = "Réclamation créée avec succès"
        });
    }

    [HttpGet("me")]
    [Authorize(Roles = "Client")]
    public async Task<ActionResult<ApiResponse<List<ReclamationDto>>>> GetMyReclamations()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized(new ApiResponse<List<ReclamationDto>>
            {
                Success = false,
                Message = "Utilisateur non authentifié"
            });
        }

        var reclamations = await _reclamationService.GetClientReclamationsAsync(userId);
        
        return Ok(new ApiResponse<List<ReclamationDto>>
        {
            Success = true,
            Data = reclamations
        });
    }

    [HttpGet]
    [Authorize(Roles = "ResponsableSAV")]
    public async Task<ActionResult<ApiResponse<ReclamationListDto>>> GetAllReclamations(
        [FromQuery] int page = 1, 
        [FromQuery] int pageSize = 10,
        [FromQuery] string? statut = null)
    {
        var reclamations = await _reclamationService.GetAllReclamationsAsync(page, pageSize, statut);
        
        return Ok(new ApiResponse<ReclamationListDto>
        {
            Success = true,
            Data = reclamations
        });
    }

    [HttpGet("{id}")]
    [AllowAnonymous] // Allow inter-service communication
    public async Task<ActionResult<ApiResponse<ReclamationDto>>> GetReclamationById(int id)
    {
        var reclamation = await _reclamationService.GetReclamationByIdAsync(id);
        
        if (reclamation == null)
        {
            return NotFound(new ApiResponse<ReclamationDto>
            {
                Success = false,
                Message = "Réclamation non trouvée"
            });
        }

        return Ok(new ApiResponse<ReclamationDto>
        {
            Success = true,
            Data = reclamation
        });
    }

    [HttpPut("{id}/statut")]
    [Authorize(Roles = "ResponsableSAV")]
    public async Task<ActionResult<ApiResponse<ReclamationDto>>> UpdateReclamationStatut(
        int id, 
        [FromBody] UpdateReclamationStatutDto dto)
    {
        var reclamation = await _reclamationService.UpdateReclamationStatutAsync(id, dto);
        
        if (reclamation == null)
        {
            return NotFound(new ApiResponse<ReclamationDto>
            {
                Success = false,
                Message = "Réclamation non trouvée"
            });
        }

        return Ok(new ApiResponse<ReclamationDto>
        {
            Success = true,
            Data = reclamation,
            Message = "Statut de la réclamation mis à jour"
        });
    }
}
