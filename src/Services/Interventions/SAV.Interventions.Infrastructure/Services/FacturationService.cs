using Microsoft.Extensions.Logging;
using SAV.Interventions.Application.Interfaces;
using SAV.Interventions.Domain.Entities;
using System.Text;

namespace SAV.Interventions.Infrastructure.Services;

public class FacturationService : IFacturationService
{
    private readonly ILogger<FacturationService> _logger;

    public FacturationService(ILogger<FacturationService> logger)
    {
        _logger = logger;
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
}
