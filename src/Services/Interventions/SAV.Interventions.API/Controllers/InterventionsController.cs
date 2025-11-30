using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SAV.Interventions.Application.Interfaces;
using SAV.Shared.Common;
using SAV.Shared.DTOs.Interventions;

namespace SAV.Interventions.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class InterventionsController : ControllerBase
{
    private readonly IInterventionService _interventionService;

    public InterventionsController(IInterventionService interventionService)
    {
        _interventionService = interventionService;
    }

    [HttpPost]
    [Authorize(Roles = "ResponsableSAV")]
    public async Task<ActionResult<ApiResponse<InterventionDto>>> CreateIntervention([FromBody] CreateInterventionDto dto)
    {
        var intervention = await _interventionService.CreateInterventionAsync(dto);

        if (intervention == null)
        {
            return BadRequest(new ApiResponse<InterventionDto>
            {
                Success = false,
                Message = "Impossible de créer l'intervention"
            });
        }

        return CreatedAtAction(nameof(GetInterventionById), new { id = intervention.Id }, new ApiResponse<InterventionDto>
        {
            Success = true,
            Data = intervention,
            Message = "Intervention créée avec succès"
        });
    }

    [HttpGet]
    [Authorize(Roles = "ResponsableSAV")]
    public async Task<ActionResult<ApiResponse<InterventionListDto>>> GetAllInterventions(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? statut = null)
    {
        var interventions = await _interventionService.GetAllInterventionsAsync(page, pageSize, statut);

        return Ok(new ApiResponse<InterventionListDto>
        {
            Success = true,
            Data = interventions
        });
    }

    [HttpGet("{id}")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<InterventionDto>>> GetInterventionById(int id)
    {
        var intervention = await _interventionService.GetInterventionByIdAsync(id);

        if (intervention == null)
        {
            return NotFound(new ApiResponse<InterventionDto>
            {
                Success = false,
                Message = "Intervention non trouvée"
            });
        }

        return Ok(new ApiResponse<InterventionDto>
        {
            Success = true,
            Data = intervention
        });
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "ResponsableSAV")]
    public async Task<ActionResult<ApiResponse<InterventionDto>>> UpdateIntervention(
        int id,
        [FromBody] UpdateInterventionDto dto)
    {
        var intervention = await _interventionService.UpdateInterventionAsync(id, dto);

        if (intervention == null)
        {
            return NotFound(new ApiResponse<InterventionDto>
            {
                Success = false,
                Message = "Intervention non trouvée"
            });
        }

        return Ok(new ApiResponse<InterventionDto>
        {
            Success = true,
            Data = intervention,
            Message = "Intervention mise à jour avec succès"
        });
    }

    [HttpPut("{id}/statut")]
    [Authorize(Roles = "ResponsableSAV")]
    public async Task<ActionResult<ApiResponse<InterventionDto>>> UpdateInterventionStatut(
        int id,
        [FromBody] UpdateInterventionStatutDto dto)
    {
        var intervention = await _interventionService.UpdateInterventionStatutAsync(id, dto);

        if (intervention == null)
        {
            return NotFound(new ApiResponse<InterventionDto>
            {
                Success = false,
                Message = "Intervention non trouvée"
            });
        }

        return Ok(new ApiResponse<InterventionDto>
        {
            Success = true,
            Data = intervention,
            Message = "Statut de l'intervention mis à jour"
        });
    }

    [HttpPost("{id}/pieces")]
    [Authorize(Roles = "ResponsableSAV")]
    public async Task<ActionResult<ApiResponse<PieceUtiliseeDto>>> AddPieceUtilisee(
        int id,
        [FromBody] AddPieceUtiliseeDto dto)
    {
        var piece = await _interventionService.AddPieceUtiliseeAsync(id, dto);

        if (piece == null)
        {
            return BadRequest(new ApiResponse<PieceUtiliseeDto>
            {
                Success = false,
                Message = "Impossible d'ajouter la pièce détachée"
            });
        }

        return Ok(new ApiResponse<PieceUtiliseeDto>
        {
            Success = true,
            Data = piece,
            Message = "Pièce détachée ajoutée avec succès"
        });
    }

    [HttpGet("reclamation/{reclamationId}")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<List<InterventionDto>>>> GetInterventionsByReclamation(int reclamationId)
    {
        var interventions = await _interventionService.GetInterventionsByReclamationIdAsync(reclamationId);

        return Ok(new ApiResponse<List<InterventionDto>>
        {
            Success = true,
            Data = interventions
        });
    }
}
