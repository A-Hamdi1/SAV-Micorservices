using System.Net.Http.Json;
using Microsoft.Extensions.Configuration;
using SAV.Payments.Application.Interfaces;

namespace SAV.Payments.Infrastructure.Services;

public class NotificationsApiClient : INotificationsApiClient
{
    private readonly HttpClient _httpClient;
    private readonly string? _apiKey;

    public NotificationsApiClient(HttpClient httpClient, IConfiguration configuration)
    {
        _httpClient = httpClient;
        _httpClient.BaseAddress = new Uri(configuration["Services:NotificationsApi"] ?? "https://localhost:5006/");
        _apiKey = configuration["InterServiceApiKey"];
        
        if (!string.IsNullOrEmpty(_apiKey))
        {
            _httpClient.DefaultRequestHeaders.Add("X-Api-Key", _apiKey);
        }
    }

    public async Task NotifyPaymentSuccessAsync(int interventionId, string clientUserId, decimal montant)
    {
        try
        {
            var request = new NotifyPaymentRequest
            {
                InterventionId = interventionId,
                ClientUserId = clientUserId,
                Montant = montant,
                Event = "Success"
            };
            await _httpClient.PostAsJsonAsync("api/notifications/internal/payment", request);
        }
        catch
        {
            // Ignorer les erreurs de notification
        }
    }

    public async Task NotifyPaymentFailedAsync(int interventionId, string clientUserId)
    {
        try
        {
            var request = new NotifyPaymentRequest
            {
                InterventionId = interventionId,
                ClientUserId = clientUserId,
                Event = "Failed"
            };
            await _httpClient.PostAsJsonAsync("api/notifications/internal/payment", request);
        }
        catch
        {
            // Ignorer les erreurs de notification
        }
    }
}

internal class NotifyPaymentRequest
{
    public int InterventionId { get; set; }
    public string ClientUserId { get; set; } = string.Empty;
    public decimal Montant { get; set; }
    public string Event { get; set; } = string.Empty;
}
