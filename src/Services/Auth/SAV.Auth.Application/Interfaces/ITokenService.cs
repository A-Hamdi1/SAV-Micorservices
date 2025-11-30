namespace SAV.Auth.Application.Interfaces;

public interface ITokenService
{
    string GenerateAccessToken(string userId, string email, string role);
    string GenerateRefreshToken();
    Task<bool> ValidateRefreshTokenAsync(string token);
    Task RevokeRefreshTokenAsync(string token);
}
