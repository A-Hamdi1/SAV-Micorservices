using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SAV.Messaging.Application.Interfaces;
using SAV.Shared.Common;
using SAV.Shared.DTOs.Messaging;
using System.Security.Claims;

namespace SAV.Messaging.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class MessagesController : ControllerBase
{
    private readonly IMessagingService _messagingService;
    private readonly ILogger<MessagesController> _logger;

    public MessagesController(IMessagingService messagingService, ILogger<MessagesController> logger)
    {
        _messagingService = messagingService;
        _logger = logger;
    }

    private string GetUserId() => User.FindFirst(ClaimTypes.NameIdentifier)?.Value 
                                  ?? User.FindFirst("sub")?.Value 
                                  ?? throw new UnauthorizedAccessException("User ID not found");

    private string GetUserName() => User.FindFirst("name")?.Value 
                                    ?? User.FindFirst(ClaimTypes.Name)?.Value 
                                    ?? "Utilisateur";

    /// <summary>
    /// Récupérer les messages d'une conversation
    /// </summary>
    [HttpGet("conversation/{conversationId}")]
    public async Task<ActionResult<ApiResponse<List<MessageDto>>>> GetMessages(
        int conversationId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50)
    {
        try
        {
            var userId = GetUserId();
            var messages = await _messagingService.GetConversationMessagesAsync(conversationId, userId, page, pageSize);
            return Ok(new ApiResponse<List<MessageDto>> { Success = true, Data = messages });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting messages for conversation {ConversationId}", conversationId);
            return StatusCode(500, new ApiResponse<List<MessageDto>> 
            { 
                Success = false, 
                Message = "Erreur lors de la récupération des messages",
                Errors = new List<string> { ex.Message }
            });
        }
    }

    /// <summary>
    /// Envoyer un message
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<ApiResponse<MessageDto>>> SendMessage([FromBody] SendMessageDto dto)
    {
        try
        {
            var userId = GetUserId();
            var userName = GetUserName();

            // S'assurer que l'expéditeur est bien l'utilisateur connecté
            dto.ExpediteurUserId = userId;
            dto.ExpediteurNom = userName;

            if (string.IsNullOrWhiteSpace(dto.Contenu))
            {
                return BadRequest(new ApiResponse<MessageDto> 
                { 
                    Success = false, 
                    Message = "Le contenu du message est requis" 
                });
            }

            var message = await _messagingService.SendMessageAsync(dto);
            return Ok(new ApiResponse<MessageDto> 
            { 
                Success = true, 
                Data = message, 
                Message = "Message envoyé" 
            });
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Invalid operation when sending message");
            return BadRequest(new ApiResponse<MessageDto> 
            { 
                Success = false, 
                Message = ex.Message 
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending message");
            return StatusCode(500, new ApiResponse<MessageDto> 
            { 
                Success = false, 
                Message = "Erreur lors de l'envoi du message",
                Errors = new List<string> { ex.Message }
            });
        }
    }

    /// <summary>
    /// Marquer un message comme lu
    /// </summary>
    [HttpPut("{id}/read")]
    public async Task<ActionResult<ApiResponse<bool>>> MarkAsRead(int id)
    {
        try
        {
            var userId = GetUserId();
            var result = await _messagingService.MarkMessageAsReadAsync(id, userId);
            return Ok(new ApiResponse<bool> { Success = true, Data = result });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error marking message {MessageId} as read", id);
            return StatusCode(500, new ApiResponse<bool> 
            { 
                Success = false, 
                Message = "Erreur lors du marquage comme lu",
                Errors = new List<string> { ex.Message }
            });
        }
    }

    /// <summary>
    /// Marquer tous les messages d'une conversation comme lus
    /// </summary>
    [HttpPut("conversation/{conversationId}/read")]
    public async Task<ActionResult<ApiResponse<bool>>> MarkConversationAsRead(int conversationId)
    {
        try
        {
            var userId = GetUserId();
            var result = await _messagingService.MarkConversationAsReadAsync(conversationId, userId);
            return Ok(new ApiResponse<bool> { Success = true, Data = result });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error marking conversation {ConversationId} as read", conversationId);
            return StatusCode(500, new ApiResponse<bool> 
            { 
                Success = false, 
                Message = "Erreur lors du marquage comme lu",
                Errors = new List<string> { ex.Message }
            });
        }
    }

    /// <summary>
    /// Récupérer le nombre de messages non lus
    /// </summary>
    [HttpGet("unread/count")]
    public async Task<ActionResult<ApiResponse<int>>> GetUnreadCount()
    {
        try
        {
            var userId = GetUserId();
            var count = await _messagingService.GetUnreadMessageCountAsync(userId);
            return Ok(new ApiResponse<int> { Success = true, Data = count });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting unread count");
            return StatusCode(500, new ApiResponse<int> 
            { 
                Success = false, 
                Message = "Erreur lors de la récupération du compteur",
                Errors = new List<string> { ex.Message }
            });
        }
    }
}
