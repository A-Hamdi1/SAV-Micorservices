using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SAV.Interventions.Application.Interfaces;
using SAV.Shared.Common;

namespace SAV.Interventions.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class EvaluationsController : ControllerBase
{
    private readonly IEvaluationService _evaluationService;

    public EvaluationsController(IEvaluationService evaluationService)
    {
        _evaluationService = evaluationService;
    }

    /// <summary>
    /// Obtenir toutes les évaluations
    /// </summary>
    [HttpGet]
    [Authorize(Roles = "ResponsableSAV")]
    public async Task<IActionResult> GetAll()
    {
        var evaluations = await _evaluationService.GetAllAsync();
        return Ok(new ApiResponse<IEnumerable<object>>
        {
            Success = true,
            Data = evaluations
        });
    }

    /// <summary>
    /// Obtenir une évaluation par ID
    /// </summary>
    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var evaluation = await _evaluationService.GetByIdAsync(id);
        if (evaluation == null)
            return NotFound(new ApiResponse<object>
            {
                Success = false,
                Message = "Évaluation non trouvée"
            });
        return Ok(new ApiResponse<object>
        {
            Success = true,
            Data = evaluation
        });
    }

    /// <summary>
    /// Obtenir l'évaluation d'une intervention
    /// </summary>
    [HttpGet("intervention/{interventionId}")]
    public async Task<IActionResult> GetByInterventionId(int interventionId)
    {
        var evaluation = await _evaluationService.GetByInterventionIdAsync(interventionId);
        if (evaluation == null)
            return NotFound(new ApiResponse<object>
            {
                Success = false,
                Message = "Évaluation non trouvée pour cette intervention"
            });
        return Ok(new ApiResponse<object>
        {
            Success = true,
            Data = evaluation
        });
    }

    /// <summary>
    /// Obtenir les évaluations d'un client
    /// </summary>
    [HttpGet("client/{clientId}")]
    public async Task<IActionResult> GetByClientId(int clientId)
    {
        var evaluations = await _evaluationService.GetByClientIdAsync(clientId);
        return Ok(new ApiResponse<IEnumerable<object>>
        {
            Success = true,
            Data = evaluations
        });
    }

    /// <summary>
    /// Obtenir les évaluations d'un technicien
    /// </summary>
    [HttpGet("technicien/{technicienId}")]
    public async Task<IActionResult> GetByTechnicienId(int technicienId)
    {
        var evaluations = await _evaluationService.GetByTechnicienIdAsync(technicienId);
        return Ok(new ApiResponse<IEnumerable<object>>
        {
            Success = true,
            Data = evaluations
        });
    }

    /// <summary>
    /// Créer une nouvelle évaluation
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateEvaluationDto dto)
    {
        try
        {
            var evaluation = await _evaluationService.CreateAsync(dto);
            if (evaluation == null)
                return NotFound(new ApiResponse<object>
                {
                    Success = false,
                    Message = "Intervention non trouvée"
                });
            
            return CreatedAtAction(nameof(GetById), new { id = evaluation.Id }, new ApiResponse<object>
            {
                Success = true,
                Data = evaluation,
                Message = "Évaluation créée avec succès"
            });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new ApiResponse<object>
            {
                Success = false,
                Message = "Opération invalide",
                Errors = new List<string> { ex.Message }
            });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new ApiResponse<object>
            {
                Success = false,
                Message = "Argument invalide",
                Errors = new List<string> { ex.Message }
            });
        }
    }

    /// <summary>
    /// Mettre à jour une évaluation
    /// </summary>
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateEvaluationDto dto)
    {
        try
        {
            var evaluation = await _evaluationService.UpdateAsync(id, dto);
            if (evaluation == null)
                return NotFound(new ApiResponse<object>
                {
                    Success = false,
                    Message = "Évaluation non trouvée"
                });
            
            return Ok(new ApiResponse<object>
            {
                Success = true,
                Data = evaluation,
                Message = "Évaluation mise à jour avec succès"
            });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new ApiResponse<object>
            {
                Success = false,
                Message = "Argument invalide",
                Errors = new List<string> { ex.Message }
            });
        }
    }

    /// <summary>
    /// Supprimer une évaluation
    /// </summary>
    [HttpDelete("{id}")]
    [Authorize(Roles = "ResponsableSAV")]
    public async Task<IActionResult> Delete(int id)
    {
        var result = await _evaluationService.DeleteAsync(id);
        if (!result)
            return NotFound(new ApiResponse<object>
            {
                Success = false,
                Message = "Évaluation non trouvée"
            });
        
        return Ok(new ApiResponse<object>
        {
            Success = true,
            Message = "Évaluation supprimée avec succès"
        });
    }

    /// <summary>
    /// Obtenir les statistiques des évaluations
    /// </summary>
    [HttpGet("stats")]
    [Authorize(Roles = "ResponsableSAV")]
    public async Task<IActionResult> GetStats()
    {
        var stats = await _evaluationService.GetStatsAsync();
        return Ok(new ApiResponse<object>
        {
            Success = true,
            Data = stats
        });
    }

    /// <summary>
    /// Obtenir les statistiques d'un technicien
    /// </summary>
    [HttpGet("stats/technicien/{technicienId}")]
    public async Task<IActionResult> GetTechnicienStats(int technicienId)
    {
        var stats = await _evaluationService.GetTechnicienStatsAsync(technicienId);
        if (stats == null)
            return NotFound(new ApiResponse<object>
            {
                Success = false,
                Message = "Technicien non trouvé"
            });
        
        return Ok(new ApiResponse<object>
        {
            Success = true,
            Data = stats
        });
    }
}
