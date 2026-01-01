using System.Net.Http.Json;
using Microsoft.Extensions.Configuration;
using SAV.Clients.Application.Interfaces;

namespace SAV.Clients.Infrastructure.Services;

public class AuthApiClient : IAuthApiClient
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;

    public AuthApiClient(HttpClient httpClient, IConfiguration configuration)
    {
        _httpClient = httpClient;
        _configuration = configuration;
        _httpClient.BaseAddress = new Uri(_configuration["Services:AuthApi"] ?? "https://localhost:5001");
        
        // Ajouter l'API Key pour la communication inter-services
        var apiKey = _configuration["InterServiceApiKey"];
        if (!string.IsNullOrEmpty(apiKey))
        {
            _httpClient.DefaultRequestHeaders.Add("X-API-Key", apiKey);
        }
    }

    public async Task<List<string>> GetUserIdsByRoleAsync(string role)
    {
        try
        {
            var response = await _httpClient.GetAsync($"/api/auth/internal/users-by-role/{role}");
            if (!response.IsSuccessStatusCode)
            {
                return new List<string>();
            }

            var apiResponse = await response.Content.ReadFromJsonAsync<ApiResponseWrapper<List<string>>>();
            return apiResponse?.Data ?? new List<string>();
        }
        catch
        {
            return new List<string>();
        }
    }
}
