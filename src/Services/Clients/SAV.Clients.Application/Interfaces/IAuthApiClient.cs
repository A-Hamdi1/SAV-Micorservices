namespace SAV.Clients.Application.Interfaces;

public interface IAuthApiClient
{
    Task<List<string>> GetUserIdsByRoleAsync(string role);
}
