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
        
        // Ajouter l'API Key pour la communication inter-services
        var apiKey = _configuration["InterServiceApiKey"];
        if (!string.IsNullOrEmpty(apiKey))
        {
            _httpClient.DefaultRequestHeaders.Add("X-API-Key", apiKey);
        }
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
        try
        {
            var url = $"/api/articles-achetes/{articleAchatId}/garantie";
            _logger.LogInformation("Calling Clients API: GET {Url}", url);
            
            var response = await _httpClient.GetAsync(url);
            
            _logger.LogInformation("Clients API response: {StatusCode}", response.StatusCode);
            
            if (!response.IsSuccessStatusCode)
            {
                var errorContent = await response.Content.ReadAsStringAsync();
                _logger.LogWarning("Clients API returned {StatusCode}: {Content}", response.StatusCode, errorContent);
                return false;
            }

            var apiResponse = await response.Content.ReadFromJsonAsync<ApiResponse<bool>>();
            return apiResponse?.Data ?? false;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking warranty for article achat {ArticleAchatId}", articleAchatId);
            return false;
        }
    }

    public async Task<bool> UpdateReclamationStatutAsync(int reclamationId, string statut)
    {
        try
        {
            var url = $"/api/reclamations/{reclamationId}/statut";
            _logger.LogInformation("Calling Clients API: PUT {Url} with statut {Statut}", url, statut);
            
            var response = await _httpClient.PutAsJsonAsync(url, new { Statut = statut });
            
            _logger.LogInformation("Clients API response: {StatusCode}", response.StatusCode);
            
            if (!response.IsSuccessStatusCode)
            {
                var errorContent = await response.Content.ReadAsStringAsync();
                _logger.LogWarning("Clients API returned {StatusCode}: {Content}", response.StatusCode, errorContent);
                return false;
            }

            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating reclamation statut {ReclamationId} to {Statut}", reclamationId, statut);
            return false;
        }
    }

    private class ApiResponse<T>
    {
        public bool Success { get; set; }
        public T? Data { get; set; }
    }
}
