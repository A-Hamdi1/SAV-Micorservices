using SAV.Interventions.Domain.Entities;
using System.ComponentModel.DataAnnotations;

namespace SAV.Interventions.Application.Interfaces;

public interface IEvaluationService
{
    Task<EvaluationDto?> GetByIdAsync(int id);
    Task<EvaluationDto?> GetByInterventionIdAsync(int interventionId);
    Task<IEnumerable<EvaluationDto>> GetByClientIdAsync(int clientId);
    Task<IEnumerable<EvaluationDto>> GetByTechnicienIdAsync(int technicienId);
    Task<IEnumerable<EvaluationDto>> GetAllAsync();
    Task<EvaluationDto?> CreateAsync(CreateEvaluationDto dto);
    Task<EvaluationDto?> UpdateAsync(int id, UpdateEvaluationDto dto);
    Task<bool> DeleteAsync(int id);
    Task<EvaluationStatsDto> GetStatsAsync();
    Task<TechnicienEvaluationStatsDto?> GetTechnicienStatsAsync(int technicienId);
}

public class EvaluationDto
{
    public int Id { get; set; }
    public int InterventionId { get; set; }
    public int ClientId { get; set; }
    public int Note { get; set; }
    public string? Commentaire { get; set; }
    public bool RecommandeTechnicien { get; set; }
    public DateTime CreatedAt { get; set; }
    public string? TechnicienNom { get; set; }
}

public class CreateEvaluationDto
{
    [Required(ErrorMessage = "L'ID de l'intervention est requis")]
    [Range(1, int.MaxValue, ErrorMessage = "L'ID de l'intervention doit être positif")]
    public int InterventionId { get; set; }
    
    [Required(ErrorMessage = "L'ID du client est requis")]
    [Range(1, int.MaxValue, ErrorMessage = "L'ID du client doit être positif")]
    public int ClientId { get; set; }
    
    [Required(ErrorMessage = "La note est requise")]
    [Range(1, 5, ErrorMessage = "La note doit être entre 1 et 5")]
    public int Note { get; set; }
    
    [MaxLength(1000, ErrorMessage = "Le commentaire ne peut pas dépasser 1000 caractères")]
    public string? Commentaire { get; set; }
    
    public bool RecommandeTechnicien { get; set; }
}

public class UpdateEvaluationDto
{
    [Required(ErrorMessage = "La note est requise")]
    [Range(1, 5, ErrorMessage = "La note doit être entre 1 et 5")]
    public int Note { get; set; }
    
    [MaxLength(1000, ErrorMessage = "Le commentaire ne peut pas dépasser 1000 caractères")]
    public string? Commentaire { get; set; }
    
    public bool RecommandeTechnicien { get; set; }
}

public class EvaluationStatsDto
{
    public int TotalEvaluations { get; set; }
    public double NoteMoyenne { get; set; }
    public int NotesCinqEtoiles { get; set; }
    public int NotesQuatreEtoiles { get; set; }
    public int NotesTroisEtoiles { get; set; }
    public int NotesDeuxEtoiles { get; set; }
    public int NotesUneEtoile { get; set; }
    public double TauxRecommandation { get; set; }
}

public class TechnicienEvaluationStatsDto
{
    public int TechnicienId { get; set; }
    public string TechnicienNom { get; set; } = string.Empty;
    public int NombreEvaluations { get; set; }
    public double NoteMoyenne { get; set; }
    public double TauxRecommandation { get; set; }
}
