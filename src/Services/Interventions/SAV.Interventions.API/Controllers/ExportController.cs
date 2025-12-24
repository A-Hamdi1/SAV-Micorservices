using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SAV.Interventions.Application.Interfaces;

namespace SAV.Interventions.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "ResponsableSAV")]
public class ExportController : ControllerBase
{
    private readonly IExportService _exportService;

    public ExportController(IExportService exportService)
    {
        _exportService = exportService;
    }

    /// <summary>
    /// Exporter les interventions vers Excel
    /// </summary>
    [HttpGet("interventions")]
    public async Task<IActionResult> ExportInterventions(
        [FromQuery] DateTime? dateDebut = null,
        [FromQuery] DateTime? dateFin = null,
        [FromQuery] int? technicienId = null,
        [FromQuery] string? statut = null)
    {
        var filter = new InterventionExportFilterDto
        {
            DateDebut = dateDebut,
            DateFin = dateFin,
            TechnicienId = technicienId,
            Statut = statut
        };

        var excelData = await _exportService.ExportInterventionsToExcelAsync(filter);
        var fileName = $"Interventions_{DateTime.Now:yyyyMMdd_HHmmss}.xlsx";
        
        return File(excelData, 
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", 
            fileName);
    }

    /// <summary>
    /// Exporter les réclamations vers Excel
    /// </summary>
    [HttpGet("reclamations")]
    public async Task<IActionResult> ExportReclamations(
        [FromQuery] DateTime? dateDebut = null,
        [FromQuery] DateTime? dateFin = null,
        [FromQuery] int? clientId = null,
        [FromQuery] string? statut = null)
    {
        var filter = new ReclamationExportFilterDto
        {
            DateDebut = dateDebut,
            DateFin = dateFin,
            ClientId = clientId,
            Statut = statut
        };

        var excelData = await _exportService.ExportReclamationsToExcelAsync(filter);
        var fileName = $"Reclamations_{DateTime.Now:yyyyMMdd_HHmmss}.xlsx";
        
        return File(excelData, 
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", 
            fileName);
    }

    /// <summary>
    /// Exporter les factures vers Excel
    /// </summary>
    [HttpGet("factures")]
    public async Task<IActionResult> ExportFactures(
        [FromQuery] DateTime? dateDebut = null,
        [FromQuery] DateTime? dateFin = null)
    {
        var excelData = await _exportService.ExportFacturesToExcelAsync(dateDebut, dateFin);
        var fileName = $"Factures_{DateTime.Now:yyyyMMdd_HHmmss}.xlsx";
        
        return File(excelData, 
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", 
            fileName);
    }

    /// <summary>
    /// Exporter les statistiques techniciens vers Excel
    /// </summary>
    [HttpGet("techniciens-stats")]
    public async Task<IActionResult> ExportTechniciensStats(
        [FromQuery] int? mois = null,
        [FromQuery] int? annee = null)
    {
        var excelData = await _exportService.ExportTechniciensStatsToExcelAsync(mois, annee);
        var fileName = $"Stats_Techniciens_{DateTime.Now:yyyyMMdd_HHmmss}.xlsx";
        
        return File(excelData, 
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", 
            fileName);
    }

    /// <summary>
    /// Exporter le rapport mensuel complet vers Excel
    /// </summary>
    [HttpGet("rapport-mensuel/{annee}/{mois}")]
    public async Task<IActionResult> ExportRapportMensuel(int annee, int mois)
    {
        if (mois < 1 || mois > 12)
            return BadRequest("Le mois doit être entre 1 et 12");

        if (annee < 2020 || annee > DateTime.Now.Year + 1)
            return BadRequest("Année invalide");

        var excelData = await _exportService.ExportRapportMensuelToExcelAsync(mois, annee);
        var fileName = $"Rapport_Mensuel_{annee}_{mois:D2}.xlsx";
        
        return File(excelData, 
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", 
            fileName);
    }
}
