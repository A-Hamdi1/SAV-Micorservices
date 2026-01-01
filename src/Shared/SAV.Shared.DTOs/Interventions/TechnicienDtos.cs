namespace SAV.Shared.DTOs.Interventions;

public class TechnicienDto
{
    public int Id { get; set; }
    public string? UserId { get; set; }
    public string Nom { get; set; } = string.Empty;
    public string Prenom { get; set; } = string.Empty;
    public string NomComplet { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Telephone { get; set; } = string.Empty;
    public string Specialite { get; set; } = string.Empty;
    public bool EstDisponible { get; set; }
    public DateTime DateEmbauche { get; set; }
    public DateTime CreatedAt { get; set; }
    public int NombreInterventions { get; set; }
}

public class TechnicienDetailsDto
{
    public int Id { get; set; }
    public string? UserId { get; set; }
    public string Nom { get; set; } = string.Empty;
    public string Prenom { get; set; } = string.Empty;
    public string NomComplet { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Telephone { get; set; } = string.Empty;
    public string Specialite { get; set; } = string.Empty;
    public bool EstDisponible { get; set; }
    public DateTime DateEmbauche { get; set; }
    public DateTime CreatedAt { get; set; }
    public List<InterventionDto> Interventions { get; set; } = new();
    public TechnicienStatsDto? Stats { get; set; }
}

public class CreateTechnicienDto
{
    public string Nom { get; set; } = string.Empty;
    public string Prenom { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty; // Password for user account
    public string Telephone { get; set; } = string.Empty;
    public string Specialite { get; set; } = string.Empty;
    public DateTime? DateEmbauche { get; set; }
}

public class UpdateTechnicienDto
{
    public string Nom { get; set; } = string.Empty;
    public string Prenom { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Telephone { get; set; } = string.Empty;
    public string Specialite { get; set; } = string.Empty;
    public bool EstDisponible { get; set; }
}

public class UpdateTechnicienDisponibiliteDto
{
    public bool EstDisponible { get; set; }
}

public class TechnicienStatsDto
{
    public int NombreInterventionsTotal { get; set; }
    public int NombreInterventionsTerminees { get; set; }
    public int NombreInterventionsEnCours { get; set; }
    public decimal TauxReussite { get; set; }
    public decimal ChiffreAffaireTotal { get; set; }
    public decimal ChiffreAffaireMoyen { get; set; }
}

public class TechniciensStatsGlobalesDto
{
    public int NombreTechniciensTotal { get; set; }
    public int NombreTechniciensDisponibles { get; set; }
    public int NombreInterventionsTotal { get; set; }
    public decimal ChiffreAffaireTotal { get; set; }
    public decimal TauxReussiteMoyen { get; set; }
    public List<TechnicienStatsSummaryDto> TopTechniciens { get; set; } = new();
}

public class TechnicienStatsSummaryDto
{
    public int Id { get; set; }
    public string NomComplet { get; set; } = string.Empty;
    public int NombreInterventions { get; set; }
    public decimal ChiffreAffaire { get; set; }
    public decimal TauxReussite { get; set; }
}

public class UpdateInterventionTechnicienDto
{
    public int TechnicienId { get; set; }
}

public class InterventionStatsByMonthDto
{
    public int Annee { get; set; }
    public int Mois { get; set; }
    public string MoisNom { get; set; } = string.Empty;
    public int Nombre { get; set; }
    public decimal Montant { get; set; }
}
