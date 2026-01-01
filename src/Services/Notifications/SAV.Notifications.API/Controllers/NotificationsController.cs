using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SAV.Notifications.Application.Interfaces;
using SAV.Shared.Common;
using SAV.Shared.DTOs.Notifications;
using System.Security.Claims;

namespace SAV.Notifications.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class NotificationsController : ControllerBase
{
    private readonly INotificationService _notificationService;
    private readonly IConfiguration _configuration;
    private readonly ILogger<NotificationsController> _logger;

    public NotificationsController(
        INotificationService notificationService,
        IConfiguration configuration,
        ILogger<NotificationsController> logger)
    {
        _notificationService = notificationService;
        _configuration = configuration;
        _logger = logger;
    }

    private string GetUserId()
    {
        return User.FindFirst(ClaimTypes.NameIdentifier)?.Value 
               ?? User.FindFirst("sub")?.Value 
               ?? throw new UnauthorizedAccessException("User ID not found in token");
    }

    private bool IsApiKeyValid()
    {
        if (!Request.Headers.TryGetValue(ApiKeyConstants.HeaderName, out var providedApiKey))
            return false;

        var validApiKey = _configuration["ApiKeys:Internal"];
        return !string.IsNullOrEmpty(validApiKey) && providedApiKey == validApiKey;
    }

    /// <summary>
    /// Get paginated notifications for the current user
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<ApiResponse<List<NotificationDto>>>> GetNotifications(
        [FromQuery] int page = 1, 
        [FromQuery] int pageSize = 20)
    {
        var userId = GetUserId();
        var notifications = await _notificationService.GetUserNotificationsAsync(userId, page, pageSize);
        return Ok(new ApiResponse<List<NotificationDto>> { Success = true, Data = notifications });
    }

    /// <summary>
    /// Get unread notifications for the current user
    /// </summary>
    [HttpGet("unread")]
    public async Task<ActionResult<ApiResponse<List<NotificationDto>>>> GetUnreadNotifications()
    {
        var userId = GetUserId();
        var notifications = await _notificationService.GetUnreadNotificationsAsync(userId);
        return Ok(new ApiResponse<List<NotificationDto>> { Success = true, Data = notifications });
    }

    /// <summary>
    /// Get notification count for the current user
    /// </summary>
    [HttpGet("count")]
    public async Task<ActionResult<ApiResponse<NotificationCountDto>>> GetNotificationCount()
    {
        var userId = GetUserId();
        var count = await _notificationService.GetNotificationCountAsync(userId);
        return Ok(new ApiResponse<NotificationCountDto> { Success = true, Data = count });
    }

    /// <summary>
    /// Get a specific notification by ID
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<NotificationDto>>> GetNotification(int id)
    {
        var notification = await _notificationService.GetNotificationByIdAsync(id);
        if (notification == null)
            return NotFound(new ApiResponse<NotificationDto> { Success = false, Message = "Notification non trouvée" });

        var userId = GetUserId();
        if (notification.UserId != userId)
            return Forbid();

        return Ok(new ApiResponse<NotificationDto> { Success = true, Data = notification });
    }

    /// <summary>
    /// Create a new notification (requires ResponsableSAV or Technicien role)
    /// </summary>
    [HttpPost]
    [Authorize(Roles = $"{Roles.ResponsableSAV},{Roles.Technicien}")]
    public async Task<ActionResult<ApiResponse<NotificationDto>>> CreateNotification([FromBody] CreateNotificationDto dto)
    {
        var notification = await _notificationService.CreateNotificationAsync(dto);
        return CreatedAtAction(nameof(GetNotification), new { id = notification.Id }, 
            new ApiResponse<NotificationDto> { Success = true, Data = notification, Message = "Notification créée avec succès" });
    }

    /// <summary>
    /// Mark a notification as read
    /// </summary>
    [HttpPut("{id}/read")]
    public async Task<ActionResult<ApiResponse<bool>>> MarkAsRead(int id)
    {
        var userId = GetUserId();
        var result = await _notificationService.MarkAsReadAsync(id, userId);
        if (!result)
            return NotFound(new ApiResponse<bool> { Success = false, Message = "Notification non trouvée" });

        return Ok(new ApiResponse<bool> { Success = true, Data = true, Message = "Notification marquée comme lue" });
    }

    /// <summary>
    /// Mark all notifications as read
    /// </summary>
    [HttpPut("read-all")]
    public async Task<ActionResult<ApiResponse<bool>>> MarkAllAsRead()
    {
        var userId = GetUserId();
        await _notificationService.MarkAllAsReadAsync(userId);
        return Ok(new ApiResponse<bool> { Success = true, Data = true, Message = "Toutes les notifications ont été marquées comme lues" });
    }

    /// <summary>
    /// Delete a notification
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<ActionResult<ApiResponse<bool>>> DeleteNotification(int id)
    {
        var userId = GetUserId();
        var result = await _notificationService.DeleteNotificationAsync(id, userId);
        if (!result)
            return NotFound(new ApiResponse<bool> { Success = false, Message = "Notification non trouvée" });

        return Ok(new ApiResponse<bool> { Success = true, Data = true, Message = "Notification supprimée" });
    }

    /// <summary>
    /// Delete all read notifications
    /// </summary>
    [HttpDelete("read")]
    public async Task<ActionResult<ApiResponse<bool>>> DeleteAllReadNotifications()
    {
        var userId = GetUserId();
        await _notificationService.DeleteAllReadNotificationsAsync(userId);
        return Ok(new ApiResponse<bool> { Success = true, Data = true, Message = "Toutes les notifications lues ont été supprimées" });
    }

    // ==================== Internal API Endpoints (called by other microservices) ====================

    /// <summary>
    /// Internal: Create notification for intervention events
    /// </summary>
    [HttpPost("internal/intervention")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<bool>>> NotifyIntervention([FromBody] InterventionNotificationDto dto)
    {
        if (!IsApiKeyValid())
            return Unauthorized(new ApiResponse<bool> { Success = false, Message = "API Key invalide" });

        _logger.LogInformation("Internal notification request for intervention: {InterventionId}, Event: {Event}", 
            dto.InterventionId, dto.Event);

        switch (dto.Event)
        {
            case "Created":
                await _notificationService.NotifyInterventionCreatedAsync(
                    dto.InterventionId, dto.ReclamationId, dto.TechnicienUserId, dto.ClientUserId);
                break;
            case "StatusChanged":
                await _notificationService.NotifyInterventionStatusChangedAsync(
                    dto.InterventionId, dto.NewStatus ?? "", dto.TechnicienUserId, dto.ClientUserId);
                break;
        }

        return Ok(new ApiResponse<bool> { Success = true, Data = true });
    }

    /// <summary>
    /// Internal: Create notification for evaluation events
    /// </summary>
    [HttpPost("internal/evaluation")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<bool>>> NotifyEvaluation([FromBody] EvaluationNotificationDto dto)
    {
        if (!IsApiKeyValid())
            return Unauthorized(new ApiResponse<bool> { Success = false, Message = "API Key invalide" });

        _logger.LogInformation("Internal notification request for evaluation: {EvaluationId}", dto.EvaluationId);

        await _notificationService.NotifyEvaluationReceivedAsync(
            dto.EvaluationId, dto.InterventionId, dto.TechnicienUserId);

        return Ok(new ApiResponse<bool> { Success = true, Data = true });
    }

    /// <summary>
    /// Internal: Create notification for reclamation events
    /// </summary>
    [HttpPost("internal/reclamation")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<bool>>> NotifyReclamation([FromBody] ReclamationNotificationDto dto)
    {
        if (!IsApiKeyValid())
            return Unauthorized(new ApiResponse<bool> { Success = false, Message = "API Key invalide" });

        _logger.LogInformation("Internal notification request for reclamation: {ReclamationId}, Event: {Event}", 
            dto.ReclamationId, dto.Event);

        switch (dto.Event)
        {
            case "Created":
                await _notificationService.NotifyReclamationCreatedAsync(
                    dto.ReclamationId, dto.ClientId, dto.ClientUserId);
                break;
            case "StatusChanged":
                await _notificationService.NotifyReclamationStatusChangedAsync(
                    dto.ReclamationId, dto.NewStatus ?? "", dto.ClientUserId);
                break;
        }

        return Ok(new ApiResponse<bool> { Success = true, Data = true });
    }

    /// <summary>
    /// Internal: Create notification for RDV events
    /// </summary>
    [HttpPost("internal/rdv")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<bool>>> NotifyRdv([FromBody] RdvNotificationDto dto)
    {
        if (!IsApiKeyValid())
            return Unauthorized(new ApiResponse<bool> { Success = false, Message = "API Key invalide" });

        _logger.LogInformation("Internal notification request for RDV: {RdvId}, Event: {Event}", 
            dto.RdvId, dto.Event);

        switch (dto.Event)
        {
            case "Requested":
                await _notificationService.NotifyRdvRequestedAsync(dto.RdvId, dto.ClientUserId, dto.DateProposee ?? DateTime.UtcNow);
                break;
            case "Confirmed":
                await _notificationService.NotifyRdvConfirmedAsync(dto.RdvId, dto.ClientUserId, dto.DateConfirmee ?? DateTime.UtcNow);
                break;
            case "Rejected":
                await _notificationService.NotifyRdvRejectedAsync(dto.RdvId, dto.ClientUserId, dto.Motif);
                break;
            case "Cancelled":
                await _notificationService.NotifyRdvCancelledAsync(dto.RdvId, dto.ClientUserId, dto.CancelledByClient);
                break;
            default:
                _logger.LogWarning("Unknown RDV event: {Event}", dto.Event);
                break;
        }

        return Ok(new ApiResponse<bool> { Success = true, Data = true });
    }

    /// <summary>
    /// Internal: Create notification for payment events
    /// </summary>
    [HttpPost("internal/payment")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<bool>>> NotifyPayment([FromBody] PaymentNotificationDto dto)
    {
        if (!IsApiKeyValid())
            return Unauthorized(new ApiResponse<bool> { Success = false, Message = "API Key invalide" });

        _logger.LogInformation("Internal notification request for payment, InterventionId: {InterventionId}, Event: {Event}", 
            dto.InterventionId, dto.Event);

        switch (dto.Event)
        {
            case "Success":
                await _notificationService.NotifyPaymentSuccessAsync(dto.InterventionId, dto.ClientUserId, dto.Montant);
                break;
            case "Failed":
                await _notificationService.NotifyPaymentFailedAsync(dto.InterventionId, dto.ClientUserId);
                break;
            default:
                _logger.LogWarning("Unknown payment event: {Event}", dto.Event);
                break;
        }

        return Ok(new ApiResponse<bool> { Success = true, Data = true });
    }
}

// DTOs for internal notification endpoints
public class InterventionNotificationDto
{
    public int InterventionId { get; set; }
    public int ReclamationId { get; set; }
    public string TechnicienUserId { get; set; } = string.Empty;
    public string? ClientUserId { get; set; }
    public string Event { get; set; } = string.Empty; // "Created", "StatusChanged"
    public string? NewStatus { get; set; }
}

public class EvaluationNotificationDto
{
    public int EvaluationId { get; set; }
    public int InterventionId { get; set; }
    public string TechnicienUserId { get; set; } = string.Empty;
}

public class ReclamationNotificationDto
{
    public int ReclamationId { get; set; }
    public int ClientId { get; set; }
    public string ClientUserId { get; set; } = string.Empty;
    public string Event { get; set; } = string.Empty; // "Created", "StatusChanged"
    public string? NewStatus { get; set; }
}

public class RdvNotificationDto
{
    public int RdvId { get; set; }
    public string ClientUserId { get; set; } = string.Empty;
    public DateTime? DateProposee { get; set; }
    public DateTime? DateConfirmee { get; set; }
    public string? Motif { get; set; }
    public bool CancelledByClient { get; set; }
    public string Event { get; set; } = string.Empty; // "Requested", "Confirmed", "Rejected", "Cancelled"
}

public class PaymentNotificationDto
{
    public int InterventionId { get; set; }
    public string ClientUserId { get; set; } = string.Empty;
    public decimal Montant { get; set; }
    public string Event { get; set; } = string.Empty; // "Success", "Failed"
}
