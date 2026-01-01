using Microsoft.Extensions.Configuration;
using SAV.Clients.Application.Interfaces;
using SAV.Shared.DTOs.Notifications;
using System.Net.Http.Json;

namespace SAV.Clients.Infrastructure.Services;

/// <summary>
/// API client to communicate with the Notifications microservice
/// </summary>
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

    public async Task NotifyReclamationCreatedAsync(int reclamationId, int clientId, string clientUserId)
    {
        try
        {
            var request = new ReclamationNotificationRequest
            {
                ReclamationId = reclamationId,
                ClientId = clientId,
                ClientUserId = clientUserId,
                Event = "Created"
            };

            await _httpClient.PostAsJsonAsync("api/notifications/internal/reclamation", request);
        }
        catch
        {
            // Don't block the main flow if notification fails
        }
    }

    public async Task NotifyReclamationStatusChangedAsync(int reclamationId, string newStatus, string clientUserId)
    {
        try
        {
            var request = new ReclamationNotificationRequest
            {
                ReclamationId = reclamationId,
                ClientUserId = clientUserId,
                NewStatus = newStatus,
                Event = "StatusChanged"
            };

            await _httpClient.PostAsJsonAsync("api/notifications/internal/reclamation", request);
        }
        catch
        {
            // Don't block the main flow if notification fails
        }
    }
}

internal class ReclamationNotificationRequest
{
    public int ReclamationId { get; set; }
    public int ClientId { get; set; }
    public string ClientUserId { get; set; } = string.Empty;
    public string Event { get; set; } = string.Empty;
    public string? NewStatus { get; set; }
}
