using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SAV.Notifications.Application.Interfaces;
using SAV.Shared.Common;

namespace SAV.Notifications.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class NotificationsController : ControllerBase
{
    private readonly INotificationService _notificationService;

    public NotificationsController(INotificationService notificationService)
    {
        _notificationService = notificationService;
    }

    /// <summary>
    /// Obtenir toutes les notifications
    /// </summary>
    [HttpGet]
    [Authorize(Roles = "ResponsableSAV")]
    public async Task<IActionResult> GetAll()
    {
        var notifications = await _notificationService.GetAllAsync();
        return Ok(new ApiResponse<IEnumerable<object>>
        {
            Success = true,
            Data = notifications
        });
    }

    /// <summary>
    /// Obtenir une notification par ID
    /// </summary>
    [HttpGet("{id}")]
    [Authorize]
    public async Task<IActionResult> GetById(int id)
    {
        var notification = await _notificationService.GetByIdAsync(id);
        if (notification == null)
            return NotFound(new ApiResponse<object>
            {
                Success = false,
                Message = "Notification non trouvée"
            });
        return Ok(new ApiResponse<object>
        {
            Success = true,
            Data = notification
        });
    }

    /// <summary>
    /// Obtenir les notifications d'un client
    /// </summary>
    [HttpGet("client/{clientId}")]
    [Authorize]
    public async Task<IActionResult> GetByClientId(int clientId)
    {
        var notifications = await _notificationService.GetByClientIdAsync(clientId);
        return Ok(new ApiResponse<IEnumerable<object>>
        {
            Success = true,
            Data = notifications
        });
    }

    /// <summary>
    /// Envoyer une notification de réclamation créée
    /// </summary>
    [HttpPost("reclamation-created")]
    [Authorize]
    public async Task<IActionResult> SendReclamationCreated([FromBody] SendNotificationDto dto)
    {
        try
        {
            await _notificationService.SendReclamationCreatedAsync(dto);
            return Ok(new ApiResponse<object>
            {
                Success = true,
                Message = "Notification envoyée avec succès"
            });
        }
        catch (Exception ex)
        {
            return BadRequest(new ApiResponse<object>
            {
                Success = false,
                Message = "Erreur lors de l'envoi de la notification",
                Errors = new List<string> { ex.Message }
            });
        }
    }

    /// <summary>
    /// Envoyer une notification de changement de statut
    /// </summary>
    [HttpPost("reclamation-status-changed")]
    [Authorize]
    public async Task<IActionResult> SendReclamationStatusChanged([FromBody] SendNotificationDto dto)
    {
        await _notificationService.SendReclamationStatusChangedAsync(dto);
        return Ok();
    }

    /// <summary>
    /// Envoyer une notification d'intervention planifiée
    /// </summary>
    [HttpPost("intervention-scheduled")]
    [Authorize]
    public async Task<IActionResult> SendInterventionScheduled([FromBody] SendNotificationDto dto)
    {
        await _notificationService.SendInterventionScheduledAsync(dto);
        return Ok();
    }

    /// <summary>
    /// Envoyer une notification d'intervention terminée
    /// </summary>
    [HttpPost("intervention-completed")]
    [Authorize]
    public async Task<IActionResult> SendInterventionCompleted([FromBody] SendNotificationDto dto)
    {
        await _notificationService.SendInterventionCompletedAsync(dto);
        return Ok();
    }

    /// <summary>
    /// Envoyer une notification de paiement reçu
    /// </summary>
    [HttpPost("payment-received")]
    [Authorize]
    public async Task<IActionResult> SendPaymentReceived([FromBody] SendNotificationDto dto)
    {
        await _notificationService.SendPaymentReceivedAsync(dto);
        return Ok();
    }

    /// <summary>
    /// Envoyer un rappel d'expiration de garantie
    /// </summary>
    [HttpPost("warranty-expiration")]
    [Authorize]
    public async Task<IActionResult> SendWarrantyExpiration([FromBody] SendNotificationDto dto)
    {
        await _notificationService.SendWarrantyExpirationReminderAsync(dto);
        return Ok();
    }

    /// <summary>
    /// Envoyer un rappel de paiement
    /// </summary>
    [HttpPost("payment-reminder")]
    [Authorize(Roles = "ResponsableSAV")]
    public async Task<IActionResult> SendPaymentReminder([FromBody] SendNotificationDto dto)
    {
        await _notificationService.SendPaymentReminderAsync(dto);
        return Ok();
    }

    /// <summary>
    /// Traiter les notifications en attente (appelé par un job)
    /// </summary>
    [HttpPost("process-pending")]
    [Authorize(Roles = "ResponsableSAV")]
    public async Task<IActionResult> ProcessPending()
    {
        try
        {
            await _notificationService.ProcessPendingNotificationsAsync();
            return Ok(new ApiResponse<object>
            {
                Success = true,
                Message = "Notifications en attente traitées"
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<object>
            {
                Success = false,
                Message = "Erreur lors du traitement des notifications",
                Errors = new List<string> { ex.Message }
            });
        }
    }
}
