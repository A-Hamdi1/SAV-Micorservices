using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SAV.Clients.API.Filters;
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
    [Authorize(Roles = "ResponsableSAV,Client")]
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

        // Si c'est un client, vérifier qu'il accède à SA propre réclamation
        if (User.IsInRole("Client"))
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var client = await _reclamationService.GetClientByUserIdAsync(userId);
            
            if (client == null || reclamation.ClientId != client.Id)
            {
                return Forbid();
            }
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

    [HttpGet("client/{clientId}")]
    [Authorize(Roles = "ResponsableSAV")]
    public async Task<ActionResult<ApiResponse<List<ReclamationDto>>>> GetReclamationsByClientId(int clientId)
    {
        var reclamations = await _reclamationService.GetReclamationsByClientIdAsync(clientId);

        return Ok(new ApiResponse<List<ReclamationDto>>
        {
            Success = true,
            Data = reclamations,
            Message = $"{reclamations.Count} réclamation(s) trouvée(s) pour ce client"
        });
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "ResponsableSAV")]
    public async Task<ActionResult<ApiResponse>> DeleteReclamation(int id)
    {
        var result = await _reclamationService.DeleteReclamationAsync(id);

        if (!result)
        {
            return BadRequest(new ApiResponse
            {
                Success = false,
                Message = "Impossible de supprimer la réclamation. Elle doit être en statut 'En Attente'."
            });
        }

        return Ok(new ApiResponse
        {
            Success = true,
            Message = "Réclamation supprimée avec succès"
        });
    }
}
