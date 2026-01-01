using SAV.Shared.DTOs.Interventions;

namespace SAV.Interventions.Application.Interfaces;

public interface ITechnicienService
{
    Task<List<TechnicienDto>> GetAllTechniciensAsync(bool? disponible = null);
    Task<TechnicienDetailsDto?> GetTechnicienByIdAsync(int id);
    Task<TechnicienDetailsDto?> GetTechnicienByUserIdAsync(string userId);
    Task<List<TechnicienDto>> GetTechniciensBySpecialiteAsync(string specialite);
    Task<List<TechnicienDto>> GetTechniciensDisponiblesAsync();
    Task<TechnicienDto?> CreateTechnicienAsync(CreateTechnicienDto dto, string? userId = null);
    Task<TechnicienDto?> UpdateTechnicienAsync(int id, UpdateTechnicienDto dto);
    Task<TechnicienDto?> UpdateDisponibiliteAsync(int id, bool estDisponible);
    Task<bool> DeleteTechnicienAsync(int id);
    Task<List<InterventionDto>> GetTechnicienInterventionsAsync(int technicienId, string? statut = null, DateTime? dateDebut = null, DateTime? dateFin = null);
    Task<TechnicienStatsDto> GetTechnicienStatsAsync(int technicienId);
    Task<TechniciensStatsGlobalesDto> GetTechniciensStatsGlobalesAsync();
    Task<InterventionDto?> UpdateInterventionStatutByTechnicienAsync(int interventionId, int technicienId, string statut, string? commentaire = null);
}
