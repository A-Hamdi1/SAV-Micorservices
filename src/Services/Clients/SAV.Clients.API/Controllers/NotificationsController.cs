using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SAV.Clients.Application.Interfaces;
using SAV.Shared.Common;
using SAV.Shared.DTOs.Notifications;
using System.Security.Claims;

namespace SAV.Clients.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class NotificationsController : ControllerBase
{
    private readonly INotificationService _notificationService;

    public NotificationsController(INotificationService notificationService)
    {
        _notificationService = notificationService;
    }

    private string GetUserId()
    {
        return User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? User.FindFirst("sub")?.Value
            ?? throw new UnauthorizedAccessException("User ID not found in token");
    }

    /// <summary>
    /// Récupère toutes les notifications de l'utilisateur connecté (avec pagination)
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<ApiResponse<List<NotificationDto>>>> GetNotifications(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var userId = GetUserId();
        var notifications = await _notificationService.GetUserNotificationsAsync(userId, page, pageSize);
        return Ok(new ApiResponse<List<NotificationDto>>
        {
            Success = true,
            Data = notifications
        });
    }

    /// <summary>
    /// Récupère les notifications non lues de l'utilisateur connecté
    /// </summary>
    [HttpGet("unread")]
    public async Task<ActionResult<ApiResponse<List<NotificationDto>>>> GetUnreadNotifications()
    {
        var userId = GetUserId();
        var notifications = await _notificationService.GetUnreadNotificationsAsync(userId);
        return Ok(new ApiResponse<List<NotificationDto>>
        {
            Success = true,
            Data = notifications
        });
    }

    /// <summary>
    /// Récupère le compteur de notifications (total et non lues)
    /// </summary>
    [HttpGet("count")]
    public async Task<ActionResult<ApiResponse<NotificationCountDto>>> GetNotificationCount()
    {
        var userId = GetUserId();
        var count = await _notificationService.GetNotificationCountAsync(userId);
        return Ok(new ApiResponse<NotificationCountDto>
        {
            Success = true,
            Data = count
        });
    }

    /// <summary>
    /// Récupère une notification par son ID
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<NotificationDto>>> GetNotificationById(int id)
    {
        var notification = await _notificationService.GetNotificationByIdAsync(id);
        if (notification == null)
        {
            return NotFound(new ApiResponse<NotificationDto>
            {
                Success = false,
                Message = "Notification non trouvée"
            });
        }

        var userId = GetUserId();
        if (notification.UserId != userId)
        {
            return Forbid();
        }

        return Ok(new ApiResponse<NotificationDto>
        {
            Success = true,
            Data = notification
        });
    }

    /// <summary>
    /// Marque une notification comme lue
    /// </summary>
    [HttpPut("{id}/read")]
    public async Task<ActionResult<ApiResponse<bool>>> MarkAsRead(int id)
    {
        var userId = GetUserId();
        var result = await _notificationService.MarkAsReadAsync(id, userId);

        if (!result)
        {
            return NotFound(new ApiResponse<bool>
            {
                Success = false,
                Message = "Notification non trouvée"
            });
        }

        return Ok(new ApiResponse<bool>
        {
            Success = true,
            Data = true,
            Message = "Notification marquée comme lue"
        });
    }

    /// <summary>
    /// Marque toutes les notifications comme lues
    /// </summary>
    [HttpPut("read-all")]
    public async Task<ActionResult<ApiResponse<bool>>> MarkAllAsRead()
    {
        var userId = GetUserId();
        await _notificationService.MarkAllAsReadAsync(userId);
        return Ok(new ApiResponse<bool>
        {
            Success = true,
            Data = true,
            Message = "Toutes les notifications ont été marquées comme lues"
        });
    }

    /// <summary>
    /// Supprime une notification
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<ActionResult<ApiResponse<bool>>> DeleteNotification(int id)
    {
        var userId = GetUserId();
        var result = await _notificationService.DeleteNotificationAsync(id, userId);

        if (!result)
        {
            return NotFound(new ApiResponse<bool>
            {
                Success = false,
                Message = "Notification non trouvée"
            });
        }

        return Ok(new ApiResponse<bool>
        {
            Success = true,
            Data = true,
            Message = "Notification supprimée"
        });
    }

    /// <summary>
    /// Supprime toutes les notifications lues
    /// </summary>
    [HttpDelete("read")]
    public async Task<ActionResult<ApiResponse<bool>>> DeleteAllReadNotifications()
    {
        var userId = GetUserId();
        await _notificationService.DeleteAllReadNotificationsAsync(userId);
        return Ok(new ApiResponse<bool>
        {
            Success = true,
            Data = true,
            Message = "Toutes les notifications lues ont été supprimées"
        });
    }

    /// <summary>
    /// Crée une notification (usage interne / inter-services)
    /// </summary>
    [HttpPost]
    [Authorize(Roles = $"{Roles.ResponsableSAV},{Roles.Technicien}")]
    public async Task<ActionResult<ApiResponse<NotificationDto>>> CreateNotification([FromBody] CreateNotificationDto dto)
    {
        var notification = await _notificationService.CreateNotificationAsync(dto);
        return CreatedAtAction(nameof(GetNotificationById), new { id = notification.Id },
            new ApiResponse<NotificationDto>
            {
                Success = true,
                Data = notification,
                Message = "Notification créée avec succès"
            });
    }

    // ==================== Endpoints internes pour communication inter-services ====================

    /// <summary>
    /// Endpoint interne pour notifier les interventions (appelé par Interventions API)
    /// </summary>
    [HttpPost("internal/intervention")]
    [AllowAnonymous] // Utilise ApiKey pour l'authentification inter-services
    public async Task<ActionResult<ApiResponse<bool>>> NotifyIntervention([FromBody] InternalInterventionNotificationDto dto, [FromHeader(Name = "X-Api-Key")] string? apiKey)
    {
        // Vérifier l'API Key pour les appels inter-services
        var validApiKey = Environment.GetEnvironmentVariable("InterServiceApiKey") ?? "f1c4a9e2d7b3f8c6e0a2d5c1b7e9f3a0";
        if (string.IsNullOrEmpty(apiKey) || apiKey != validApiKey)
        {
            return Unauthorized(new ApiResponse<bool> { Success = false, Message = "API Key invalide" });
        }

        try
        {
            if (dto.EventType == "Created")
            {
                await _notificationService.NotifyInterventionCreatedAsync(
                    dto.InterventionId,
                    dto.ReclamationId,
                    dto.TechnicienUserId,
                    dto.ClientUserId
                );
            }
            else if (dto.EventType == "StatusChanged" && !string.IsNullOrEmpty(dto.NewStatus))
            {
                await _notificationService.NotifyInterventionStatusChangedAsync(
                    dto.InterventionId,
                    dto.NewStatus,
                    dto.TechnicienUserId,
                    dto.ClientUserId
                );
            }

            return Ok(new ApiResponse<bool> { Success = true, Data = true });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<bool> { Success = false, Message = ex.Message });
        }
    }

    /// <summary>
    /// Endpoint interne pour notifier les évaluations (appelé par Interventions API)
    /// </summary>
    [HttpPost("internal/evaluation")]
    [AllowAnonymous] // Utilise ApiKey pour l'authentification inter-services
    public async Task<ActionResult<ApiResponse<bool>>> NotifyEvaluation([FromBody] InternalEvaluationNotificationDto dto, [FromHeader(Name = "X-Api-Key")] string? apiKey)
    {
        var validApiKey = Environment.GetEnvironmentVariable("InterServiceApiKey") ?? "f1c4a9e2d7b3f8c6e0a2d5c1b7e9f3a0";
        if (string.IsNullOrEmpty(apiKey) || apiKey != validApiKey)
        {
            return Unauthorized(new ApiResponse<bool> { Success = false, Message = "API Key invalide" });
        }

        try
        {
            await _notificationService.NotifyEvaluationReceivedAsync(
                dto.EvaluationId,
                dto.InterventionId,
                dto.TechnicienUserId
            );

            return Ok(new ApiResponse<bool> { Success = true, Data = true });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<bool> { Success = false, Message = ex.Message });
        }
    }
}

// DTOs pour les appels inter-services
public class InternalInterventionNotificationDto
{
    public int InterventionId { get; set; }
    public int ReclamationId { get; set; }
    public string? NewStatus { get; set; }
    public string TechnicienUserId { get; set; } = string.Empty;
    public string? ClientUserId { get; set; }
    public string EventType { get; set; } = string.Empty;
}

public class InternalEvaluationNotificationDto
{
    public int EvaluationId { get; set; }
    public int InterventionId { get; set; }
    public string TechnicienUserId { get; set; } = string.Empty;
}
