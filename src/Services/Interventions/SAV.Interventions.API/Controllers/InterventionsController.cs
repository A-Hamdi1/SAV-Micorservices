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
    private readonly IFacturationService _facturationService;
    private readonly ILogger<InterventionsController> _logger;

    public InterventionsController(
        IInterventionService interventionService,
        IFacturationService facturationService,
        ILogger<InterventionsController> logger)
    {
        _interventionService = interventionService;
        _facturationService = facturationService;
        _logger = logger;
    }

    [HttpPost]
    [Authorize(Roles = "ResponsableSAV")]
    public async Task<ActionResult<ApiResponse<InterventionDto>>> CreateIntervention([FromBody] CreateInterventionDto dto)
    {
        _logger.LogInformation("Creating intervention for reclamation {ReclamationId}", dto.ReclamationId);
        
        var intervention = await _interventionService.CreateInterventionAsync(dto);

        if (intervention == null)
        {
            _logger.LogWarning("Failed to create intervention for reclamation {ReclamationId}", dto.ReclamationId);
            return BadRequest(new ApiResponse<InterventionDto>
            {
                Success = false,
                Message = "Impossible de créer l'intervention. Vérifiez que la réclamation existe."
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
        _logger.LogInformation("Adding piece {PieceDetacheeId} to intervention {InterventionId}", dto.PieceDetacheeId, id);
        
        var piece = await _interventionService.AddPieceUtiliseeAsync(id, dto);

        if (piece == null)
        {
            _logger.LogWarning("Failed to add piece {PieceDetacheeId} to intervention {InterventionId}", dto.PieceDetacheeId, id);
            return BadRequest(new ApiResponse<PieceUtiliseeDto>
            {
                Success = false,
                Message = "Impossible d'ajouter la pièce détachée. Vérifiez que l'intervention et la pièce existent."
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

    [HttpGet("{id}/facture")]
    [Authorize(Roles = "ResponsableSAV,Technicien")]
    public async Task<ActionResult<ApiResponse<string>>> GenererFacture(int id)
    {
        try
        {
            var intervention = await _interventionService.GetInterventionByIdAsync(id);

            if (intervention == null)
            {
                return NotFound(new ApiResponse<string>
                {
                    Success = false,
                    Message = "Intervention non trouvée"
                });
            }

            // Récupérer l'entité complète pour la facturation
            var interventionEntity = await _interventionService.GetInterventionEntityByIdAsync(id);
            
            if (interventionEntity == null)
            {
                return NotFound(new ApiResponse<string>
                {
                    Success = false,
                    Message = "Intervention non trouvée"
                });
            }

            var facture = _facturationService.GenererResumeFacture(interventionEntity);

            return Ok(new ApiResponse<string>
            {
                Success = true,
                Data = facture,
                Message = "Facture générée avec succès"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating invoice for intervention {Id}", id);
            return StatusCode(500, new ApiResponse<string>
            {
                Success = false,
                Message = "Une erreur s'est produite",
                Errors = new List<string> { ex.Message }
            });
        }
    }

    [HttpGet("technicien/{technicienId}")]
    [Authorize(Roles = "ResponsableSAV")]
    public async Task<ActionResult<ApiResponse<List<InterventionDto>>>> GetInterventionsByTechnicien(int technicienId)
    {
        var interventions = await _interventionService.GetInterventionsByTechnicienAsync(technicienId);

        return Ok(new ApiResponse<List<InterventionDto>>
        {
            Success = true,
            Data = interventions,
            Message = $"{interventions.Count} intervention(s) trouvée(s) pour le technicien"
        });
    }

    [HttpGet("planifiees")]
    [Authorize(Roles = "ResponsableSAV")]
    public async Task<ActionResult<ApiResponse<List<InterventionDto>>>> GetInterventionsPlanifiees()
    {
        var interventions = await _interventionService.GetInterventionsPlanifieesAsync();

        return Ok(new ApiResponse<List<InterventionDto>>
        {
            Success = true,
            Data = interventions,
            Message = $"{interventions.Count} intervention(s) planifiée(s) ou en cours"
        });
    }

    [HttpPatch("{id}/technicien")]
    [Authorize(Roles = "ResponsableSAV")]
    public async Task<ActionResult<ApiResponse<InterventionDto>>> UpdateInterventionTechnicien(
        int id,
        [FromBody] UpdateInterventionTechnicienDto dto)
    {
        var intervention = await _interventionService.UpdateInterventionTechnicienAsync(id, dto.TechnicienId);

        if (intervention == null)
        {
            return NotFound(new ApiResponse<InterventionDto>
            {
                Success = false,
                Message = "Intervention ou technicien non trouvé"
            });
        }

        return Ok(new ApiResponse<InterventionDto>
        {
            Success = true,
            Data = intervention,
            Message = "Technicien assigné avec succès"
        });
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "ResponsableSAV")]
    public async Task<ActionResult<ApiResponse>> DeleteIntervention(int id)
    {
        var result = await _interventionService.DeleteInterventionAsync(id);

        if (!result)
        {
            return BadRequest(new ApiResponse
            {
                Success = false,
                Message = "Impossible de supprimer l'intervention. Elle est peut-être en cours ou terminée."
            });
        }

        return Ok(new ApiResponse
        {
            Success = true,
            Message = "Intervention supprimée avec succès"
        });
    }

    [HttpGet("stats")]
    [Authorize(Roles = "ResponsableSAV")]
    public async Task<ActionResult<ApiResponse<InterventionStatsDto>>> GetInterventionsStats()
    {
        var stats = await _interventionService.GetInterventionsStatsAsync();

        return Ok(new ApiResponse<InterventionStatsDto>
        {
            Success = true,
            Data = stats,
            Message = "Statistiques récupérées avec succès"
        });
    }

    /// <summary>
    /// Télécharger la facture PDF d'une intervention
    /// </summary>
    [HttpGet("{id}/facture/pdf")]
    [Authorize]
    public async Task<IActionResult> DownloadFacturePdf(int id)
    {
        try
        {
            var pdfBytes = await _facturationService.GenererFacturePdfAsync(id);
            return File(pdfBytes, "application/pdf", $"facture-{id}.pdf");
        }
        catch (KeyNotFoundException)
        {
            return NotFound(new ApiResponse { Success = false, Message = "Intervention non trouvée" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erreur lors de la génération de la facture PDF pour l'intervention {Id}", id);
            return StatusCode(500, new ApiResponse { Success = false, Message = "Erreur lors de la génération du PDF: " + ex.Message });
        }
    }

    /// <summary>
    /// Télécharger le rapport PDF d'une intervention
    /// </summary>
    [HttpGet("{id}/rapport/pdf")]
    [Authorize]
    public async Task<IActionResult> DownloadRapportPdf(int id)
    {
        try
        {
            var pdfBytes = await _facturationService.GenererRapportInterventionPdfAsync(id);
            return File(pdfBytes, "application/pdf", $"rapport-intervention-{id}.pdf");
        }
        catch (KeyNotFoundException)
        {
            return NotFound(new ApiResponse { Success = false, Message = "Intervention non trouvée" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erreur lors de la génération du rapport PDF pour l'intervention {Id}", id);
            return StatusCode(500, new ApiResponse { Success = false, Message = "Erreur lors de la génération du PDF: " + ex.Message });
        }
    }

    /// <summary>
    /// Télécharger le rapport mensuel PDF
    /// </summary>
    [HttpGet("rapport-mensuel/{annee}/{mois}/pdf")]
    [Authorize(Roles = "ResponsableSAV")]
    public async Task<IActionResult> DownloadRapportMensuelPdf(int annee, int mois)
    {
        try
        {
            var pdfBytes = await _facturationService.GenererRapportMensuelPdfAsync(mois, annee);
            return File(pdfBytes, "application/pdf", $"rapport-mensuel-{annee}-{mois:D2}.pdf");
        }
        catch (Exception ex)
        {
            return BadRequest(new ApiResponse { Success = false, Message = ex.Message });
        }
    }

    /// <summary>
    /// Obtenir les analytics avancées
    /// </summary>
    [HttpGet("analytics")]
    [Authorize(Roles = "ResponsableSAV")]
    public async Task<ActionResult<ApiResponse<AnalyticsDto>>> GetAnalytics([FromQuery] int? annee = null)
    {
        var analytics = await _interventionService.GetAnalyticsAsync(annee);

        return Ok(new ApiResponse<AnalyticsDto>
        {
            Success = true,
            Data = analytics,
            Message = "Analytics récupérées avec succès"
        });
    }
}
