namespace SAV.Notifications.Application.Interfaces;

public interface IAuthApiClient
{
    Task<List<string>> GetUserIdsByRoleAsync(string role);
}
