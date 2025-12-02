using SAV.Interventions.Domain.Entities;
using SAV.Shared.DTOs.Interventions;

namespace SAV.Interventions.Application.Interfaces;

public interface IInterventionService
{
    Task<InterventionDto?> CreateInterventionAsync(CreateInterventionDto dto);
    Task<InterventionListDto> GetAllInterventionsAsync(int page, int pageSize, string? statut = null);
    Task<InterventionDto?> GetInterventionByIdAsync(int id);
    Task<Intervention?> GetInterventionEntityByIdAsync(int id);
    Task<InterventionDto?> UpdateInterventionAsync(int id, UpdateInterventionDto dto);
    Task<InterventionDto?> UpdateInterventionStatutAsync(int id, UpdateInterventionStatutDto dto);
    Task<List<InterventionDto>> GetInterventionsByReclamationIdAsync(int reclamationId);
    Task<PieceUtiliseeDto?> AddPieceUtiliseeAsync(int interventionId, AddPieceUtiliseeDto dto);
    Task<List<InterventionDto>> GetInterventionsByTechnicienAsync(int technicienId);
    Task<List<InterventionDto>> GetInterventionsPlanifieesAsync();
    Task<InterventionDto?> UpdateInterventionTechnicienAsync(int id, int technicienId);
    Task<bool> DeleteInterventionAsync(int id);
    Task<InterventionStatsDto> GetInterventionsStatsAsync();
}
