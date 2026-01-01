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
public class ConversationsController : ControllerBase
{
    private readonly IMessagingService _messagingService;
    private readonly ILogger<ConversationsController> _logger;

    public ConversationsController(IMessagingService messagingService, ILogger<ConversationsController> logger)
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

    private string GetUserRole() => User.FindFirst(ClaimTypes.Role)?.Value 
                                    ?? User.FindFirst("role")?.Value 
                                    ?? "";

    /// <summary>
    /// Récupérer toutes les conversations de l'utilisateur connecté
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<ApiResponse<List<ConversationDto>>>> GetConversations(
        [FromQuery] bool includeArchived = false)
    {
        try
        {
            var userId = GetUserId();
            var conversations = await _messagingService.GetUserConversationsAsync(userId, includeArchived);
            return Ok(new ApiResponse<List<ConversationDto>> { Success = true, Data = conversations });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting conversations");
            return StatusCode(500, new ApiResponse<List<ConversationDto>> 
            { 
                Success = false, 
                Message = "Erreur lors de la récupération des conversations",
                Errors = new List<string> { ex.Message }
            });
        }
    }

    /// <summary>
    /// Récupérer une conversation par ID
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<ConversationDto>>> GetConversation(int id)
    {
        try
        {
            var userId = GetUserId();
            var conversation = await _messagingService.GetConversationByIdAsync(id, userId);
            
            if (conversation == null)
            {
                return NotFound(new ApiResponse<ConversationDto> 
                { 
                    Success = false, 
                    Message = "Conversation non trouvée" 
                });
            }
            
            return Ok(new ApiResponse<ConversationDto> { Success = true, Data = conversation });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting conversation {ConversationId}", id);
            return StatusCode(500, new ApiResponse<ConversationDto> 
            { 
                Success = false, 
                Message = "Erreur lors de la récupération de la conversation",
                Errors = new List<string> { ex.Message }
            });
        }
    }

    /// <summary>
    /// Démarrer une nouvelle conversation avec un responsable
    /// (Utilisé par les clients et techniciens)
    /// </summary>
    [HttpPost("start")]
    public async Task<ActionResult<ApiResponse<ConversationDto>>> StartConversation(
        [FromBody] StartConversationDto dto,
        [FromQuery] string? responsableUserId = null)
    {
        try
        {
            var userId = GetUserId();
            var userName = GetUserName();
            var userRole = GetUserRole();

            // Vérifier que l'utilisateur n'est pas déjà un responsable
            if (userRole == Roles.ResponsableSAV)
            {
                return BadRequest(new ApiResponse<ConversationDto> 
                { 
                    Success = false, 
                    Message = "Les responsables ne peuvent pas démarrer une conversation de cette manière" 
                });
            }

            // Si pas de responsable spécifié, récupérer le premier disponible
            // (Dans un vrai système, on aurait une logique de répartition)
            string targetResponsableId = responsableUserId ?? "";
            string responsableNom = "Responsable SAV";

            if (string.IsNullOrEmpty(targetResponsableId))
            {
                // TODO: Implémenter la logique pour trouver un responsable disponible
                return BadRequest(new ApiResponse<ConversationDto> 
                { 
                    Success = false, 
                    Message = "Aucun responsable disponible. Veuillez spécifier un responsable." 
                });
            }

            var createDto = new CreateConversationDto
            {
                ParticipantUserId = userId,
                ParticipantNom = userName,
                ParticipantRole = userRole,
                ResponsableUserId = targetResponsableId,
                ResponsableNom = responsableNom,
                Sujet = dto.Sujet,
                ReclamationId = dto.ReclamationId,
                InterventionId = dto.InterventionId
            };

            var conversation = await _messagingService.CreateConversationAsync(createDto);

            // Si un message initial est fourni, l'envoyer
            if (!string.IsNullOrWhiteSpace(dto.MessageInitial))
            {
                await _messagingService.SendMessageAsync(new SendMessageDto
                {
                    ConversationId = conversation.Id,
                    ExpediteurUserId = userId,
                    ExpediteurNom = userName,
                    Contenu = dto.MessageInitial
                });
            }

            return CreatedAtAction(nameof(GetConversation), new { id = conversation.Id },
                new ApiResponse<ConversationDto> 
                { 
                    Success = true, 
                    Data = conversation, 
                    Message = "Conversation créée avec succès" 
                });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error starting conversation");
            return StatusCode(500, new ApiResponse<ConversationDto> 
            { 
                Success = false, 
                Message = "Erreur lors de la création de la conversation",
                Errors = new List<string> { ex.Message }
            });
        }
    }

    /// <summary>
    /// Créer une conversation (utilisé par les responsables pour contacter un client/technicien)
    /// </summary>
    [HttpPost]
    [Authorize(Roles = "ResponsableSAV")]
    public async Task<ActionResult<ApiResponse<ConversationDto>>> CreateConversation([FromBody] CreateConversationDto dto)
    {
        try
        {
            var userId = GetUserId();
            var userName = GetUserName();

            // Le responsable est l'initiateur
            dto.ResponsableUserId = userId;
            dto.ResponsableNom = userName;

            var conversation = await _messagingService.CreateConversationAsync(dto);
            return CreatedAtAction(nameof(GetConversation), new { id = conversation.Id },
                new ApiResponse<ConversationDto> 
                { 
                    Success = true, 
                    Data = conversation, 
                    Message = "Conversation créée avec succès" 
                });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating conversation");
            return StatusCode(500, new ApiResponse<ConversationDto> 
            { 
                Success = false, 
                Message = "Erreur lors de la création de la conversation",
                Errors = new List<string> { ex.Message }
            });
        }
    }

    /// <summary>
    /// Archiver une conversation
    /// </summary>
    [HttpPut("{id}/archive")]
    public async Task<ActionResult<ApiResponse<bool>>> ArchiveConversation(int id)
    {
        try
        {
            var userId = GetUserId();
            var result = await _messagingService.ArchiveConversationAsync(id, userId);
            
            if (!result)
            {
                return NotFound(new ApiResponse<bool> 
                { 
                    Success = false, 
                    Message = "Conversation non trouvée" 
                });
            }
            
            return Ok(new ApiResponse<bool> 
            { 
                Success = true, 
                Data = true, 
                Message = "Conversation archivée" 
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error archiving conversation {ConversationId}", id);
            return StatusCode(500, new ApiResponse<bool> 
            { 
                Success = false, 
                Message = "Erreur lors de l'archivage",
                Errors = new List<string> { ex.Message }
            });
        }
    }

    /// <summary>
    /// Désarchiver une conversation
    /// </summary>
    [HttpPut("{id}/unarchive")]
    public async Task<ActionResult<ApiResponse<bool>>> UnarchiveConversation(int id)
    {
        try
        {
            var userId = GetUserId();
            var result = await _messagingService.UnarchiveConversationAsync(id, userId);
            
            if (!result)
            {
                return NotFound(new ApiResponse<bool> 
                { 
                    Success = false, 
                    Message = "Conversation non trouvée" 
                });
            }
            
            return Ok(new ApiResponse<bool> 
            { 
                Success = true, 
                Data = true, 
                Message = "Conversation désarchivée" 
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error unarchiving conversation {ConversationId}", id);
            return StatusCode(500, new ApiResponse<bool> 
            { 
                Success = false, 
                Message = "Erreur lors de la désarchivation",
                Errors = new List<string> { ex.Message }
            });
        }
    }

    /// <summary>
    /// Rechercher dans les conversations
    /// </summary>
    [HttpGet("search")]
    public async Task<ActionResult<ApiResponse<List<ConversationDto>>>> SearchConversations([FromQuery] string q)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(q))
            {
                return BadRequest(new ApiResponse<List<ConversationDto>> 
                { 
                    Success = false, 
                    Message = "Le terme de recherche est requis" 
                });
            }

            var userId = GetUserId();
            var conversations = await _messagingService.SearchConversationsAsync(userId, q);
            return Ok(new ApiResponse<List<ConversationDto>> { Success = true, Data = conversations });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error searching conversations");
            return StatusCode(500, new ApiResponse<List<ConversationDto>> 
            { 
                Success = false, 
                Message = "Erreur lors de la recherche",
                Errors = new List<string> { ex.Message }
            });
        }
    }

    /// <summary>
    /// Récupérer les contacts disponibles pour démarrer une conversation
    /// </summary>
    [HttpGet("contacts")]
    public async Task<ActionResult<ApiResponse<List<ContactDto>>>> GetAvailableContacts()
    {
        try
        {
            var userId = GetUserId();
            var userRole = GetUserRole();
            var contacts = await _messagingService.GetAvailableContactsAsync(userId, userRole);
            return Ok(new ApiResponse<List<ContactDto>> { Success = true, Data = contacts });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting available contacts");
            return StatusCode(500, new ApiResponse<List<ContactDto>> 
            { 
                Success = false, 
                Message = "Erreur lors de la récupération des contacts",
                Errors = new List<string> { ex.Message }
            });
        }
    }

    /// <summary>
    /// Démarrer ou récupérer une conversation avec un contact
    /// </summary>
    [HttpPost("start-with/{contactUserId}")]
    public async Task<ActionResult<ApiResponse<ConversationDto>>> StartOrGetConversation(
        string contactUserId,
        [FromQuery] string? sujet = null)
    {
        try
        {
            var userId = GetUserId();
            var userName = GetUserName();
            var userRole = GetUserRole();

            ConversationDto? conversation;

            if (userRole == "ResponsableSAV")
            {
                // Le responsable contacte un client ou technicien
                conversation = await _messagingService.GetOrCreateConversationAsync(
                    participantUserId: contactUserId,
                    responsableUserId: userId,
                    sujet: sujet);
            }
            else
            {
                // Le client ou technicien contacte un responsable
                conversation = await _messagingService.GetOrCreateConversationAsync(
                    participantUserId: userId,
                    responsableUserId: contactUserId,
                    sujet: sujet);
            }

            if (conversation == null)
            {
                return BadRequest(new ApiResponse<ConversationDto> 
                { 
                    Success = false, 
                    Message = "Impossible de créer la conversation. Contact non trouvé." 
                });
            }

            return Ok(new ApiResponse<ConversationDto> 
            { 
                Success = true, 
                Data = conversation,
                Message = "Conversation prête"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error starting conversation with {ContactUserId}", contactUserId);
            return StatusCode(500, new ApiResponse<ConversationDto> 
            { 
                Success = false, 
                Message = "Erreur lors du démarrage de la conversation",
                Errors = new List<string> { ex.Message }
            });
        }
    }
}
