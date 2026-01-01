using SAV.Interventions.Application.Interfaces;
using Microsoft.Extensions.Configuration;
using System.Net.Http.Json;

namespace SAV.Interventions.Infrastructure.Services;

public class NotificationsApiClient : INotificationsApiClient
{
    private readonly HttpClient _httpClient;
    private readonly string? _apiKey;

    public NotificationsApiClient(HttpClient httpClient, IConfiguration configuration)
    {
        _httpClient = httpClient;
        _httpClient.BaseAddress = new Uri("https://localhost:5002/");
        _apiKey = configuration["InterServiceApiKey"];
        
        if (!string.IsNullOrEmpty(_apiKey))
        {
            _httpClient.DefaultRequestHeaders.Add("X-Api-Key", _apiKey);
        }
    }

    public async Task NotifyInterventionCreatedAsync(int interventionId, int reclamationId, string technicienUserId, string? clientUserId)
    {
        try
        {
            var request = new NotifyInterventionRequest
            {
                InterventionId = interventionId,
                ReclamationId = reclamationId,
                TechnicienUserId = technicienUserId,
                ClientUserId = clientUserId,
                EventType = "Created"
            };

            await _httpClient.PostAsJsonAsync("api/notifications/internal/intervention", request);
        }
        catch
        {
            // Ignorer les erreurs de notification pour ne pas bloquer le flux principal
        }
    }

    public async Task NotifyInterventionStatusChangedAsync(int interventionId, string newStatus, string technicienUserId, string? clientUserId)
    {
        try
        {
            var request = new NotifyInterventionRequest
            {
                InterventionId = interventionId,
                NewStatus = newStatus,
                TechnicienUserId = technicienUserId,
                ClientUserId = clientUserId,
                EventType = "StatusChanged"
            };

            await _httpClient.PostAsJsonAsync("api/notifications/internal/intervention", request);
        }
        catch
        {
            // Ignorer les erreurs de notification
        }
    }

    public async Task NotifyEvaluationReceivedAsync(int evaluationId, int interventionId, string technicienUserId)
    {
        try
        {
            var request = new NotifyEvaluationRequest
            {
                EvaluationId = evaluationId,
                InterventionId = interventionId,
                TechnicienUserId = technicienUserId
            };

            await _httpClient.PostAsJsonAsync("api/notifications/internal/evaluation", request);
        }
        catch
        {
            // Ignorer les erreurs de notification
        }
    }
}

internal class NotifyInterventionRequest
{
    public int InterventionId { get; set; }
    public int ReclamationId { get; set; }
    public string? NewStatus { get; set; }
    public string TechnicienUserId { get; set; } = string.Empty;
    public string? ClientUserId { get; set; }
    public string EventType { get; set; } = string.Empty;
}

internal class NotifyEvaluationRequest
{
    public int EvaluationId { get; set; }
    public int InterventionId { get; set; }
    public string TechnicienUserId { get; set; } = string.Empty;
}
