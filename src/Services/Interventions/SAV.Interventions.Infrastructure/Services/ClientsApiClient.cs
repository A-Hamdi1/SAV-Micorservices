using System.Net.Http.Json;
using Microsoft.Extensions.Configuration;
using SAV.Interventions.Application.Interfaces;

namespace SAV.Interventions.Infrastructure.Services;

public class ClientsApiClient : IClientsApiClient
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;

    public ClientsApiClient(HttpClient httpClient, IConfiguration configuration)
    {
        _httpClient = httpClient;
        _configuration = configuration;
        _httpClient.BaseAddress = new Uri(_configuration["Services:ClientsApi"] ?? "https://localhost:5002");
    }

    public async Task<ReclamationApiDto?> GetReclamationByIdAsync(int reclamationId)
    {
        try
        {
            var response = await _httpClient.GetAsync($"/api/reclamations/{reclamationId}");
            if (!response.IsSuccessStatusCode)
            {
                return null;
            }

            var apiResponse = await response.Content.ReadFromJsonAsync<ApiResponse<ReclamationApiDto>>();
            return apiResponse?.Data;
        }
        catch
        {
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
