using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using SAV.Interventions.Application.Interfaces;
using SAV.Interventions.Domain.Entities;
using SAV.Interventions.Infrastructure.Data;
using System.Text;

namespace SAV.Interventions.Infrastructure.Services;

public class FacturationService : IFacturationService
{
    private readonly ILogger<FacturationService> _logger;
    private readonly InterventionsDbContext _context;

    public FacturationService(ILogger<FacturationService> logger, InterventionsDbContext context)
    {
        _logger = logger;
        _context = context;
        QuestPDF.Settings.License = LicenseType.Community;
    }

    public decimal CalculerMontantIntervention(Intervention intervention)
    {
        if (intervention.EstGratuite)
        {
            _logger.LogInformation("Intervention {InterventionId} est gratuite (sous garantie)", intervention.Id);
            return 0;
        }

        var montantPieces = intervention.PiecesUtilisees?.Sum(p => p.SousTotal) ?? 0;
        var montantMainOeuvre = intervention.MontantMainOeuvre ?? 0;
        var total = montantPieces + montantMainOeuvre;

        _logger.LogInformation(
            "Intervention {InterventionId} - Pièces: {MontantPieces:C}, Main d'œuvre: {MontantMainOeuvre:C}, Total: {Total:C}",
            intervention.Id, montantPieces, montantMainOeuvre, total);

        return total;
    }

    public bool PeutEtreFacturee(Intervention intervention)
    {
        // Une intervention peut être facturée si :
        // 1. Elle n'est pas gratuite
        // 2. Elle est terminée
        // 3. Elle a un montant > 0

        if (intervention.EstGratuite)
        {
            _logger.LogInformation("Intervention {InterventionId} ne peut pas être facturée (gratuite)", intervention.Id);
            return false;
        }

        if (intervention.Statut != InterventionStatut.Terminee)
        {
            _logger.LogInformation("Intervention {InterventionId} ne peut pas être facturée (statut: {Statut})", 
                intervention.Id, intervention.Statut);
            return false;
        }

        var montant = CalculerMontantIntervention(intervention);
        if (montant <= 0)
        {
            _logger.LogInformation("Intervention {InterventionId} ne peut pas être facturée (montant: {Montant})", 
                intervention.Id, montant);
            return false;
        }

        return true;
    }

    public string GenererResumeFacture(Intervention intervention)
    {
        var sb = new StringBuilder();
        sb.AppendLine("=== FACTURE D'INTERVENTION ===");
        sb.AppendLine($"Intervention N°: {intervention.Id}");
        sb.AppendLine($"Réclamation N°: {intervention.ReclamationId}");
        sb.AppendLine($"Date: {intervention.DateIntervention:dd/MM/yyyy}");
        sb.AppendLine($"Technicien: {intervention.TechnicienNom}");
        sb.AppendLine();

        if (intervention.EstGratuite)
        {
            sb.AppendLine("*** INTERVENTION GRATUITE (SOUS GARANTIE) ***");
            return sb.ToString();
        }

        sb.AppendLine("DÉTAIL DE LA FACTURATION:");
        sb.AppendLine();

        if (intervention.PiecesUtilisees != null && intervention.PiecesUtilisees.Any())
        {
            sb.AppendLine("Pièces détachées:");
            foreach (var piece in intervention.PiecesUtilisees)
            {
                sb.AppendLine($"  - Pièce #{piece.PieceDetacheeId}: {piece.Quantite} x {piece.PrixUnitaire:C} = {piece.SousTotal:C}");
            }
            sb.AppendLine($"  Sous-total pièces: {intervention.PiecesUtilisees.Sum(p => p.SousTotal):C}");
            sb.AppendLine();
        }

        if (intervention.MontantMainOeuvre.HasValue && intervention.MontantMainOeuvre > 0)
        {
            sb.AppendLine($"Main d'œuvre: {intervention.MontantMainOeuvre:C}");
            sb.AppendLine();
        }

        sb.AppendLine($"MONTANT TOTAL: {intervention.MontantTotal:C}");

        if (!string.IsNullOrWhiteSpace(intervention.Commentaire))
        {
            sb.AppendLine();
            sb.AppendLine($"Commentaire: {intervention.Commentaire}");
        }

        return sb.ToString();
    }

    public async Task<byte[]> GenererFacturePdfAsync(int interventionId)
    {
        var intervention = await _context.Interventions
            .Include(i => i.PiecesUtilisees)
            .Include(i => i.Technicien)
            .FirstOrDefaultAsync(i => i.Id == interventionId);

        if (intervention == null)
            throw new KeyNotFoundException("Intervention non trouvée");

        try
        {
            var document = Document.Create(container =>
            {
                container.Page(page =>
                {
                    page.Size(PageSizes.A4);
                    page.Margin(50);
                    page.DefaultTextStyle(x => x.FontSize(11));

                    page.Header().Element(c => ComposeHeader(c, "FACTURE"));
                    page.Content().Element(c => ComposeFactureContent(c, intervention));
                    page.Footer().Element(ComposeFooter);
                });
            });

            return document.GeneratePdf();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erreur lors de la génération de la facture PDF pour l'intervention {InterventionId}", interventionId);
            throw;
        }
    }

    public async Task<byte[]> GenererRapportInterventionPdfAsync(int interventionId)
    {
        var intervention = await _context.Interventions
            .Include(i => i.PiecesUtilisees)
            .Include(i => i.Technicien)
            .FirstOrDefaultAsync(i => i.Id == interventionId);

        if (intervention == null)
            throw new KeyNotFoundException("Intervention non trouvée");

        try
        {
            var document = Document.Create(container =>
            {
                container.Page(page =>
                {
                    page.Size(PageSizes.A4);
                    page.Margin(50);
                    page.DefaultTextStyle(x => x.FontSize(11));

                    page.Header().Element(c => ComposeHeader(c, "RAPPORT D'INTERVENTION"));
                    page.Content().Element(c => ComposeRapportContent(c, intervention));
                    page.Footer().Element(ComposeFooter);
                });
            });

            return document.GeneratePdf();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erreur lors de la génération du rapport PDF pour l'intervention {InterventionId}", interventionId);
            throw;
        }
    }

    public async Task<byte[]> GenererRapportMensuelPdfAsync(int mois, int annee)
    {
        var startDate = new DateTime(annee, mois, 1);
        var endDate = startDate.AddMonths(1);

        var interventions = await _context.Interventions
            .Include(i => i.PiecesUtilisees)
            .Include(i => i.Technicien)
            .Where(i => i.DateIntervention >= startDate && i.DateIntervention < endDate)
            .OrderBy(i => i.DateIntervention)
            .ToListAsync();

        var document = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4.Landscape());
                page.Margin(30);
                page.DefaultTextStyle(x => x.FontSize(10));

                page.Header().Element(c => ComposeHeader(c, $"RAPPORT MENSUEL - {startDate:MMMM yyyy}"));
                page.Content().Element(c => ComposeRapportMensuelContent(c, interventions, startDate));
                page.Footer().Element(ComposeFooter);
            });
        });

        return document.GeneratePdf();
    }

    private void ComposeHeader(IContainer container, string title)
    {
        container.Column(column =>
        {
            column.Item().Row(row =>
            {
                row.RelativeItem().Column(col =>
                {
                    col.Item().Text("SAV Pro").FontSize(20).Bold().FontColor(Colors.Blue.Darken2);
                    col.Item().Text("Service Après-Vente").FontSize(12).FontColor(Colors.Grey.Darken1);
                });

                row.RelativeItem().AlignRight().Column(col =>
                {
                    col.Item().Text(title).FontSize(18).Bold();
                    col.Item().Text($"Date: {DateTime.Now:dd/MM/yyyy}").FontSize(10);
                });
            });

            column.Item().PaddingBottom(20);
        });
    }

    private void ComposeFooter(IContainer container)
    {
        container.AlignCenter().Text(text =>
        {
            text.Span("Page ");
            text.CurrentPageNumber();
            text.Span(" sur ");
            text.TotalPages();
        });
    }

    private void ComposeFactureContent(IContainer container, Intervention intervention)
    {
        container.Column(col =>
        {
            // Informations intervention
            col.Item().Background(Colors.Grey.Lighten3).Padding(10).Row(row =>
            {
                row.RelativeItem().Column(c =>
                {
                    c.Item().Text($"Facture N°: FAC-{intervention.Id:D6}").Bold();
                    c.Item().Text($"Intervention N°: {intervention.Id}");
                    c.Item().Text($"Réclamation N°: {intervention.ReclamationId}");
                });
                row.RelativeItem().AlignRight().Column(c =>
                {
                    c.Item().Text($"Date: {intervention.DateIntervention:dd/MM/yyyy}");
                    c.Item().Text($"Technicien: {intervention.Technicien?.Prenom} {intervention.Technicien?.Nom}");
                    c.Item().Text($"Statut: {intervention.Statut}");
                });
            });

            col.Item().PaddingVertical(20);

            if (intervention.EstGratuite)
            {
                col.Item().Background(Colors.Green.Lighten3).Padding(15).AlignCenter()
                    .Text("INTERVENTION GRATUITE (SOUS GARANTIE)").Bold().FontSize(14);
            }
            else
            {
                // Tableau des pièces
                if (intervention.PiecesUtilisees?.Any() == true)
                {
                    col.Item().Text("Pièces détachées:").Bold();
                    col.Item().PaddingTop(5);
                    col.Item().Table(table =>
                    {
                        table.ColumnsDefinition(cols =>
                        {
                            cols.RelativeColumn(3);
                            cols.RelativeColumn(1);
                            cols.RelativeColumn(1);
                            cols.RelativeColumn(1);
                        });

                        table.Header(header =>
                        {
                            header.Cell().Background(Colors.Blue.Darken2).Padding(5).Text("Pièce").FontColor(Colors.White);
                            header.Cell().Background(Colors.Blue.Darken2).Padding(5).Text("Qté").FontColor(Colors.White);
                            header.Cell().Background(Colors.Blue.Darken2).Padding(5).Text("Prix U.").FontColor(Colors.White);
                            header.Cell().Background(Colors.Blue.Darken2).Padding(5).Text("Total").FontColor(Colors.White);
                        });

                        foreach (var piece in intervention.PiecesUtilisees)
                        {
                            table.Cell().BorderBottom(1).BorderColor(Colors.Grey.Lighten2).Padding(5).Text($"Pièce #{piece.PieceDetacheeId}");
                            table.Cell().BorderBottom(1).BorderColor(Colors.Grey.Lighten2).Padding(5).Text(piece.Quantite.ToString());
                            table.Cell().BorderBottom(1).BorderColor(Colors.Grey.Lighten2).Padding(5).Text($"{piece.PrixUnitaire:C}");
                            table.Cell().BorderBottom(1).BorderColor(Colors.Grey.Lighten2).Padding(5).Text($"{piece.SousTotal:C}");
                        }
                    });

                    col.Item().PaddingVertical(10);
                }

                // Résumé
                col.Item().AlignRight().Width(200).Column(summary =>
                {
                    summary.Item().Row(r =>
                    {
                        r.RelativeItem().Text("Sous-total pièces:");
                        r.RelativeItem().AlignRight().Text($"{intervention.PiecesUtilisees?.Sum(p => p.SousTotal) ?? 0:C}");
                    });
                    summary.Item().Row(r =>
                    {
                        r.RelativeItem().Text("Main d'œuvre:");
                        r.RelativeItem().AlignRight().Text($"{intervention.MontantMainOeuvre ?? 0:C}");
                    });
                    summary.Item().PaddingTop(5).BorderTop(2).BorderColor(Colors.Blue.Darken2).Row(r =>
                    {
                        r.RelativeItem().Text("TOTAL TTC:").Bold();
                        r.RelativeItem().AlignRight().Text($"{intervention.MontantTotal:C}").Bold().FontSize(14);
                    });
                });
            }

            // Commentaire
            if (!string.IsNullOrWhiteSpace(intervention.Commentaire))
            {
                col.Item().PaddingTop(20);
                col.Item().Text("Commentaire:").Bold();
                col.Item().Background(Colors.Grey.Lighten4).Padding(10).Text(intervention.Commentaire);
            }
        });
    }

    private void ComposeRapportContent(IContainer container, Intervention intervention)
    {
        container.Column(col =>
        {
            col.Item().Text($"Rapport d'Intervention N°{intervention.Id}").FontSize(16).Bold();
            col.Item().PaddingVertical(10);

            col.Item().Row(row =>
            {
                row.RelativeItem().Column(c =>
                {
                    c.Item().Text("Informations générales").Bold().FontSize(12);
                    c.Item().PaddingTop(5);
                    c.Item().Text($"• Date d'intervention: {intervention.DateIntervention:dd/MM/yyyy HH:mm}");
                    c.Item().Text($"• Réclamation associée: #{intervention.ReclamationId}");
                    c.Item().Text($"• Statut: {intervention.Statut}");
                    c.Item().Text($"• Sous garantie: {(intervention.EstGratuite ? "Oui" : "Non")}");
                });
                row.RelativeItem().Column(c =>
                {
                    c.Item().Text("Technicien").Bold().FontSize(12);
                    c.Item().PaddingTop(5);
                    if (intervention.Technicien != null)
                    {
                        c.Item().Text($"• Nom: {intervention.Technicien.Prenom} {intervention.Technicien.Nom}");
                        c.Item().Text($"• Spécialité: {intervention.Technicien.Specialite}");
                        c.Item().Text($"• Email: {intervention.Technicien.Email}");
                        c.Item().Text($"• Tél: {intervention.Technicien.Telephone}");
                    }
                    else
                    {
                        c.Item().Text($"• {intervention.TechnicienNom}");
                    }
                });
            });

            col.Item().PaddingVertical(15);

            if (intervention.PiecesUtilisees?.Any() == true)
            {
                col.Item().Text("Pièces utilisées").Bold().FontSize(12);
                col.Item().PaddingTop(5);
                foreach (var piece in intervention.PiecesUtilisees)
                {
                    col.Item().Text($"• Pièce #{piece.PieceDetacheeId}: {piece.Quantite} unité(s) à {piece.PrixUnitaire:C} = {piece.SousTotal:C}");
                }
            }

            col.Item().PaddingVertical(15);

            col.Item().Background(Colors.Blue.Lighten4).Padding(15).Row(row =>
            {
                row.RelativeItem().Text("Montant total de l'intervention:").Bold();
                row.RelativeItem().AlignRight().Text($"{intervention.MontantTotal:C}").Bold().FontSize(16);
            });

            if (!string.IsNullOrWhiteSpace(intervention.Commentaire))
            {
                col.Item().PaddingTop(15);
                col.Item().Text("Notes et observations").Bold().FontSize(12);
                col.Item().PaddingTop(5).Background(Colors.Grey.Lighten4).Padding(10).Text(intervention.Commentaire);
            }
        });
    }

    private void ComposeRapportMensuelContent(IContainer container, List<Intervention> interventions, DateTime mois)
    {
        container.Column(col =>
        {
            // Statistiques
            col.Item().Row(row =>
            {
                row.RelativeItem().Background(Colors.Blue.Lighten4).Padding(10).Column(c =>
                {
                    c.Item().Text("Total interventions").FontSize(10);
                    c.Item().Text(interventions.Count.ToString()).FontSize(24).Bold();
                });
                row.ConstantItem(10);
                row.RelativeItem().Background(Colors.Green.Lighten4).Padding(10).Column(c =>
                {
                    c.Item().Text("Terminées").FontSize(10);
                    c.Item().Text(interventions.Count(i => i.Statut == InterventionStatut.Terminee).ToString()).FontSize(24).Bold();
                });
                row.ConstantItem(10);
                row.RelativeItem().Background(Colors.Orange.Lighten4).Padding(10).Column(c =>
                {
                    c.Item().Text("En cours").FontSize(10);
                    c.Item().Text(interventions.Count(i => i.Statut == InterventionStatut.EnCours).ToString()).FontSize(24).Bold();
                });
                row.ConstantItem(10);
                row.RelativeItem().Background(Colors.Grey.Lighten3).Padding(10).Column(c =>
                {
                    c.Item().Text("Chiffre d'affaires").FontSize(10);
                    c.Item().Text($"{interventions.Sum(i => i.MontantTotal):C}").FontSize(20).Bold();
                });
            });

            col.Item().PaddingVertical(20);

            // Tableau détaillé
            col.Item().Table(table =>
            {
                table.ColumnsDefinition(cols =>
                {
                    cols.ConstantColumn(50);
                    cols.ConstantColumn(80);
                    cols.RelativeColumn(2);
                    cols.RelativeColumn(1);
                    cols.ConstantColumn(80);
                    cols.ConstantColumn(80);
                });

                table.Header(header =>
                {
                    header.Cell().Background(Colors.Blue.Darken2).Padding(5).Text("N°").FontColor(Colors.White);
                    header.Cell().Background(Colors.Blue.Darken2).Padding(5).Text("Date").FontColor(Colors.White);
                    header.Cell().Background(Colors.Blue.Darken2).Padding(5).Text("Technicien").FontColor(Colors.White);
                    header.Cell().Background(Colors.Blue.Darken2).Padding(5).Text("Statut").FontColor(Colors.White);
                    header.Cell().Background(Colors.Blue.Darken2).Padding(5).Text("Garantie").FontColor(Colors.White);
                    header.Cell().Background(Colors.Blue.Darken2).Padding(5).Text("Montant").FontColor(Colors.White);
                });

                foreach (var intervention in interventions)
                {
                    var bgColor = intervention.Statut == InterventionStatut.Terminee ? Colors.White : Colors.Orange.Lighten5;
                    table.Cell().Background(bgColor).BorderBottom(1).BorderColor(Colors.Grey.Lighten2).Padding(5).Text(intervention.Id.ToString());
                    table.Cell().Background(bgColor).BorderBottom(1).BorderColor(Colors.Grey.Lighten2).Padding(5).Text(intervention.DateIntervention.ToString("dd/MM/yyyy"));
                    table.Cell().Background(bgColor).BorderBottom(1).BorderColor(Colors.Grey.Lighten2).Padding(5).Text(intervention.Technicien != null ? $"{intervention.Technicien.Prenom} {intervention.Technicien.Nom}" : intervention.TechnicienNom);
                    table.Cell().Background(bgColor).BorderBottom(1).BorderColor(Colors.Grey.Lighten2).Padding(5).Text(intervention.Statut.ToString());
                    table.Cell().Background(bgColor).BorderBottom(1).BorderColor(Colors.Grey.Lighten2).Padding(5).Text(intervention.EstGratuite ? "Oui" : "Non");
                    table.Cell().Background(bgColor).BorderBottom(1).BorderColor(Colors.Grey.Lighten2).Padding(5).Text($"{intervention.MontantTotal:C}");
                }
            });
        });
    }
}
