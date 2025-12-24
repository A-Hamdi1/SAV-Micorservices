using SAV.Shared.DTOs.Interventions;

namespace SAV.Interventions.Application.Interfaces;

/// <summary>
/// Service d'export de données vers Excel
/// </summary>
public interface IExportService
{
    /// <summary>
    /// Exporter les interventions vers Excel
    /// </summary>
    Task<byte[]> ExportInterventionsToExcelAsync(InterventionExportFilterDto? filter = null);
    
    /// <summary>
    /// Exporter les réclamations vers Excel
    /// </summary>
    Task<byte[]> ExportReclamationsToExcelAsync(ReclamationExportFilterDto? filter = null);
    
    /// <summary>
    /// Exporter les factures vers Excel
    /// </summary>
    Task<byte[]> ExportFacturesToExcelAsync(DateTime? dateDebut = null, DateTime? dateFin = null);
    
    /// <summary>
    /// Exporter les statistiques techniciens vers Excel
    /// </summary>
    Task<byte[]> ExportTechniciensStatsToExcelAsync(int? mois = null, int? annee = null);
    
    /// <summary>
    /// Exporter le rapport mensuel complet vers Excel
    /// </summary>
    Task<byte[]> ExportRapportMensuelToExcelAsync(int mois, int annee);
}

public class InterventionExportFilterDto
{
    public DateTime? DateDebut { get; set; }
    public DateTime? DateFin { get; set; }
    public int? TechnicienId { get; set; }
    public string? Statut { get; set; }
}

public class ReclamationExportFilterDto
{
    public DateTime? DateDebut { get; set; }
    public DateTime? DateFin { get; set; }
    public int? ClientId { get; set; }
    public string? Statut { get; set; }
}
