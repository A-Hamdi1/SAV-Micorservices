using System.Net.Http.Json;
using Microsoft.Extensions.Configuration;
using SAV.Interventions.Application.Interfaces;

namespace SAV.Interventions.Infrastructure.Services;

public class ArticlesApiClient : IArticlesApiClient
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;

    public ArticlesApiClient(HttpClient httpClient, IConfiguration configuration)
    {
        _httpClient = httpClient;
        _configuration = configuration;
        _httpClient.BaseAddress = new Uri(_configuration["Services:ArticlesApi"] ?? "https://localhost:5004");
    }

    public async Task<PieceDetacheeApiDto?> GetPieceDetacheeByIdAsync(int pieceDetacheeId)
    {
        try
        {
            var response = await _httpClient.GetAsync($"/api/pieces-detachees/{pieceDetacheeId}");
            if (!response.IsSuccessStatusCode)
            {
                return null;
            }

            var apiResponse = await response.Content.ReadFromJsonAsync<ApiResponse<PieceDetacheeApiDto>>();
            return apiResponse?.Data;
        }
        catch
        {
            return null;
        }
    }

    private class ApiResponse<T>
    {
        public bool Success { get; set; }
        public T? Data { get; set; }
    }
}
