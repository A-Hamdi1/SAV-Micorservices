using SAV.Shared.DTOs.Auth;

namespace SAV.Messaging.Application.Interfaces;

/// <summary>
/// Interface pour appeler l'API Auth afin de récupérer les informations utilisateur
/// </summary>
public interface IAuthApiClient
{
    Task<UserDto?> GetUserByIdAsync(string userId);
    Task<List<UserDto>> GetUsersByRoleAsync(string role);
    Task<List<UserDto>> GetResponsablesAsync();
}
