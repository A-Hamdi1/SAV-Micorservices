using SAV.Interventions.Domain.Entities;

namespace SAV.Interventions.Application.Interfaces;

public interface IFacturationService
{
    decimal CalculerMontantIntervention(Intervention intervention);
    bool PeutEtreFacturee(Intervention intervention);
    string GenererResumeFacture(Intervention intervention);
    Task<byte[]> GenererFacturePdfAsync(int interventionId);
    Task<byte[]> GenererRapportInterventionPdfAsync(int interventionId);
    Task<byte[]> GenererRapportMensuelPdfAsync(int mois, int annee);
}
