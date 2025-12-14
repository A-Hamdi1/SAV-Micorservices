using System.Net.Http.Json;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using SAV.Interventions.Application.Interfaces;

namespace SAV.Interventions.Infrastructure.Services;

public class ArticlesApiClient : IArticlesApiClient
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;
    private readonly ILogger<ArticlesApiClient> _logger;

    public ArticlesApiClient(HttpClient httpClient, IConfiguration configuration, ILogger<ArticlesApiClient> logger)
    {
        _httpClient = httpClient;
        _configuration = configuration;
        _logger = logger;
        _httpClient.BaseAddress = new Uri(_configuration["Services:ArticlesApi"] ?? "https://localhost:5004");
        
        // Ajouter l'API Key pour la communication inter-services
        var apiKey = _configuration["InterServiceApiKey"];
        if (!string.IsNullOrEmpty(apiKey))
        {
            _httpClient.DefaultRequestHeaders.Add("X-API-Key", apiKey);
        }
    }

    public async Task<PieceDetacheeApiDto?> GetPieceDetacheeByIdAsync(int pieceDetacheeId)
    {
        try
        {
            var url = $"/api/pieces-detachees/{pieceDetacheeId}";
            _logger.LogInformation("Calling Articles API: GET {Url}", url);
            
            var response = await _httpClient.GetAsync(url);
            
            _logger.LogInformation("Articles API response: {StatusCode}", response.StatusCode);
            
            if (!response.IsSuccessStatusCode)
            {
                var errorContent = await response.Content.ReadAsStringAsync();
                _logger.LogWarning("Articles API returned {StatusCode}: {Content}", response.StatusCode, errorContent);
                return null;
            }

            var apiResponse = await response.Content.ReadFromJsonAsync<ApiResponse<PieceDetacheeApiDto>>();
            return apiResponse?.Data;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calling Articles API for piece {PieceDetacheeId}", pieceDetacheeId);
            return null;
        }
    }

    public async Task<bool> ReduceStockAsync(int pieceDetacheeId, int quantite)
    {
        try
        {
            var url = $"/api/pieces-detachees/{pieceDetacheeId}/stock/reduce";
            _logger.LogInformation("Calling Articles API: PATCH {Url} with quantite {Quantite}", url, quantite);
            
            var response = await _httpClient.PatchAsJsonAsync(url, new { Quantite = quantite });
            
            _logger.LogInformation("Articles API response: {StatusCode}", response.StatusCode);
            
            if (!response.IsSuccessStatusCode)
            {
                var errorContent = await response.Content.ReadAsStringAsync();
                _logger.LogWarning("Articles API returned {StatusCode}: {Content}", response.StatusCode, errorContent);
                return false;
            }

            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error reducing stock for piece {PieceDetacheeId}", pieceDetacheeId);
            return false;
        }
    }

    private class ApiResponse<T>
    {
        public bool Success { get; set; }
        public T? Data { get; set; }
    }
}
