using System.Net.Http.Json;
using Microsoft.Extensions.Configuration;
using SAV.Clients.Application.Interfaces;

namespace SAV.Clients.Infrastructure.Services;

public class ArticlesApiClient : IArticlesApiClient
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;

    public ArticlesApiClient(HttpClient httpClient, IConfiguration configuration)
    {
        _httpClient = httpClient;
        _configuration = configuration;
        _httpClient.BaseAddress = new Uri(_configuration["Services:ArticlesApi"] ?? "https://localhost:5004");
        
        // Ajouter l'API Key pour la communication inter-services
        var apiKey = _configuration["InterServiceApiKey"];
        if (!string.IsNullOrEmpty(apiKey))
        {
            _httpClient.DefaultRequestHeaders.Add("X-API-Key", apiKey);
        }
    }

    public async Task<ArticleApiDto?> GetArticleByIdAsync(int articleId)
    {
        try
        {
            var response = await _httpClient.GetAsync($"/api/articles/{articleId}");
            if (!response.IsSuccessStatusCode)
            {
                return null;
            }

            return await response.Content.ReadFromJsonAsync<ArticleApiDto>();
        }
        catch
        {
            return null;
        }
    }
}
