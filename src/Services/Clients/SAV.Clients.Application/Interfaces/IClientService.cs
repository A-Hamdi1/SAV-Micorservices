using SAV.Shared.DTOs.Clients;

namespace SAV.Clients.Application.Interfaces;

public interface IClientService
{
    Task<ClientDto?> GetClientByUserIdAsync(string userId);
    Task<ClientDto?> GetClientByIdAsync(int clientId);
    Task<List<ClientDto>> GetAllClientsAsync();
    Task<ClientDto?> CreateClientAsync(string userId, CreateClientDto dto);
    Task<ClientDto?> UpdateClientAsync(string userId, UpdateClientDto dto);
    Task<ClientDto?> CreateClientByResponsableAsync(string userId, CreateClientDto dto);
    Task<ClientDto?> UpdateClientByIdAsync(int clientId, UpdateClientDto dto);
    Task<bool> DeleteClientAsync(int clientId);
}
