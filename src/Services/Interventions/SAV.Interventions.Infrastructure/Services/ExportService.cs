using ClosedXML.Excel;
using Microsoft.EntityFrameworkCore;
using SAV.Interventions.Application.Interfaces;
using SAV.Interventions.Domain.Entities;
using SAV.Interventions.Infrastructure.Data;

namespace SAV.Interventions.Infrastructure.Services;

/// <summary>
/// Service d'export de données vers Excel utilisant ClosedXML
/// </summary>
public class ExportService : IExportService
{
    private readonly InterventionsDbContext _context;

    public ExportService(InterventionsDbContext context)
    {
        _context = context;
    }

    public async Task<byte[]> ExportInterventionsToExcelAsync(InterventionExportFilterDto? filter = null)
    {
        var query = _context.Interventions
            .Include(i => i.Technicien)
            .Include(i => i.PiecesUtilisees)
            .AsQueryable();

        if (filter != null)
        {
            if (filter.DateDebut.HasValue)
                query = query.Where(i => i.DateIntervention >= filter.DateDebut.Value);
            if (filter.DateFin.HasValue)
                query = query.Where(i => i.DateIntervention <= filter.DateFin.Value);
            if (filter.TechnicienId.HasValue)
                query = query.Where(i => i.TechnicienId == filter.TechnicienId.Value);
            if (!string.IsNullOrEmpty(filter.Statut))
                query = query.Where(i => i.Statut.ToString() == filter.Statut);
        }

        var interventions = await query.OrderByDescending(i => i.DateIntervention).ToListAsync();

        using var workbook = new XLWorkbook();
        var worksheet = workbook.Worksheets.Add("Interventions");

        // En-têtes
        var headers = new[] { "ID", "Réclamation ID", "Technicien", "Date Intervention", 
            "Statut", "Est Gratuite", "Commentaire", "Main d'œuvre", "Pièces", "Total" };
        for (int i = 0; i < headers.Length; i++)
        {
            worksheet.Cell(1, i + 1).Value = headers[i];
            worksheet.Cell(1, i + 1).Style.Font.Bold = true;
            worksheet.Cell(1, i + 1).Style.Fill.BackgroundColor = XLColor.LightBlue;
        }

        // Données
        int row = 2;
        foreach (var intervention in interventions)
        {
            var technicienNom = intervention.Technicien != null 
                ? $"{intervention.Technicien.Prenom} {intervention.Technicien.Nom}" 
                : intervention.TechnicienNom;
            var montantPieces = intervention.PiecesUtilisees?.Sum(p => p.Quantite * p.PrixUnitaire) ?? 0;
            
            worksheet.Cell(row, 1).Value = intervention.Id;
            worksheet.Cell(row, 2).Value = intervention.ReclamationId;
            worksheet.Cell(row, 3).Value = technicienNom;
            worksheet.Cell(row, 4).Value = intervention.DateIntervention;
            worksheet.Cell(row, 5).Value = intervention.Statut.ToString();
            worksheet.Cell(row, 6).Value = intervention.EstGratuite ? "Oui" : "Non";
            worksheet.Cell(row, 7).Value = intervention.Commentaire ?? "";
            worksheet.Cell(row, 8).Value = intervention.MontantMainOeuvre ?? 0;
            worksheet.Cell(row, 9).Value = montantPieces;
            worksheet.Cell(row, 10).Value = intervention.MontantTotal;
            row++;
        }

        // Ajuster la largeur des colonnes
        worksheet.Columns().AdjustToContents();

        // Ajouter une ligne de résumé
        row++;
        worksheet.Cell(row, 1).Value = "TOTAL";
        worksheet.Cell(row, 1).Style.Font.Bold = true;
        worksheet.Cell(row, 8).Value = interventions.Sum(i => i.MontantMainOeuvre ?? 0);
        worksheet.Cell(row, 9).Value = interventions.Sum(i => i.PiecesUtilisees?.Sum(p => p.Quantite * p.PrixUnitaire) ?? 0);
        worksheet.Cell(row, 10).Value = interventions.Sum(i => i.MontantTotal);
        worksheet.Cell(row, 8).Style.Font.Bold = true;
        worksheet.Cell(row, 9).Style.Font.Bold = true;
        worksheet.Cell(row, 10).Style.Font.Bold = true;

        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        return stream.ToArray();
    }

    public async Task<byte[]> ExportReclamationsToExcelAsync(ReclamationExportFilterDto? filter = null)
    {
        // Note: Les réclamations sont gérées par le service Clients
        // Cet export génère un rapport basé sur les interventions et leurs réclamations associées
        
        var query = _context.Interventions
            .Include(i => i.Technicien)
            .AsQueryable();

        if (filter != null)
        {
            if (filter.DateDebut.HasValue)
                query = query.Where(i => i.CreatedAt >= filter.DateDebut.Value);
            if (filter.DateFin.HasValue)
                query = query.Where(i => i.CreatedAt <= filter.DateFin.Value);
            if (!string.IsNullOrEmpty(filter.Statut))
                query = query.Where(i => i.Statut.ToString() == filter.Statut);
        }

        var interventions = await query.OrderByDescending(i => i.CreatedAt).ToListAsync();

        using var workbook = new XLWorkbook();
        var worksheet = workbook.Worksheets.Add("Réclamations-Interventions");

        var headers = new[] { "ID Intervention", "Réclamation ID", "Technicien", "Date", 
            "Statut", "Est Gratuite", "Montant Total" };
        for (int i = 0; i < headers.Length; i++)
        {
            worksheet.Cell(1, i + 1).Value = headers[i];
            worksheet.Cell(1, i + 1).Style.Font.Bold = true;
            worksheet.Cell(1, i + 1).Style.Fill.BackgroundColor = XLColor.LightGreen;
        }

        int row = 2;
        foreach (var intervention in interventions)
        {
            var technicienNom = intervention.Technicien != null 
                ? $"{intervention.Technicien.Prenom} {intervention.Technicien.Nom}" 
                : intervention.TechnicienNom;
                
            worksheet.Cell(row, 1).Value = intervention.Id;
            worksheet.Cell(row, 2).Value = intervention.ReclamationId;
            worksheet.Cell(row, 3).Value = technicienNom;
            worksheet.Cell(row, 4).Value = intervention.DateIntervention;
            worksheet.Cell(row, 5).Value = intervention.Statut.ToString();
            worksheet.Cell(row, 6).Value = intervention.EstGratuite ? "Oui" : "Non";
            worksheet.Cell(row, 7).Value = intervention.MontantTotal;
            row++;
        }

        worksheet.Columns().AdjustToContents();

        // Statistiques
        row += 2;
        worksheet.Cell(row, 1).Value = "STATISTIQUES";
        worksheet.Cell(row, 1).Style.Font.Bold = true;
        row++;
        worksheet.Cell(row, 1).Value = "Total Interventions:";
        worksheet.Cell(row, 2).Value = interventions.Count;
        row++;
        worksheet.Cell(row, 1).Value = "Terminées:";
        worksheet.Cell(row, 2).Value = interventions.Count(i => i.Statut == InterventionStatut.Terminee);
        row++;
        worksheet.Cell(row, 1).Value = "En Cours:";
        worksheet.Cell(row, 2).Value = interventions.Count(i => i.Statut == InterventionStatut.EnCours);
        row++;
        worksheet.Cell(row, 1).Value = "Planifiées:";
        worksheet.Cell(row, 2).Value = interventions.Count(i => i.Statut == InterventionStatut.Planifiee);

        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        return stream.ToArray();
    }

    public async Task<byte[]> ExportFacturesToExcelAsync(DateTime? dateDebut = null, DateTime? dateFin = null)
    {
        // Note: Les factures sont générées à partir des interventions terminées
        var query = _context.Interventions
            .Include(i => i.Technicien)
            .Include(i => i.PiecesUtilisees)
            .Where(i => i.Statut == InterventionStatut.Terminee && !i.EstGratuite)
            .AsQueryable();

        if (dateDebut.HasValue)
            query = query.Where(i => i.DateIntervention >= dateDebut.Value);
        if (dateFin.HasValue)
            query = query.Where(i => i.DateIntervention <= dateFin.Value);

        var interventions = await query.OrderByDescending(i => i.DateIntervention).ToListAsync();

        using var workbook = new XLWorkbook();
        var worksheet = workbook.Worksheets.Add("Factures");

        var headers = new[] { "N° Facture", "Intervention ID", "Technicien", "Date", 
            "Montant HT", "TVA (20%)", "Montant TTC" };
        for (int i = 0; i < headers.Length; i++)
        {
            worksheet.Cell(1, i + 1).Value = headers[i];
            worksheet.Cell(1, i + 1).Style.Font.Bold = true;
            worksheet.Cell(1, i + 1).Style.Fill.BackgroundColor = XLColor.LightYellow;
        }

        int row = 2;
        int numeroFacture = 1;
        decimal totalHT = 0;
        decimal totalTVA = 0;
        decimal totalTTC = 0;

        foreach (var intervention in interventions)
        {
            var technicienNom = intervention.Technicien != null 
                ? $"{intervention.Technicien.Prenom} {intervention.Technicien.Nom}" 
                : intervention.TechnicienNom;
            
            var montantHT = intervention.MontantTotal;
            var montantTVA = montantHT * 0.20m;
            var montantTTC = montantHT + montantTVA;

            totalHT += montantHT;
            totalTVA += montantTVA;
            totalTTC += montantTTC;

            worksheet.Cell(row, 1).Value = $"FAC-{intervention.DateIntervention:yyyyMM}-{numeroFacture:D4}";
            worksheet.Cell(row, 2).Value = intervention.Id;
            worksheet.Cell(row, 3).Value = technicienNom;
            worksheet.Cell(row, 4).Value = intervention.DateIntervention;
            worksheet.Cell(row, 5).Value = montantHT;
            worksheet.Cell(row, 6).Value = montantTVA;
            worksheet.Cell(row, 7).Value = montantTTC;
            
            // Format monétaire
            worksheet.Cell(row, 5).Style.NumberFormat.Format = "#,##0.00 €";
            worksheet.Cell(row, 6).Style.NumberFormat.Format = "#,##0.00 €";
            worksheet.Cell(row, 7).Style.NumberFormat.Format = "#,##0.00 €";
            
            row++;
            numeroFacture++;
        }

        worksheet.Columns().AdjustToContents();

        // Totaux
        row++;
        worksheet.Cell(row, 1).Value = "TOTAUX";
        worksheet.Cell(row, 1).Style.Font.Bold = true;
        worksheet.Cell(row, 5).Value = totalHT;
        worksheet.Cell(row, 6).Value = totalTVA;
        worksheet.Cell(row, 7).Value = totalTTC;
        worksheet.Cell(row, 5).Style.Font.Bold = true;
        worksheet.Cell(row, 6).Style.Font.Bold = true;
        worksheet.Cell(row, 7).Style.Font.Bold = true;
        worksheet.Cell(row, 5).Style.NumberFormat.Format = "#,##0.00 €";
        worksheet.Cell(row, 6).Style.NumberFormat.Format = "#,##0.00 €";
        worksheet.Cell(row, 7).Style.NumberFormat.Format = "#,##0.00 €";

        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        return stream.ToArray();
    }

    public async Task<byte[]> ExportTechniciensStatsToExcelAsync(int? mois = null, int? annee = null)
    {
        var dateDebut = mois.HasValue && annee.HasValue 
            ? new DateTime(annee.Value, mois.Value, 1) 
            : new DateTime(DateTime.Now.Year, DateTime.Now.Month, 1).AddMonths(-1);
        var dateFin = dateDebut.AddMonths(1);

        var interventions = await _context.Interventions
            .Include(i => i.Technicien)
            .Include(i => i.PiecesUtilisees)
            .Where(i => i.DateIntervention >= dateDebut && i.DateIntervention < dateFin)
            .ToListAsync();

        var techniciens = await _context.Techniciens.ToListAsync();
        var evaluations = await _context.Evaluations
            .Where(e => interventions.Select(i => i.Id).Contains(e.InterventionId))
            .ToListAsync();

        var statsByTechnicien = techniciens.Select(t =>
        {
            var techInterventions = interventions.Where(i => i.TechnicienId == t.Id).ToList();
            var techEvaluations = evaluations.Where(e => techInterventions.Select(i => i.Id).Contains(e.InterventionId)).ToList();
            
            return new
            {
                TechnicienId = t.Id,
                TechnicienNom = $"{t.Prenom} {t.Nom}",
                NombreInterventions = techInterventions.Count,
                InterventionsTerminees = techInterventions.Count(i => i.Statut == InterventionStatut.Terminee),
                ChiffreAffaires = techInterventions.Sum(i => i.MontantTotal),
                NoteMoyenne = techEvaluations.Any() ? techEvaluations.Average(e => e.Note) : 0
            };
        }).Where(s => s.NombreInterventions > 0).ToList();

        using var workbook = new XLWorkbook();
        var worksheet = workbook.Worksheets.Add("Stats Techniciens");

        worksheet.Cell(1, 1).Value = $"Statistiques Techniciens - {dateDebut:MMMM yyyy}";
        worksheet.Cell(1, 1).Style.Font.Bold = true;
        worksheet.Cell(1, 1).Style.Font.FontSize = 14;
        worksheet.Range(1, 1, 1, 6).Merge();

        var headers = new[] { "Technicien", "Interventions", "Terminées", "Taux Réussite", "CA Total", "Note Moyenne" };
        for (int i = 0; i < headers.Length; i++)
        {
            worksheet.Cell(3, i + 1).Value = headers[i];
            worksheet.Cell(3, i + 1).Style.Font.Bold = true;
            worksheet.Cell(3, i + 1).Style.Fill.BackgroundColor = XLColor.LightCoral;
        }

        int row = 4;
        foreach (var stat in statsByTechnicien.OrderByDescending(s => s.ChiffreAffaires))
        {
            var tauxReussite = stat.NombreInterventions > 0 
                ? (double)stat.InterventionsTerminees / stat.NombreInterventions * 100 
                : 0;
                
            worksheet.Cell(row, 1).Value = stat.TechnicienNom;
            worksheet.Cell(row, 2).Value = stat.NombreInterventions;
            worksheet.Cell(row, 3).Value = stat.InterventionsTerminees;
            worksheet.Cell(row, 4).Value = $"{tauxReussite:F1}%";
            worksheet.Cell(row, 5).Value = stat.ChiffreAffaires;
            worksheet.Cell(row, 6).Value = stat.NoteMoyenne > 0 ? $"{stat.NoteMoyenne:F1}/5" : "N/A";
            worksheet.Cell(row, 5).Style.NumberFormat.Format = "#,##0.00 €";
            row++;
        }

        worksheet.Columns().AdjustToContents();

        // Totaux
        row++;
        worksheet.Cell(row, 1).Value = "TOTAL";
        worksheet.Cell(row, 1).Style.Font.Bold = true;
        worksheet.Cell(row, 2).Value = statsByTechnicien.Sum(s => s.NombreInterventions);
        worksheet.Cell(row, 3).Value = statsByTechnicien.Sum(s => s.InterventionsTerminees);
        worksheet.Cell(row, 5).Value = statsByTechnicien.Sum(s => s.ChiffreAffaires);
        worksheet.Cell(row, 5).Style.NumberFormat.Format = "#,##0.00 €";

        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        return stream.ToArray();
    }

    public async Task<byte[]> ExportRapportMensuelToExcelAsync(int mois, int annee)
    {
        var dateDebut = new DateTime(annee, mois, 1);
        var dateFin = dateDebut.AddMonths(1);

        using var workbook = new XLWorkbook();

        // Feuille 1: Résumé
        var summarySheet = workbook.Worksheets.Add("Résumé");
        summarySheet.Cell(1, 1).Value = $"Rapport Mensuel SAV - {dateDebut:MMMM yyyy}";
        summarySheet.Cell(1, 1).Style.Font.Bold = true;
        summarySheet.Cell(1, 1).Style.Font.FontSize = 16;
        summarySheet.Range(1, 1, 1, 4).Merge();

        var interventions = await _context.Interventions
            .Include(i => i.Technicien)
            .Include(i => i.PiecesUtilisees)
            .Where(i => i.DateIntervention >= dateDebut && i.DateIntervention < dateFin)
            .ToListAsync();

        var evaluations = await _context.Evaluations
            .Where(e => interventions.Select(i => i.Id).Contains(e.InterventionId))
            .ToListAsync();

        int row = 3;
        summarySheet.Cell(row, 1).Value = "INTERVENTIONS";
        summarySheet.Cell(row, 1).Style.Font.Bold = true;
        row++;
        summarySheet.Cell(row, 1).Value = "Total:";
        summarySheet.Cell(row, 2).Value = interventions.Count;
        row++;
        summarySheet.Cell(row, 1).Value = "Terminées:";
        summarySheet.Cell(row, 2).Value = interventions.Count(i => i.Statut == InterventionStatut.Terminee);
        row++;
        summarySheet.Cell(row, 1).Value = "En cours:";
        summarySheet.Cell(row, 2).Value = interventions.Count(i => i.Statut == InterventionStatut.EnCours);
        row++;
        summarySheet.Cell(row, 1).Value = "Planifiées:";
        summarySheet.Cell(row, 2).Value = interventions.Count(i => i.Statut == InterventionStatut.Planifiee);
        row++;
        summarySheet.Cell(row, 1).Value = "Annulées:";
        summarySheet.Cell(row, 2).Value = interventions.Count(i => i.Statut == InterventionStatut.Annulee);
        row++;
        summarySheet.Cell(row, 1).Value = "Taux de réussite:";
        var tauxReussite = interventions.Count > 0 
            ? (double)interventions.Count(i => i.Statut == InterventionStatut.Terminee) / interventions.Count * 100 
            : 0;
        summarySheet.Cell(row, 2).Value = $"{tauxReussite:F1}%";

        row += 2;
        summarySheet.Cell(row, 1).Value = "FACTURATION";
        summarySheet.Cell(row, 1).Style.Font.Bold = true;
        row++;
        var interventionsPayantes = interventions.Where(i => !i.EstGratuite && i.Statut == InterventionStatut.Terminee).ToList();
        var caHT = interventionsPayantes.Sum(i => i.MontantTotal);
        var caTTC = caHT * 1.20m;
        
        summarySheet.Cell(row, 1).Value = "Interventions payantes:";
        summarySheet.Cell(row, 2).Value = interventionsPayantes.Count;
        row++;
        summarySheet.Cell(row, 1).Value = "Interventions gratuites:";
        summarySheet.Cell(row, 2).Value = interventions.Count(i => i.EstGratuite);
        row++;
        summarySheet.Cell(row, 1).Value = "CA HT:";
        summarySheet.Cell(row, 2).Value = caHT;
        summarySheet.Cell(row, 2).Style.NumberFormat.Format = "#,##0.00 €";
        row++;
        summarySheet.Cell(row, 1).Value = "CA TTC:";
        summarySheet.Cell(row, 2).Value = caTTC;
        summarySheet.Cell(row, 2).Style.NumberFormat.Format = "#,##0.00 €";

        row += 2;
        summarySheet.Cell(row, 1).Value = "SATISFACTION CLIENT";
        summarySheet.Cell(row, 1).Style.Font.Bold = true;
        row++;
        summarySheet.Cell(row, 1).Value = "Évaluations reçues:";
        summarySheet.Cell(row, 2).Value = evaluations.Count;
        row++;
        summarySheet.Cell(row, 1).Value = "Note moyenne:";
        summarySheet.Cell(row, 2).Value = evaluations.Any() ? $"{evaluations.Average(e => e.Note):F1}/5" : "N/A";

        summarySheet.Columns().AdjustToContents();

        // Feuille 2: Détail Interventions
        var interventionsSheet = workbook.Worksheets.Add("Interventions");
        var intHeaders = new[] { "ID", "Réclamation", "Technicien", "Date", "Statut", "Gratuite", "Montant" };
        for (int i = 0; i < intHeaders.Length; i++)
        {
            interventionsSheet.Cell(1, i + 1).Value = intHeaders[i];
            interventionsSheet.Cell(1, i + 1).Style.Font.Bold = true;
            interventionsSheet.Cell(1, i + 1).Style.Fill.BackgroundColor = XLColor.LightBlue;
        }

        row = 2;
        foreach (var intervention in interventions.OrderBy(i => i.DateIntervention))
        {
            var technicienNom = intervention.Technicien != null 
                ? $"{intervention.Technicien.Prenom} {intervention.Technicien.Nom}" 
                : intervention.TechnicienNom;
                
            interventionsSheet.Cell(row, 1).Value = intervention.Id;
            interventionsSheet.Cell(row, 2).Value = intervention.ReclamationId;
            interventionsSheet.Cell(row, 3).Value = technicienNom;
            interventionsSheet.Cell(row, 4).Value = intervention.DateIntervention;
            interventionsSheet.Cell(row, 5).Value = intervention.Statut.ToString();
            interventionsSheet.Cell(row, 6).Value = intervention.EstGratuite ? "Oui" : "Non";
            interventionsSheet.Cell(row, 7).Value = intervention.MontantTotal;
            interventionsSheet.Cell(row, 7).Style.NumberFormat.Format = "#,##0.00 €";
            row++;
        }
        interventionsSheet.Columns().AdjustToContents();

        // Feuille 3: Évaluations
        var evalSheet = workbook.Worksheets.Add("Évaluations");
        var evalHeaders = new[] { "Intervention", "Client ID", "Note", "Commentaire", "Recommande" };
        for (int i = 0; i < evalHeaders.Length; i++)
        {
            evalSheet.Cell(1, i + 1).Value = evalHeaders[i];
            evalSheet.Cell(1, i + 1).Style.Font.Bold = true;
            evalSheet.Cell(1, i + 1).Style.Fill.BackgroundColor = XLColor.LightGreen;
        }

        row = 2;
        foreach (var eval in evaluations.OrderByDescending(e => e.CreatedAt))
        {
            evalSheet.Cell(row, 1).Value = eval.InterventionId;
            evalSheet.Cell(row, 2).Value = eval.ClientId;
            evalSheet.Cell(row, 3).Value = $"{eval.Note}/5";
            evalSheet.Cell(row, 4).Value = eval.Commentaire ?? "";
            evalSheet.Cell(row, 5).Value = eval.RecommandeTechnicien ? "Oui" : "Non";
            row++;
        }
        evalSheet.Columns().AdjustToContents();

        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        return stream.ToArray();
    }
}
