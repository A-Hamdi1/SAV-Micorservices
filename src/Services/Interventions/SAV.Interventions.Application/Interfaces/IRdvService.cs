using SAV.Interventions.Domain.Entities;
using System.ComponentModel.DataAnnotations;

namespace SAV.Interventions.Application.Interfaces;

public interface IRdvService
{
    // Créneaux
    Task<IEnumerable<CreneauDto>> GetCreneauxDisponiblesAsync(DateTime dateDebut, DateTime dateFin, int? technicienId = null);
    Task<CreneauxPaginatedResult> GetAllCreneauxAsync(DateTime dateDebut, DateTime dateFin, int? technicienId = null, int page = 1, int pageSize = 20);
    Task<CreneauDto?> CreateCreneauAsync(CreateCreneauDto dto);
    Task<IEnumerable<CreneauDto>> CreateCreneauxRecurrentsAsync(CreateCreneauxRecurrentsDto dto);
    Task<bool> DeleteCreneauAsync(int id);
    Task<CreneauDto?> ReserverCreneauAsync(int creneauId, int interventionId);
    Task<bool> LibererCreneauAsync(int creneauId);
    Task<IEnumerable<CreneauDto>> GetCreneauxByTechnicienAsync(int technicienId, DateTime? date = null);
    
    // Demandes RDV
    Task<DemandeRdvDto?> GetDemandeRdvByIdAsync(int id);
    Task<IEnumerable<DemandeRdvDto>> GetDemandesRdvAsync(string? statut = null);
    Task<IEnumerable<DemandeRdvDto>> GetDemandesRdvByClientAsync(int clientId);
    Task<DemandeRdvDto?> CreateDemandeRdvAsync(CreateDemandeRdvDto dto);
    Task<DemandeRdvDto?> TraiterDemandeRdvAsync(int id, TraiterDemandeRdvDto dto);
    Task<DemandeRdvDto?> AnnulerDemandeRdvAsync(int id);
}

public class CreneauDto
{
    public int Id { get; set; }
    public int TechnicienId { get; set; }
    public string TechnicienNom { get; set; } = string.Empty;
    public DateTime DateDebut { get; set; }
    public DateTime DateFin { get; set; }
    public bool EstReserve { get; set; }
    public int? InterventionId { get; set; }
}

public class CreateCreneauDto
{
    [Required(ErrorMessage = "L'ID du technicien est requis")]
    [Range(1, int.MaxValue, ErrorMessage = "L'ID du technicien doit être positif")]
    public int TechnicienId { get; set; }
    
    [Required(ErrorMessage = "La date de début est requise")]
    public DateTime DateDebut { get; set; }
    
    [Required(ErrorMessage = "La date de fin est requise")]
    public DateTime DateFin { get; set; }
}

public class CreateCreneauxRecurrentsDto
{
    [Required(ErrorMessage = "L'ID du technicien est requis")]
    [Range(1, int.MaxValue, ErrorMessage = "L'ID du technicien doit être positif")]
    public int TechnicienId { get; set; }
    
    [Required(ErrorMessage = "La date de début est requise")]
    public DateTime DateDebut { get; set; }
    
    [Required(ErrorMessage = "La date de fin est requise")]
    public DateTime DateFin { get; set; }
    
    [Range(15, 480, ErrorMessage = "La durée doit être entre 15 et 480 minutes")]
    public int DureeMinutes { get; set; } = 60;
    
    [Required(ErrorMessage = "Au moins un jour doit être sélectionné")]
    [MinLength(1, ErrorMessage = "Au moins un jour doit être sélectionné")]
    public List<DayOfWeek> Jours { get; set; } = new();
    
    [Required(ErrorMessage = "L'heure de début est requise")]
    public TimeSpan HeureDebut { get; set; }
    
    [Required(ErrorMessage = "L'heure de fin est requise")]
    public TimeSpan HeureFin { get; set; }
}

public class DemandeRdvDto
{
    public int Id { get; set; }
    public int? ReclamationId { get; set; }
    public int ClientId { get; set; }
    public int? CreneauId { get; set; }
    public CreneauDto? Creneau { get; set; }
    public string Motif { get; set; } = string.Empty;
    public DateTime? DateSouhaitee { get; set; }
    public string? PreferenceMoment { get; set; }
    public string Statut { get; set; } = string.Empty;
    public string? Commentaire { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? TraiteeAt { get; set; }
}

public class CreateDemandeRdvDto
{
    // ReclamationId est maintenant optionnel - le RDV peut être indépendant
    [Range(1, int.MaxValue, ErrorMessage = "L'ID de la réclamation doit être positif")]
    public int? ReclamationId { get; set; }
    
    [Required(ErrorMessage = "L'ID du client est requis")]
    [Range(1, int.MaxValue, ErrorMessage = "L'ID du client doit être positif")]
    public int ClientId { get; set; }
    
    [Required(ErrorMessage = "Le motif est requis")]
    [MaxLength(200, ErrorMessage = "Le motif ne peut pas dépasser 200 caractères")]
    public string Motif { get; set; } = string.Empty;
    
    public int? CreneauId { get; set; }
    public DateTime? DateSouhaitee { get; set; }
    
    [MaxLength(50, ErrorMessage = "La préférence de moment ne peut pas dépasser 50 caractères")]
    public string? PreferenceMoment { get; set; }
    
    [MaxLength(500, ErrorMessage = "Le commentaire ne peut pas dépasser 500 caractères")]
    public string? Commentaire { get; set; }
}

public class TraiterDemandeRdvDto
{
    public int? CreneauId { get; set; }
    
    [Required(ErrorMessage = "Le choix d'acceptation est requis")]
    public bool Accepter { get; set; }
    
    [MaxLength(500, ErrorMessage = "Le commentaire ne peut pas dépasser 500 caractères")]
    public string? Commentaire { get; set; }
}

public class CreneauxPaginatedResult
{
    public IEnumerable<CreneauDto> Creneaux { get; set; } = new List<CreneauDto>();
    public int TotalCount { get; set; }
    public int TotalLibres { get; set; }
    public int TotalReserves { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalPages => (int)Math.Ceiling((double)TotalCount / PageSize);
}
