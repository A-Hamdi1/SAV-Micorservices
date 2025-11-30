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
