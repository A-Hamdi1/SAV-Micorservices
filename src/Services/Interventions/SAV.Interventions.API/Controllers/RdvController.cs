using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SAV.Interventions.Application.Interfaces;
using SAV.Shared.Common;

namespace SAV.Interventions.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class RdvController : ControllerBase
{
    private readonly IRdvService _rdvService;

    public RdvController(IRdvService rdvService)
    {
        _rdvService = rdvService;
    }

    #region Créneaux

    /// <summary>
    /// Obtenir les créneaux disponibles (non réservés uniquement)
    /// </summary>
    [HttpGet("creneaux")]
    public async Task<IActionResult> GetCreneauxDisponibles(
        [FromQuery] DateTime dateDebut,
        [FromQuery] DateTime dateFin,
        [FromQuery] int? technicienId = null)
    {
        var creneaux = await _rdvService.GetCreneauxDisponiblesAsync(dateDebut, dateFin, technicienId);
        return Ok(new ApiResponse<IEnumerable<object>>
        {
            Success = true,
            Data = creneaux
        });
    }

    /// <summary>
    /// Obtenir tous les créneaux (disponibles et réservés) avec pagination
    /// </summary>
    [HttpGet("creneaux/all")]
    public async Task<IActionResult> GetAllCreneaux(
        [FromQuery] DateTime dateDebut,
        [FromQuery] DateTime dateFin,
        [FromQuery] int? technicienId = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var result = await _rdvService.GetAllCreneauxAsync(dateDebut, dateFin, technicienId, page, pageSize);
        return Ok(new ApiResponse<object>
        {
            Success = true,
            Data = result
        });
    }

    /// <summary>
    /// Créer un créneau
    /// </summary>
    [HttpPost("creneaux")]
    [Authorize(Roles = "ResponsableSAV")]
    public async Task<IActionResult> CreateCreneau([FromBody] CreateCreneauDto dto)
    {
        try
        {
            var creneau = await _rdvService.CreateCreneauAsync(dto);
            if (creneau == null)
                return NotFound(new ApiResponse<object>
                {
                    Success = false,
                    Message = "Technicien non trouvé"
                });
            return CreatedAtAction(nameof(GetCreneauxByTechnicien), new { technicienId = creneau.TechnicienId }, new ApiResponse<object>
            {
                Success = true,
                Data = creneau,
                Message = "Créneau créé avec succès"
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
    }

    /// <summary>
    /// Créer des créneaux récurrents
    /// </summary>
    [HttpPost("creneaux/recurrents")]
    [Authorize(Roles = "ResponsableSAV")]
    public async Task<IActionResult> CreateCreneauxRecurrents([FromBody] CreateCreneauxRecurrentsDto dto)
    {
        try
        {
            var creneaux = await _rdvService.CreateCreneauxRecurrentsAsync(dto);
            return Ok(new ApiResponse<IEnumerable<object>>
            {
                Success = true,
                Data = creneaux,
                Message = "Créneaux récurrents créés avec succès"
            });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new ApiResponse<object>
            {
                Success = false,
                Message = "Ressource non trouvée",
                Errors = new List<string> { ex.Message }
            });
        }
    }

    /// <summary>
    /// Supprimer un créneau
    /// </summary>
    [HttpDelete("creneaux/{id}")]
    [Authorize(Roles = "ResponsableSAV")]
    public async Task<IActionResult> DeleteCreneau(int id)
    {
        var result = await _rdvService.DeleteCreneauAsync(id);
        if (!result)
            return BadRequest(new ApiResponse<object>
            {
                Success = false,
                Message = "Créneau non trouvé ou déjà réservé"
            });
        return Ok(new ApiResponse<object>
        {
            Success = true,
            Message = "Créneau supprimé avec succès"
        });
    }

    /// <summary>
    /// Réserver un créneau
    /// </summary>
    [HttpPost("creneaux/{id}/reserver")]
    [Authorize(Roles = "ResponsableSAV")]
    public async Task<IActionResult> ReserverCreneau(int id, [FromBody] ReserverCreneauRequest request)
    {
        var creneau = await _rdvService.ReserverCreneauAsync(id, request.InterventionId);
        if (creneau == null)
            return BadRequest(new ApiResponse<object>
            {
                Success = false,
                Message = "Créneau non disponible"
            });
        return Ok(new ApiResponse<object>
        {
            Success = true,
            Data = creneau,
            Message = "Créneau réservé avec succès"
        });
    }

    /// <summary>
    /// Libérer un créneau
    /// </summary>
    [HttpPost("creneaux/{id}/liberer")]
    [Authorize(Roles = "ResponsableSAV")]
    public async Task<IActionResult> LibererCreneau(int id)
    {
        var result = await _rdvService.LibererCreneauAsync(id);
        if (!result)
            return NotFound(new ApiResponse<object>
            {
                Success = false,
                Message = "Créneau non trouvé"
            });
        return Ok(new ApiResponse<object>
        {
            Success = true,
            Message = "Créneau libéré avec succès"
        });
    }

    /// <summary>
    /// Obtenir les créneaux d'un technicien
    /// </summary>
    [HttpGet("creneaux/technicien/{technicienId}")]
    public async Task<IActionResult> GetCreneauxByTechnicien(int technicienId, [FromQuery] DateTime? date = null)
    {
        var creneaux = await _rdvService.GetCreneauxByTechnicienAsync(technicienId, date);
        return Ok(new ApiResponse<IEnumerable<object>>
        {
            Success = true,
            Data = creneaux
        });
    }

    #endregion

    #region Demandes RDV

    /// <summary>
    /// Obtenir toutes les demandes de RDV
    /// </summary>
    [HttpGet("demandes")]
    [Authorize(Roles = "ResponsableSAV")]
    public async Task<IActionResult> GetDemandesRdv([FromQuery] string? statut = null)
    {
        var demandes = await _rdvService.GetDemandesRdvAsync(statut);
        return Ok(new ApiResponse<IEnumerable<object>>
        {
            Success = true,
            Data = demandes
        });
    }

    /// <summary>
    /// Obtenir une demande de RDV par ID
    /// </summary>
    [HttpGet("demandes/{id}")]
    public async Task<IActionResult> GetDemandeRdvById(int id)
    {
        var demande = await _rdvService.GetDemandeRdvByIdAsync(id);
        if (demande == null)
            return NotFound(new ApiResponse<object>
            {
                Success = false,
                Message = "Demande de RDV non trouvée"
            });
        return Ok(new ApiResponse<object>
        {
            Success = true,
            Data = demande
        });
    }

    /// <summary>
    /// Obtenir les demandes de RDV d'un client
    /// </summary>
    [HttpGet("demandes/client/{clientId}")]
    public async Task<IActionResult> GetDemandesRdvByClient(int clientId)
    {
        var demandes = await _rdvService.GetDemandesRdvByClientAsync(clientId);
        return Ok(new ApiResponse<IEnumerable<object>>
        {
            Success = true,
            Data = demandes
        });
    }

    /// <summary>
    /// Créer une demande de RDV
    /// </summary>
    [HttpPost("demandes")]
    public async Task<IActionResult> CreateDemandeRdv([FromBody] CreateDemandeRdvDto dto)
    {
        try
        {
            var demande = await _rdvService.CreateDemandeRdvAsync(dto);
            return CreatedAtAction(nameof(GetDemandeRdvById), new { id = demande!.Id }, new ApiResponse<object>
            {
                Success = true,
                Data = demande,
                Message = "Demande de RDV créée avec succès"
            });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new ApiResponse<object>
            {
                Success = false,
                Message = ex.Message
            });
        }
    }

    /// <summary>
    /// Traiter une demande de RDV
    /// </summary>
    [HttpPost("demandes/{id}/traiter")]
    [Authorize(Roles = "ResponsableSAV")]
    public async Task<IActionResult> TraiterDemandeRdv(int id, [FromBody] TraiterDemandeRdvDto dto)
    {
        try
        {
            var demande = await _rdvService.TraiterDemandeRdvAsync(id, dto);
            if (demande == null)
                return NotFound(new ApiResponse<object>
                {
                    Success = false,
                    Message = "Demande de RDV non trouvée"
                });
            return Ok(new ApiResponse<object>
            {
                Success = true,
                Data = demande,
                Message = "Demande de RDV traitée avec succès"
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
    }

    /// <summary>
    /// Annuler une demande de RDV
    /// </summary>
    [HttpPost("demandes/{id}/annuler")]
    public async Task<IActionResult> AnnulerDemandeRdv(int id)
    {
        var demande = await _rdvService.AnnulerDemandeRdvAsync(id);
        if (demande == null)
            return NotFound(new ApiResponse<object>
            {
                Success = false,
                Message = "Demande de RDV non trouvée"
            });
        return Ok(new ApiResponse<object>
        {
            Success = true,
            Data = demande,
            Message = "Demande de RDV annulée avec succès"
        });
    }

    #endregion
}

public class ReserverCreneauRequest
{
    public int InterventionId { get; set; }
}
