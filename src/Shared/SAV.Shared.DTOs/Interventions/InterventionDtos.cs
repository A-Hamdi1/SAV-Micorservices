namespace SAV.Shared.DTOs.Interventions;

public class InterventionDto
{
    public int Id { get; set; }
    public int ReclamationId { get; set; }
    public string TechnicienNom { get; set; } = string.Empty;
    public DateTime DateIntervention { get; set; }
    public string Statut { get; set; } = string.Empty;
    public bool EstGratuite { get; set; }
    public decimal? MontantMainOeuvre { get; set; }
    public decimal MontantTotal { get; set; }
    public string? Commentaire { get; set; }
    public DateTime CreatedAt { get; set; }
    public List<PieceUtiliseeDto> PiecesUtilisees { get; set; } = new();
}

public class CreateInterventionDto
{
    public int ReclamationId { get; set; }
    public int? TechnicienId { get; set; }
    public string TechnicienNom { get; set; } = string.Empty;
    public DateTime DateIntervention { get; set; }
    public decimal? MontantMainOeuvre { get; set; }
    public string? Commentaire { get; set; }
}

public class UpdateInterventionDto
{
    public string TechnicienNom { get; set; } = string.Empty;
    public DateTime DateIntervention { get; set; }
    public decimal? MontantMainOeuvre { get; set; }
    public string? Commentaire { get; set; }
}

public class UpdateInterventionStatutDto
{
    public string Statut { get; set; } = string.Empty;
}

public class PieceUtiliseeDto
{
    public int Id { get; set; }
    public int InterventionId { get; set; }
    public int PieceDetacheeId { get; set; }
    public string PieceNom { get; set; } = string.Empty;
    public string PieceReference { get; set; } = string.Empty;
    public int Quantite { get; set; }
    public decimal PrixUnitaire { get; set; }
    public decimal SousTotal { get; set; }
}

public class AddPieceUtiliseeDto
{
    public int PieceDetacheeId { get; set; }
    public int Quantite { get; set; }
}

public class InterventionListDto
{
    public List<InterventionDto> Items { get; set; } = new();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
}

public class InterventionStatsDto
{
    public int TotalInterventions { get; set; }
    public int InterventionsTerminees { get; set; }
    public int InterventionsEnCours { get; set; }
    public int InterventionsPlanifiees { get; set; }
    public int InterventionsAnnulees { get; set; }
    public decimal ChiffreAffairesTotal { get; set; }
    public decimal ChiffreAffairesMois { get; set; }
    public double TauxResolution { get; set; }
    public double TempsMoyenResolution { get; set; } // en jours
    public int InterventionsSousGarantie { get; set; }
}

public class AnalyticsDto
{
    public InterventionStatsDto InterventionStats { get; set; } = new();
    public List<ChiffreAffairesMensuelDto> ChiffreAffairesMensuel { get; set; } = new();
    public List<InterventionsParStatutDto> InterventionsParStatut { get; set; } = new();
    public List<TechnicienPerformanceDto> TopTechniciens { get; set; } = new();
    public List<ArticleProblemeDto> TopArticlesProblemes { get; set; } = new();
    public List<InterventionsParJourDto> InterventionsParJour { get; set; } = new();
}

public class ChiffreAffairesMensuelDto
{
    public int Mois { get; set; }
    public int Annee { get; set; }
    public string MoisNom { get; set; } = string.Empty;
    public decimal Montant { get; set; }
    public int NombreInterventions { get; set; }
}

public class InterventionsParStatutDto
{
    public string Statut { get; set; } = string.Empty;
    public int Nombre { get; set; }
    public double Pourcentage { get; set; }
}

public class TechnicienPerformanceDto
{
    public int TechnicienId { get; set; }
    public string TechnicienNom { get; set; } = string.Empty;
    public int NombreInterventions { get; set; }
    public int InterventionsTerminees { get; set; }
    public double TauxReussite { get; set; }
    public double DureeMoyenne { get; set; }
    public double NoteMoyenne { get; set; }
    public decimal ChiffreAffaires { get; set; }
}

public class ArticleProblemeDto
{
    public int ArticleId { get; set; }
    public string ArticleNom { get; set; } = string.Empty;
    public int NombreReclamations { get; set; }
    public double TauxProbleme { get; set; }
}

public class InterventionsParJourDto
{
    public DateTime Date { get; set; }
    public int Nombre { get; set; }
}
