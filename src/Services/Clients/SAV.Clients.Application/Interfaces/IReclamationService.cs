using SAV.Shared.DTOs.Clients;

namespace SAV.Clients.Application.Interfaces;

public interface IReclamationService
{
    Task<ReclamationDto?> CreateReclamationAsync(string userId, CreateReclamationDto dto);
    Task<List<ReclamationDto>> GetClientReclamationsAsync(string userId);
    Task<ReclamationListDto> GetAllReclamationsAsync(int page, int pageSize, string? statut = null);
    Task<ReclamationDto?> GetReclamationByIdAsync(int id);
    Task<ReclamationDto?> UpdateReclamationStatutAsync(int id, UpdateReclamationStatutDto dto);
    Task<List<ReclamationDto>> GetReclamationsByClientIdAsync(int clientId);
    Task<bool> DeleteReclamationAsync(int id);
}
