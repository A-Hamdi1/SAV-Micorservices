using System.Net.Http.Json;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using SAV.Notifications.Application.Interfaces;
using SAV.Shared.Common;

namespace SAV.Notifications.Infrastructure.Services;

public class AuthApiClient : IAuthApiClient
{
    private readonly HttpClient _httpClient;
    private readonly string _apiKey;
    private readonly ILogger<AuthApiClient> _logger;

    public AuthApiClient(HttpClient httpClient, IConfiguration configuration, ILogger<AuthApiClient> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
        
        // Only set BaseAddress if not already configured
        if (_httpClient.BaseAddress == null)
        {
            var authServiceUrl = configuration["ServiceUrls:Auth"] ?? "https://localhost:5001";
            _httpClient.BaseAddress = new Uri(authServiceUrl);
            _logger.LogInformation("AuthApiClient: BaseAddress configured to {BaseUrl}", authServiceUrl);
        }
        else
        {
            _logger.LogInformation("AuthApiClient: Using pre-configured BaseAddress {BaseUrl}", _httpClient.BaseAddress);
        }
        
        _apiKey = configuration["ApiKeys:Internal"] ?? "f1c4a9e2d7b3f8c6e0a2d5c1b7e9f3a0";
    }

    public async Task<List<string>> GetUserIdsByRoleAsync(string role)
    {
        try
        {
            _logger.LogInformation("Fetching users with role: {Role} from {BaseUrl}", role, _httpClient.BaseAddress);
            
            // Use relative path (without leading slash) to properly combine with BaseAddress
            var request = new HttpRequestMessage(HttpMethod.Get, $"api/auth/internal/users-by-role/{role}");
            request.Headers.Add(ApiKeyConstants.HeaderName, _apiKey);
            
            _logger.LogDebug("Sending request to: {RequestUri} with API Key header: {HeaderName}", 
                new Uri(_httpClient.BaseAddress!, request.RequestUri!), ApiKeyConstants.HeaderName);
            
            var response = await _httpClient.SendAsync(request);
            
            _logger.LogInformation("Auth API response status: {StatusCode}", response.StatusCode);
            
            if (!response.IsSuccessStatusCode)
            {
                var content = await response.Content.ReadAsStringAsync();
                _logger.LogWarning("Failed to get users by role. Status: {StatusCode}, Content: {Content}", 
                    response.StatusCode, content);
                return new List<string>();
            }
            
            var result = await response.Content.ReadFromJsonAsync<ApiResponse<List<string>>>();
            var userIds = result?.Data ?? new List<string>();
            
            _logger.LogInformation("Found {Count} users with role {Role}: [{UserIds}]", 
                userIds.Count, role, string.Join(", ", userIds));
            
            return userIds;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching users by role {Role} from {BaseUrl}", role, _httpClient.BaseAddress);
            return new List<string>();
        }
    }
}
