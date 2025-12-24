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

    public PaymentsController(IPaymentService paymentService)
    {
        _paymentService = paymentService;
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
        var payment = await _paymentService.GetByInterventionIdAsync(interventionId);
        if (payment == null)
            return NotFound(new ApiResponse<PaymentDto> { Success = false, Message = "Paiement non trouvé" });
        return Ok(new ApiResponse<PaymentDto>
        {
            Success = true,
            Data = payment
        });
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
        try
        {
            var session = await _paymentService.CreateCheckoutSessionAsync(dto);
            return Ok(new ApiResponse<StripeCheckoutSessionDto>
            {
                Success = true,
                Data = session,
                Message = "Session de paiement créée"
            });
        }
        catch (Exception ex)
        {
            return BadRequest(new ApiResponse<StripeCheckoutSessionDto>
            {
                Success = false,
                Message = "Erreur lors de la création de la session",
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
