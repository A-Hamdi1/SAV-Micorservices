using SAV.Payments.Application.Interfaces;
using SAV.Payments.Domain.Entities;
using SAV.Payments.Domain.Interfaces;
using Stripe;
using Stripe.Checkout;
using Microsoft.Extensions.Configuration;

namespace SAV.Payments.Infrastructure.Services;

public class PaymentService : IPaymentService
{
    private readonly IPaymentRepository _paymentRepository;
    private readonly IConfiguration _configuration;
    private readonly string _webhookSecret;

    public PaymentService(IPaymentRepository paymentRepository, IConfiguration configuration)
    {
        _paymentRepository = paymentRepository;
        _configuration = configuration;
        _webhookSecret = configuration["Stripe:WebhookSecret"] ?? "";
        StripeConfiguration.ApiKey = configuration["Stripe:SecretKey"];
    }

    public async Task<PaymentDto?> GetByIdAsync(int id)
    {
        var payment = await _paymentRepository.GetByIdAsync(id);
        return payment == null ? null : MapToDto(payment);
    }

    public async Task<PaymentDto?> GetByInterventionIdAsync(int interventionId)
    {
        var payment = await _paymentRepository.GetByInterventionIdAsync(interventionId);
        return payment == null ? null : MapToDto(payment);
    }

    public async Task<IEnumerable<PaymentDto>> GetByClientIdAsync(int clientId)
    {
        var payments = await _paymentRepository.GetByClientIdAsync(clientId);
        return payments.Select(MapToDto);
    }

    public async Task<IEnumerable<PaymentDto>> GetAllAsync()
    {
        var payments = await _paymentRepository.GetAllAsync();
        return payments.Select(MapToDto);
    }

    public async Task<StripeCheckoutSessionDto> CreateCheckoutSessionAsync(CreatePaymentDto dto)
    {
        var options = new SessionCreateOptions
        {
            PaymentMethodTypes = new List<string> { "card" },
            LineItems = new List<SessionLineItemOptions>
            {
                new SessionLineItemOptions
                {
                    PriceData = new SessionLineItemPriceDataOptions
                    {
                        UnitAmount = (long)(dto.Montant * 100), // Stripe utilise les centimes
                        Currency = "eur",
                        ProductData = new SessionLineItemPriceDataProductDataOptions
                        {
                            Name = $"Intervention #{dto.InterventionId}",
                            Description = dto.Description ?? "Paiement de l'intervention SAV"
                        }
                    },
                    Quantity = 1
                }
            },
            Mode = "payment",
            SuccessUrl = dto.SuccessUrl,
            CancelUrl = dto.CancelUrl,
            Metadata = new Dictionary<string, string>
            {
                { "interventionId", dto.InterventionId.ToString() },
                { "clientId", dto.ClientId.ToString() }
            }
        };

        var service = new SessionService();
        var session = await service.CreateAsync(options);

        // Créer l'enregistrement du paiement
        var payment = new Payment
        {
            InterventionId = dto.InterventionId,
            ClientId = dto.ClientId,
            Montant = dto.Montant,
            StripeSessionId = session.Id,
            Statut = PaymentStatut.EnCours,
            Methode = PaymentMethode.Carte,
            Description = dto.Description
        };

        await _paymentRepository.CreateAsync(payment);

        return new StripeCheckoutSessionDto
        {
            SessionId = session.Id,
            SessionUrl = session.Url
        };
    }

    public async Task<PaymentDto> HandleStripeWebhookAsync(string json, string signature)
    {
        var stripeEvent = EventUtility.ConstructEvent(json, signature, _webhookSecret);

        if (stripeEvent.Type == "checkout.session.completed")
        {
            var session = stripeEvent.Data.Object as Session;
            if (session != null)
            {
                var payment = await _paymentRepository.GetByStripeSessionIdAsync(session.Id);
                if (payment != null)
                {
                    payment.Statut = PaymentStatut.Reussi;
                    payment.PaidAt = DateTime.UtcNow;
                    payment.StripePaymentIntentId = session.PaymentIntentId;
                    payment.NumeroTransaction = session.PaymentIntentId;
                    
                    // Récupérer le receipt URL
                    if (!string.IsNullOrEmpty(session.PaymentIntentId))
                    {
                        var paymentIntentService = new PaymentIntentService();
                        var paymentIntent = await paymentIntentService.GetAsync(session.PaymentIntentId);
                        if (paymentIntent.LatestCharge != null)
                        {
                            var chargeService = new ChargeService();
                            var charge = await chargeService.GetAsync(paymentIntent.LatestChargeId);
                            payment.ReceiptUrl = charge.ReceiptUrl;
                        }
                    }

                    await _paymentRepository.UpdateAsync(payment);
                    return MapToDto(payment);
                }
            }
        }
        else if (stripeEvent.Type == "payment_intent.payment_failed")
        {
            var paymentIntent = stripeEvent.Data.Object as PaymentIntent;
            if (paymentIntent != null)
            {
                var payment = await _paymentRepository.GetByStripePaymentIntentIdAsync(paymentIntent.Id);
                if (payment != null)
                {
                    payment.Statut = PaymentStatut.Echoue;
                    await _paymentRepository.UpdateAsync(payment);
                    return MapToDto(payment);
                }
            }
        }

        throw new InvalidOperationException("Événement Stripe non géré");
    }

    public async Task<PaymentDto> CreateManualPaymentAsync(CreateManualPaymentDto dto)
    {
        var payment = new Payment
        {
            InterventionId = dto.InterventionId,
            ClientId = dto.ClientId,
            Montant = dto.Montant,
            Methode = dto.Methode,
            Statut = PaymentStatut.Reussi,
            NumeroTransaction = dto.NumeroTransaction ?? Guid.NewGuid().ToString("N")[..12].ToUpper(),
            Description = dto.Description,
            PaidAt = DateTime.UtcNow
        };

        await _paymentRepository.CreateAsync(payment);
        return MapToDto(payment);
    }

    public async Task<PaymentDto> RefundPaymentAsync(int paymentId)
    {
        var payment = await _paymentRepository.GetByIdAsync(paymentId);
        if (payment == null)
            throw new KeyNotFoundException("Paiement non trouvé");

        if (payment.Statut != PaymentStatut.Reussi)
            throw new InvalidOperationException("Seuls les paiements réussis peuvent être remboursés");

        // Si c'est un paiement Stripe, effectuer le remboursement
        if (!string.IsNullOrEmpty(payment.StripePaymentIntentId))
        {
            var refundService = new RefundService();
            await refundService.CreateAsync(new RefundCreateOptions
            {
                PaymentIntent = payment.StripePaymentIntentId
            });
        }

        payment.Statut = PaymentStatut.Rembourse;
        await _paymentRepository.UpdateAsync(payment);

        return MapToDto(payment);
    }

    public async Task<PaymentStatsDto> GetPaymentStatsAsync()
    {
        var now = DateTime.UtcNow;
        var startOfMonth = new DateTime(now.Year, now.Month, 1);

        return new PaymentStatsDto
        {
            TotalRevenue = await _paymentRepository.GetTotalRevenueAsync(),
            RevenueThisMonth = await _paymentRepository.GetTotalRevenueAsync(startOfMonth),
            TotalPayments = (await _paymentRepository.GetAllAsync()).Count(),
            PendingPayments = await _paymentRepository.GetPaymentCountByStatutAsync(PaymentStatut.EnAttente) +
                              await _paymentRepository.GetPaymentCountByStatutAsync(PaymentStatut.EnCours),
            SuccessfulPayments = await _paymentRepository.GetPaymentCountByStatutAsync(PaymentStatut.Reussi),
            FailedPayments = await _paymentRepository.GetPaymentCountByStatutAsync(PaymentStatut.Echoue)
        };
    }

    public async Task<PaymentDto?> ConfirmPaymentFromStripeAsync(int interventionId)
    {
        var payment = await _paymentRepository.GetByInterventionIdAsync(interventionId);
        if (payment == null)
            return null;

        // Si déjà réussi, retourner le paiement
        if (payment.Statut == PaymentStatut.Reussi)
            return MapToDto(payment);

        // Vérifier le statut sur Stripe
        if (!string.IsNullOrEmpty(payment.StripeSessionId))
        {
            var sessionService = new SessionService();
            var session = await sessionService.GetAsync(payment.StripeSessionId);

            if (session.PaymentStatus == "paid")
            {
                payment.Statut = PaymentStatut.Reussi;
                payment.PaidAt = DateTime.UtcNow;
                payment.StripePaymentIntentId = session.PaymentIntentId;
                payment.NumeroTransaction = session.PaymentIntentId;

                // Récupérer le receipt URL
                if (!string.IsNullOrEmpty(session.PaymentIntentId))
                {
                    var paymentIntentService = new PaymentIntentService();
                    var paymentIntent = await paymentIntentService.GetAsync(session.PaymentIntentId);
                    if (!string.IsNullOrEmpty(paymentIntent.LatestChargeId))
                    {
                        var chargeService = new ChargeService();
                        var charge = await chargeService.GetAsync(paymentIntent.LatestChargeId);
                        payment.ReceiptUrl = charge.ReceiptUrl;
                    }
                }

                await _paymentRepository.UpdateAsync(payment);
            }
        }

        return MapToDto(payment);
    }

    private static PaymentDto MapToDto(Payment payment) => new()
    {
        Id = payment.Id,
        InterventionId = payment.InterventionId,
        ClientId = payment.ClientId,
        Montant = payment.Montant,
        Statut = payment.Statut.ToString(),
        Methode = payment.Methode.ToString(),
        NumeroTransaction = payment.NumeroTransaction,
        Description = payment.Description,
        CreatedAt = payment.CreatedAt,
        PaidAt = payment.PaidAt,
        ReceiptUrl = payment.ReceiptUrl
    };
}
