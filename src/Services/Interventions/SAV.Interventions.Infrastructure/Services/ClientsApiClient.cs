using System.Net.Http.Json;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using SAV.Interventions.Application.Interfaces;

namespace SAV.Interventions.Infrastructure.Services;

public class ClientsApiClient : IClientsApiClient
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;
    private readonly ILogger<ClientsApiClient> _logger;

    public ClientsApiClient(HttpClient httpClient, IConfiguration configuration, ILogger<ClientsApiClient> logger)
    {
        _httpClient = httpClient;
        _configuration = configuration;
        _logger = logger;
        _httpClient.BaseAddress = new Uri(_configuration["Services:ClientsApi"] ?? "https://localhost:5002");
    }

    public async Task<ReclamationApiDto?> GetReclamationByIdAsync(int reclamationId)
    {
        try
        {
            var url = $"/api/reclamations/{reclamationId}";
            _logger.LogInformation("Calling Clients API: GET {Url}", url);
            
            var response = await _httpClient.GetAsync(url);
            
            _logger.LogInformation("Clients API response: {StatusCode}", response.StatusCode);
            
            if (!response.IsSuccessStatusCode)
            {
                var errorContent = await response.Content.ReadAsStringAsync();
                _logger.LogWarning("Clients API returned {StatusCode}: {Content}", response.StatusCode, errorContent);
                return null;
            }

            var apiResponse = await response.Content.ReadFromJsonAsync<ApiResponse<ReclamationApiDto>>();
            return apiResponse?.Data;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calling Clients API for reclamation {ReclamationId}", reclamationId);
            return null;
        }
    }

    public async Task<bool> IsArticleUnderWarrantyAsync(int articleAchatId)
    {
        // Cette logique est simplifiée - en production, il faudrait un endpoint dédié
        return true;
    }

    private class ApiResponse<T>
    {
        public bool Success { get; set; }
        public T? Data { get; set; }
    }
}
