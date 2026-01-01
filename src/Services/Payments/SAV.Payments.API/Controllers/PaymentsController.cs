using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SAV.Payments.Application.Interfaces;
using SAV.Payments.Domain.Entities;
using SAV.Shared.Common;

namespace SAV.Payments.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PaymentsController : ControllerBase
{
    private readonly IPaymentService _paymentService;
    private readonly ILogger<PaymentsController> _logger;

    public PaymentsController(IPaymentService paymentService, ILogger<PaymentsController> logger)
    {
        _paymentService = paymentService;
        _logger = logger;
    }

    /// <summary>
    /// Health check endpoint
    /// </summary>
    [HttpGet("health")]
    [AllowAnonymous]
    public ActionResult Health()
    {
        return Ok(new { status = "healthy", service = "Payments API", timestamp = DateTime.UtcNow });
    }

    /// <summary>
    /// Obtenir tous les paiements
    /// </summary>
    [HttpGet]
    [Authorize(Roles = "ResponsableSAV")]
    public async Task<ActionResult<ApiResponse<IEnumerable<PaymentDto>>>> GetAll()
    {
        var payments = await _paymentService.GetAllAsync();
        return Ok(new ApiResponse<IEnumerable<PaymentDto>>
        {
            Success = true,
            Data = payments
        });
    }

    /// <summary>
    /// Obtenir un paiement par ID
    /// </summary>
    [HttpGet("{id}")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<PaymentDto>>> GetById(int id)
    {
        var payment = await _paymentService.GetByIdAsync(id);
        if (payment == null)
            return NotFound(new ApiResponse<PaymentDto> { Success = false, Message = "Paiement non trouvé" });
        return Ok(new ApiResponse<PaymentDto>
        {
            Success = true,
            Data = payment
        });
    }

    /// <summary>
    /// Obtenir le paiement d'une intervention
    /// </summary>
    [HttpGet("intervention/{interventionId}")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<PaymentDto>>> GetByInterventionId(int interventionId)
    {
        try
        {
            _logger.LogInformation("Getting payment for intervention {InterventionId}", interventionId);
            var payment = await _paymentService.GetByInterventionIdAsync(interventionId);
            if (payment == null)
            {
                _logger.LogInformation("No payment found for intervention {InterventionId}", interventionId);
                return NotFound(new ApiResponse<PaymentDto> { Success = false, Message = "Paiement non trouvé" });
            }
            return Ok(new ApiResponse<PaymentDto>
            {
                Success = true,
                Data = payment
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting payment for intervention {InterventionId}", interventionId);
            return StatusCode(500, new ApiResponse<PaymentDto>
            {
                Success = false,
                Message = "Erreur interne du serveur",
                Errors = new List<string> { ex.Message }
            });
        }
    }

    /// <summary>
    /// Obtenir le paiement d'une facture (alias pour compatibilité frontend)
    /// </summary>
    [HttpGet("facture/{factureId}")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<PaymentDto>>> GetByFactureId(int factureId)
    {
        // Dans ce contexte, factureId = interventionId car chaque intervention a une facture
        var payment = await _paymentService.GetByInterventionIdAsync(factureId);
        if (payment == null)
            return NotFound(new ApiResponse<PaymentDto> { Success = false, Message = "Paiement non trouvé" });
        return Ok(new ApiResponse<PaymentDto>
        {
            Success = true,
            Data = payment
        });
    }

    /// <summary>
    /// Obtenir les paiements d'un client
    /// </summary>
    [HttpGet("client/{clientId}")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<IEnumerable<PaymentDto>>>> GetByClientId(int clientId)
    {
        var payments = await _paymentService.GetByClientIdAsync(clientId);
        return Ok(new ApiResponse<IEnumerable<PaymentDto>>
        {
            Success = true,
            Data = payments
        });
    }

    /// <summary>
    /// Créer une session de paiement Stripe
    /// </summary>
    [HttpPost("checkout")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<StripeCheckoutSessionDto>>> CreateCheckoutSession([FromBody] CreatePaymentDto dto)
    {
        if (!ModelState.IsValid)
        {
            var errors = ModelState.Values
                .SelectMany(v => v.Errors)
                .Select(e => e.ErrorMessage)
                .ToList();
            return BadRequest(new ApiResponse<StripeCheckoutSessionDto>
            {
                Success = false,
                Message = "Données de paiement invalides",
                Errors = errors
            });
        }

        try
        {
            _logger.LogInformation("Creating checkout session for intervention {InterventionId}, clientId {ClientId}, montant {Montant}", 
                dto.InterventionId, dto.ClientId, dto.Montant);
            
            var session = await _paymentService.CreateCheckoutSessionAsync(dto);
            
            _logger.LogInformation("Checkout session created successfully: {SessionUrl}", session.SessionUrl);
            
            return Ok(new ApiResponse<StripeCheckoutSessionDto>
            {
                Success = true,
                Data = session,
                Message = "Session de paiement créée"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating checkout session for intervention {InterventionId}", dto.InterventionId);
            return BadRequest(new ApiResponse<StripeCheckoutSessionDto>
            {
                Success = false,
                Message = "Erreur lors de la création de la session: " + ex.Message,
                Errors = new List<string> { ex.Message }
            });
        }
    }

    /// <summary>
    /// Webhook Stripe
    /// </summary>
    [HttpPost("webhook")]
    [AllowAnonymous]
    public async Task<IActionResult> HandleWebhook()
    {
        var json = await new StreamReader(HttpContext.Request.Body).ReadToEndAsync();
        var signature = Request.Headers["Stripe-Signature"];

        try
        {
            await _paymentService.HandleStripeWebhookAsync(json, signature!);
            return Ok();
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>
    /// Confirmer un paiement depuis Stripe (fallback si webhook ne fonctionne pas)
    /// </summary>
    [HttpPost("confirm/{interventionId}")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<PaymentDto>>> ConfirmPayment(int interventionId)
    {
        try
        {
            var payment = await _paymentService.ConfirmPaymentFromStripeAsync(interventionId);
            if (payment == null)
            {
                return NotFound(new ApiResponse<PaymentDto>
                {
                    Success = false,
                    Message = "Paiement non trouvé"
                });
            }
            return Ok(new ApiResponse<PaymentDto>
            {
                Success = true,
                Data = payment,
                Message = "Paiement confirmé"
            });
        }
        catch (Exception ex)
        {
            return BadRequest(new ApiResponse<PaymentDto>
            {
                Success = false,
                Message = "Erreur lors de la confirmation du paiement",
                Errors = new List<string> { ex.Message }
            });
        }
    }

    /// <summary>
    /// Enregistrer un paiement manuel (espèces, chèque, virement)
    /// </summary>
    [HttpPost("manual")]
    [Authorize(Roles = "ResponsableSAV")]
    public async Task<ActionResult<ApiResponse<PaymentDto>>> CreateManualPayment([FromBody] CreateManualPaymentDto dto)
    {
        try
        {
            var payment = await _paymentService.CreateManualPaymentAsync(dto);
            return Ok(new ApiResponse<PaymentDto>
            {
                Success = true,
                Data = payment,
                Message = "Paiement manuel enregistré"
            });
        }
        catch (Exception ex)
        {
            return BadRequest(new ApiResponse<PaymentDto>
            {
                Success = false,
                Message = "Erreur lors de l'enregistrement du paiement",
                Errors = new List<string> { ex.Message }
            });
        }
    }

    /// <summary>
    /// Rembourser un paiement
    /// </summary>
    [HttpPost("{id}/refund")]
    [Authorize(Roles = "ResponsableSAV")]
    public async Task<ActionResult<ApiResponse<PaymentDto>>> RefundPayment(int id)
    {
        try
        {
            var payment = await _paymentService.RefundPaymentAsync(id);
            return Ok(new ApiResponse<PaymentDto>
            {
                Success = true,
                Data = payment,
                Message = "Paiement remboursé"
            });
        }
        catch (KeyNotFoundException)
        {
            return NotFound(new ApiResponse<PaymentDto>
            {
                Success = false,
                Message = "Paiement non trouvé"
            });
        }
        catch (Exception ex)
        {
            return BadRequest(new ApiResponse<PaymentDto>
            {
                Success = false,
                Message = "Erreur lors du remboursement",
                Errors = new List<string> { ex.Message }
            });
        }
    }

    /// <summary>
    /// Obtenir les statistiques des paiements
    /// </summary>
    [HttpGet("stats")]
    [Authorize(Roles = "ResponsableSAV")]
    public async Task<ActionResult<ApiResponse<PaymentStatsDto>>> GetStats()
    {
        var stats = await _paymentService.GetPaymentStatsAsync();
        return Ok(new ApiResponse<PaymentStatsDto>
        {
            Success = true,
            Data = stats
        });
    }
}
