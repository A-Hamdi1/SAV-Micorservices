using SAV.Interventions.Application.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System.Net.Http.Json;

namespace SAV.Interventions.Infrastructure.Services;

public class NotificationsApiClient : INotificationsApiClient
{
    private readonly HttpClient _httpClient;
    private readonly string? _apiKey;
    private readonly ILogger<NotificationsApiClient> _logger;

    public NotificationsApiClient(HttpClient httpClient, IConfiguration configuration, ILogger<NotificationsApiClient> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
        // Updated to use the new Notifications microservice on port 5006
        var notificationsUrl = configuration["Services:NotificationsApi"] ?? "https://localhost:5006/";
        _httpClient.BaseAddress = new Uri(notificationsUrl);
        _apiKey = configuration["InterServiceApiKey"];
        
        if (!string.IsNullOrEmpty(_apiKey))
        {
            _httpClient.DefaultRequestHeaders.Add("X-Api-Key", _apiKey);
        }
        
        _logger.LogInformation("NotificationsApiClient initialized with base URL: {BaseUrl}", notificationsUrl);
    }

    public async Task NotifyInterventionCreatedAsync(int interventionId, int reclamationId, string technicienUserId, string? clientUserId)
    {
        try
        {
            _logger.LogInformation("Sending intervention created notification: InterventionId={InterventionId}", interventionId);
            
            var request = new NotifyInterventionRequest
            {
                InterventionId = interventionId,
                ReclamationId = reclamationId,
                TechnicienUserId = technicienUserId,
                ClientUserId = clientUserId,
                Event = "Created"
            };

            var response = await _httpClient.PostAsJsonAsync("api/notifications/internal/intervention", request);
            
            if (!response.IsSuccessStatusCode)
            {
                var content = await response.Content.ReadAsStringAsync();
                _logger.LogWarning("Failed to send intervention created notification. Status: {StatusCode}, Content: {Content}", 
                    response.StatusCode, content);
            }
            else
            {
                _logger.LogInformation("Intervention created notification sent successfully for InterventionId={InterventionId}", interventionId);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending intervention created notification for InterventionId={InterventionId}", interventionId);
        }
    }

    public async Task NotifyInterventionStatusChangedAsync(int interventionId, string newStatus, string technicienUserId, string? clientUserId)
    {
        try
        {
            _logger.LogInformation("Sending intervention status changed notification: InterventionId={InterventionId}, NewStatus={NewStatus}", 
                interventionId, newStatus);
            
            var request = new NotifyInterventionRequest
            {
                InterventionId = interventionId,
                NewStatus = newStatus,
                TechnicienUserId = technicienUserId,
                ClientUserId = clientUserId,
                Event = "StatusChanged"
            };

            var response = await _httpClient.PostAsJsonAsync("api/notifications/internal/intervention", request);
            
            if (!response.IsSuccessStatusCode)
            {
                var content = await response.Content.ReadAsStringAsync();
                _logger.LogWarning("Failed to send intervention status changed notification. Status: {StatusCode}, Content: {Content}", 
                    response.StatusCode, content);
            }
            else
            {
                _logger.LogInformation("Intervention status changed notification sent successfully for InterventionId={InterventionId}", interventionId);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending intervention status changed notification for InterventionId={InterventionId}", interventionId);
        }
    }

    public async Task NotifyEvaluationReceivedAsync(int evaluationId, int interventionId, string technicienUserId)
    {
        try
        {
            _logger.LogInformation("Sending evaluation received notification: EvaluationId={EvaluationId}", evaluationId);
            
            var request = new NotifyEvaluationRequest
            {
                EvaluationId = evaluationId,
                InterventionId = interventionId,
                TechnicienUserId = technicienUserId
            };

            var response = await _httpClient.PostAsJsonAsync("api/notifications/internal/evaluation", request);
            
            if (!response.IsSuccessStatusCode)
            {
                var content = await response.Content.ReadAsStringAsync();
                _logger.LogWarning("Failed to send evaluation notification. Status: {StatusCode}, Content: {Content}", 
                    response.StatusCode, content);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending evaluation notification for EvaluationId={EvaluationId}", evaluationId);
        }
    }

    public async Task NotifyRdvRequestedAsync(int rdvId, string clientUserId, DateTime dateProposee)
    {
        try
        {
            _logger.LogInformation("Sending RDV requested notification: RdvId={RdvId}", rdvId);
            
            var request = new NotifyRdvRequest
            {
                RdvId = rdvId,
                ClientUserId = clientUserId,
                DateProposee = dateProposee,
                Event = "Requested"
            };
            
            var response = await _httpClient.PostAsJsonAsync("api/notifications/internal/rdv", request);
            
            if (!response.IsSuccessStatusCode)
            {
                var content = await response.Content.ReadAsStringAsync();
                _logger.LogWarning("Failed to send RDV requested notification. Status: {StatusCode}, Content: {Content}", 
                    response.StatusCode, content);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending RDV requested notification for RdvId={RdvId}", rdvId);
        }
    }

    public async Task NotifyRdvConfirmedAsync(int rdvId, string clientUserId, DateTime dateConfirmee)
    {
        try
        {
            _logger.LogInformation("Sending RDV confirmed notification: RdvId={RdvId}", rdvId);
            
            var request = new NotifyRdvRequest
            {
                RdvId = rdvId,
                ClientUserId = clientUserId,
                DateConfirmee = dateConfirmee,
                Event = "Confirmed"
            };
            
            var response = await _httpClient.PostAsJsonAsync("api/notifications/internal/rdv", request);
            
            if (!response.IsSuccessStatusCode)
            {
                var content = await response.Content.ReadAsStringAsync();
                _logger.LogWarning("Failed to send RDV confirmed notification. Status: {StatusCode}, Content: {Content}", 
                    response.StatusCode, content);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending RDV confirmed notification for RdvId={RdvId}", rdvId);
        }
    }

    public async Task NotifyRdvRejectedAsync(int rdvId, string clientUserId, string? motif)
    {
        try
        {
            _logger.LogInformation("Sending RDV rejected notification: RdvId={RdvId}", rdvId);
            
            var request = new NotifyRdvRequest
            {
                RdvId = rdvId,
                ClientUserId = clientUserId,
                Motif = motif,
                Event = "Rejected"
            };
            
            var response = await _httpClient.PostAsJsonAsync("api/notifications/internal/rdv", request);
            
            if (!response.IsSuccessStatusCode)
            {
                var content = await response.Content.ReadAsStringAsync();
                _logger.LogWarning("Failed to send RDV rejected notification. Status: {StatusCode}, Content: {Content}", 
                    response.StatusCode, content);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending RDV rejected notification for RdvId={RdvId}", rdvId);
        }
    }

    public async Task NotifyRdvCancelledAsync(int rdvId, string clientUserId, bool cancelledByClient)
    {
        try
        {
            _logger.LogInformation("Sending RDV cancelled notification: RdvId={RdvId}", rdvId);
            
            var request = new NotifyRdvRequest
            {
                RdvId = rdvId,
                ClientUserId = clientUserId,
                CancelledByClient = cancelledByClient,
                Event = "Cancelled"
            };
            
            var response = await _httpClient.PostAsJsonAsync("api/notifications/internal/rdv", request);
            
            if (!response.IsSuccessStatusCode)
            {
                var content = await response.Content.ReadAsStringAsync();
                _logger.LogWarning("Failed to send RDV cancelled notification. Status: {StatusCode}, Content: {Content}", 
                    response.StatusCode, content);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending RDV cancelled notification for RdvId={RdvId}", rdvId);
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
    public string Event { get; set; } = string.Empty;
}

internal class NotifyEvaluationRequest
{
    public int EvaluationId { get; set; }
    public int InterventionId { get; set; }
    public string TechnicienUserId { get; set; } = string.Empty;
}

internal class NotifyRdvRequest
{
    public int RdvId { get; set; }
    public string ClientUserId { get; set; } = string.Empty;
    public DateTime? DateProposee { get; set; }
    public DateTime? DateConfirmee { get; set; }
    public string? Motif { get; set; }
    public bool CancelledByClient { get; set; }
    public string Event { get; set; } = string.Empty;
}
