using System.Net.Http.Json;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using SAV.Messaging.Application.Interfaces;
using SAV.Shared.DTOs.Auth;

namespace SAV.Messaging.Infrastructure.Services;

public class AuthApiClient : IAuthApiClient
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<AuthApiClient> _logger;
    private readonly string? _apiKey;

    public AuthApiClient(HttpClient httpClient, ILogger<AuthApiClient> logger, IConfiguration configuration)
    {
        _httpClient = httpClient;
        _logger = logger;
        _apiKey = configuration["ApiKeys:Internal"];
    }

    public async Task<UserDto?> GetUserByIdAsync(string userId)
    {
        try
        {
            var request = new HttpRequestMessage(HttpMethod.Get, $"api/auth/internal/users/{userId}");
            if (!string.IsNullOrEmpty(_apiKey))
            {
                request.Headers.Add("X-API-Key", _apiKey);
            }

            var response = await _httpClient.SendAsync(request);
            if (response.IsSuccessStatusCode)
            {
                var result = await response.Content.ReadFromJsonAsync<ApiResponseWrapper<UserDto>>();
                return result?.Data;
            }
            _logger.LogWarning("Failed to get user {UserId}. Status: {Status}", userId, response.StatusCode);
            return null;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting user {UserId} from Auth API", userId);
            return null;
        }
    }

    public async Task<List<UserDto>> GetUsersByRoleAsync(string role)
    {
        try
        {
            var request = new HttpRequestMessage(HttpMethod.Get, $"api/auth/internal/users-by-role/{role}/full");
            if (!string.IsNullOrEmpty(_apiKey))
            {
                request.Headers.Add("X-API-Key", _apiKey);
            }

            var response = await _httpClient.SendAsync(request);
            if (response.IsSuccessStatusCode)
            {
                var result = await response.Content.ReadFromJsonAsync<ApiResponseWrapper<List<UserDto>>>();
                return result?.Data ?? new List<UserDto>();
            }
            _logger.LogWarning("Failed to get users by role {Role}. Status: {Status}", role, response.StatusCode);
            return new List<UserDto>();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting users by role {Role} from Auth API", role);
            return new List<UserDto>();
        }
    }

    public async Task<List<UserDto>> GetResponsablesAsync()
    {
        return await GetUsersByRoleAsync("ResponsableSAV");
    }

    private class ApiResponseWrapper<T>
    {
        public bool Success { get; set; }
        public T? Data { get; set; }
        public string? Message { get; set; }
    }
}
