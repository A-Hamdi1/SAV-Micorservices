using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SAV.Interventions.Application.Interfaces;
using SAV.Shared.Common;
using SAV.Shared.DTOs.Interventions;
using System.Security.Claims;

namespace SAV.Interventions.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TechniciensController : ControllerBase
{
    private readonly ITechnicienService _technicienService;
    private readonly ILogger<TechniciensController> _logger;

    public TechniciensController(
        ITechnicienService technicienService,
        ILogger<TechniciensController> logger)
    {
        _technicienService = technicienService;
        _logger = logger;
    }

    // ==================== ENDPOINTS POUR TECHNICIEN (son propre profil) ====================

    [HttpGet("me")]
    [Authorize(Roles = "Technicien")]
    public async Task<ActionResult<ApiResponse<TechnicienDetailsDto>>> GetMyProfile()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized(new ApiResponse<TechnicienDetailsDto>
            {
                Success = false,
                Message = "Non autorisé"
            });
        }

        var technicien = await _technicienService.GetTechnicienByUserIdAsync(userId);

        if (technicien == null)
        {
            return NotFound(new ApiResponse<TechnicienDetailsDto>
            {
                Success = false,
                Message = "Profil technicien non trouvé. Veuillez contacter l'administrateur."
            });
        }

        return Ok(new ApiResponse<TechnicienDetailsDto>
        {
            Success = true,
            Data = technicien
        });
    }

    [HttpGet("me/interventions")]
    [Authorize(Roles = "Technicien")]
    public async Task<ActionResult<ApiResponse<List<InterventionDto>>>> GetMyInterventions(
        [FromQuery] string? statut = null,
        [FromQuery] DateTime? dateDebut = null,
        [FromQuery] DateTime? dateFin = null)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized(new ApiResponse<List<InterventionDto>>
            {
                Success = false,
                Message = "Non autorisé"
            });
        }

        var technicien = await _technicienService.GetTechnicienByUserIdAsync(userId);

        if (technicien == null)
        {
            return NotFound(new ApiResponse<List<InterventionDto>>
            {
                Success = false,
                Message = "Profil technicien non trouvé"
            });
        }

        var interventions = await _technicienService.GetTechnicienInterventionsAsync(
            technicien.Id, statut, dateDebut, dateFin);

        return Ok(new ApiResponse<List<InterventionDto>>
        {
            Success = true,
            Data = interventions,
            Message = $"{interventions.Count} intervention(s) trouvée(s)"
        });
    }

    [HttpGet("me/stats")]
    [Authorize(Roles = "Technicien")]
    public async Task<ActionResult<ApiResponse<TechnicienStatsDto>>> GetMyStats()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized(new ApiResponse<TechnicienStatsDto>
            {
                Success = false,
                Message = "Non autorisé"
            });
        }

        var technicien = await _technicienService.GetTechnicienByUserIdAsync(userId);

        if (technicien == null)
        {
            return NotFound(new ApiResponse<TechnicienStatsDto>
            {
                Success = false,
                Message = "Profil technicien non trouvé"
            });
        }

        var stats = await _technicienService.GetTechnicienStatsAsync(technicien.Id);

        return Ok(new ApiResponse<TechnicienStatsDto>
        {
            Success = true,
            Data = stats,
            Message = "Statistiques récupérées avec succès"
        });
    }

    [HttpPut("me/interventions/{interventionId}/statut")]
    [Authorize(Roles = "Technicien")]
    public async Task<ActionResult<ApiResponse<InterventionDto>>> UpdateMyInterventionStatut(
        int interventionId,
        [FromBody] UpdateInterventionStatutDto dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized(new ApiResponse<InterventionDto>
            {
                Success = false,
                Message = "Non autorisé"
            });
        }

        var technicien = await _technicienService.GetTechnicienByUserIdAsync(userId);

        if (technicien == null)
        {
            return NotFound(new ApiResponse<InterventionDto>
            {
                Success = false,
                Message = "Profil technicien non trouvé"
            });
        }

        var intervention = await _technicienService.UpdateInterventionStatutByTechnicienAsync(
            interventionId, technicien.Id, dto.Statut, dto.Commentaire);

        if (intervention == null)
        {
            return BadRequest(new ApiResponse<InterventionDto>
            {
                Success = false,
                Message = "Impossible de mettre à jour le statut. L'intervention n'existe pas ou ne vous est pas assignée, ou la transition n'est pas valide."
            });
        }

        return Ok(new ApiResponse<InterventionDto>
        {
            Success = true,
            Data = intervention,
            Message = "Statut de l'intervention mis à jour avec succès"
        });
    }

    // ==================== ENDPOINTS POUR RESPONSABLE SAV ====================

    [HttpGet]
    [Authorize(Roles = "ResponsableSAV")]
    public async Task<ActionResult<ApiResponse<List<TechnicienDto>>>> GetAllTechniciens(
        [FromQuery] bool? disponible = null)
    {
        var techniciens = await _technicienService.GetAllTechniciensAsync(disponible);

        return Ok(new ApiResponse<List<TechnicienDto>>
        {
            Success = true,
            Data = techniciens,
            Message = $"{techniciens.Count} technicien(s) trouvé(s)"
        });
    }

    [HttpGet("{id}")]
    [Authorize(Roles = "ResponsableSAV,Technicien")]
    public async Task<ActionResult<ApiResponse<TechnicienDetailsDto>>> GetTechnicienById(int id)
    {
        // Si c'est un technicien, vérifier qu'il accède à son propre profil
        var userRole = User.FindFirstValue(ClaimTypes.Role);
        if (userRole == "Technicien")
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var myProfile = await _technicienService.GetTechnicienByUserIdAsync(userId!);
            if (myProfile == null || myProfile.Id != id)
            {
                return Forbid();
            }
        }

        var technicien = await _technicienService.GetTechnicienByIdAsync(id);

        if (technicien == null)
        {
            return NotFound(new ApiResponse<TechnicienDetailsDto>
            {
                Success = false,
                Message = "Technicien non trouvé"
            });
        }

        return Ok(new ApiResponse<TechnicienDetailsDto>
        {
            Success = true,
            Data = technicien
        });
    }

    [HttpGet("specialite/{specialite}")]
    [Authorize(Roles = "ResponsableSAV")]
    public async Task<ActionResult<ApiResponse<List<TechnicienDto>>>> GetTechniciensBySpecialite(string specialite)
    {
        var techniciens = await _technicienService.GetTechniciensBySpecialiteAsync(specialite);

        return Ok(new ApiResponse<List<TechnicienDto>>
        {
            Success = true,
            Data = techniciens,
            Message = $"{techniciens.Count} technicien(s) trouvé(s) pour la spécialité '{specialite}'"
        });
    }

    [HttpGet("disponibles")]
    [Authorize(Roles = "ResponsableSAV")]
    public async Task<ActionResult<ApiResponse<List<TechnicienDto>>>> GetTechniciensDisponibles()
    {
        var techniciens = await _technicienService.GetTechniciensDisponiblesAsync();

        return Ok(new ApiResponse<List<TechnicienDto>>
        {
            Success = true,
            Data = techniciens,
            Message = $"{techniciens.Count} technicien(s) disponible(s)"
        });
    }

    [HttpPost]
    [Authorize(Roles = "ResponsableSAV")]
    public async Task<ActionResult<ApiResponse<TechnicienDto>>> CreateTechnicien([FromBody] CreateTechnicienDto dto)
    {
        var technicien = await _technicienService.CreateTechnicienAsync(dto);

        if (technicien == null)
        {
            return BadRequest(new ApiResponse<TechnicienDto>
            {
                Success = false,
                Message = "Impossible de créer le technicien. L'email existe peut-être déjà."
            });
        }

        return CreatedAtAction(nameof(GetTechnicienById), new { id = technicien.Id }, new ApiResponse<TechnicienDto>
        {
            Success = true,
            Data = technicien,
            Message = "Technicien créé avec succès"
        });
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "ResponsableSAV")]
    public async Task<ActionResult<ApiResponse<TechnicienDto>>> UpdateTechnicien(
        int id,
        [FromBody] UpdateTechnicienDto dto)
    {
        var technicien = await _technicienService.UpdateTechnicienAsync(id, dto);

        if (technicien == null)
        {
            return NotFound(new ApiResponse<TechnicienDto>
            {
                Success = false,
                Message = "Technicien non trouvé ou email déjà utilisé"
            });
        }

        return Ok(new ApiResponse<TechnicienDto>
        {
            Success = true,
            Data = technicien,
            Message = "Technicien mis à jour avec succès"
        });
    }

    [HttpPatch("{id}/disponibilite")]
    [Authorize(Roles = "ResponsableSAV")]
    public async Task<ActionResult<ApiResponse<TechnicienDto>>> UpdateDisponibilite(
        int id,
        [FromBody] UpdateTechnicienDisponibiliteDto dto)
    {
        var technicien = await _technicienService.UpdateDisponibiliteAsync(id, dto.EstDisponible);

        if (technicien == null)
        {
            return NotFound(new ApiResponse<TechnicienDto>
            {
                Success = false,
                Message = "Technicien non trouvé"
            });
        }

        return Ok(new ApiResponse<TechnicienDto>
        {
            Success = true,
            Data = technicien,
            Message = $"Disponibilité mise à jour: {(dto.EstDisponible ? "disponible" : "non disponible")}"
        });
    }

    [HttpGet("{id}/interventions")]
    [Authorize(Roles = "ResponsableSAV")]
    public async Task<ActionResult<ApiResponse<List<InterventionDto>>>> GetTechnicienInterventions(
        int id,
        [FromQuery] string? statut = null,
        [FromQuery] DateTime? dateDebut = null,
        [FromQuery] DateTime? dateFin = null)
    {
        var technicien = await _technicienService.GetTechnicienByIdAsync(id);
        
        if (technicien == null)
        {
            return NotFound(new ApiResponse<List<InterventionDto>>
            {
                Success = false,
                Message = "Technicien non trouvé"
            });
        }

        var interventions = await _technicienService.GetTechnicienInterventionsAsync(id, statut, dateDebut, dateFin);

        return Ok(new ApiResponse<List<InterventionDto>>
        {
            Success = true,
            Data = interventions,
            Message = $"{interventions.Count} intervention(s) trouvée(s)"
        });
    }

    [HttpGet("{id}/stats")]
    [Authorize(Roles = "ResponsableSAV")]
    public async Task<ActionResult<ApiResponse<TechnicienStatsDto>>> GetTechnicienStats(int id)
    {
        var technicien = await _technicienService.GetTechnicienByIdAsync(id);
        
        if (technicien == null)
        {
            return NotFound(new ApiResponse<TechnicienStatsDto>
            {
                Success = false,
                Message = "Technicien non trouvé"
            });
        }

        var stats = await _technicienService.GetTechnicienStatsAsync(id);

        return Ok(new ApiResponse<TechnicienStatsDto>
        {
            Success = true,
            Data = stats,
            Message = "Statistiques récupérées avec succès"
        });
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "ResponsableSAV")]
    public async Task<ActionResult<ApiResponse>> DeleteTechnicien(int id)
    {
        var result = await _technicienService.DeleteTechnicienAsync(id);

        if (!result)
        {
            return BadRequest(new ApiResponse
            {
                Success = false,
                Message = "Impossible de supprimer le technicien. Il a peut-être des interventions actives."
            });
        }

        return Ok(new ApiResponse
        {
            Success = true,
            Message = "Technicien supprimé avec succès"
        });
    }

    [HttpGet("stats")]
    [Authorize(Roles = "ResponsableSAV")]
    public async Task<ActionResult<ApiResponse<TechniciensStatsGlobalesDto>>> GetTechniciensStatsGlobales()
    {
        var stats = await _technicienService.GetTechniciensStatsGlobalesAsync();

        return Ok(new ApiResponse<TechniciensStatsGlobalesDto>
        {
            Success = true,
            Data = stats,
            Message = "Statistiques globales récupérées avec succès"
        });
    }
}
