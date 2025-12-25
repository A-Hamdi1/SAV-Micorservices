using SAV.Payments.Domain.Entities;
using System.ComponentModel.DataAnnotations;

namespace SAV.Payments.Application.Interfaces;

public interface IPaymentService
{
    Task<PaymentDto?> GetByIdAsync(int id);
    Task<PaymentDto?> GetByInterventionIdAsync(int interventionId);
    Task<IEnumerable<PaymentDto>> GetByClientIdAsync(int clientId);
    Task<IEnumerable<PaymentDto>> GetAllAsync();
    Task<StripeCheckoutSessionDto> CreateCheckoutSessionAsync(CreatePaymentDto dto);
    Task<PaymentDto> HandleStripeWebhookAsync(string json, string signature);
    Task<PaymentDto> CreateManualPaymentAsync(CreateManualPaymentDto dto);
    Task<PaymentDto> RefundPaymentAsync(int paymentId);
    Task<PaymentStatsDto> GetPaymentStatsAsync();
    Task<PaymentDto?> ConfirmPaymentFromStripeAsync(int interventionId);
}

public class PaymentDto
{
    public int Id { get; set; }
    public int InterventionId { get; set; }
    public int ClientId { get; set; }
    public decimal Montant { get; set; }
    public string Statut { get; set; } = string.Empty;
    public string Methode { get; set; } = string.Empty;
    public string? NumeroTransaction { get; set; }
    public string? Description { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? PaidAt { get; set; }
    public string? ReceiptUrl { get; set; }
}

public class CreatePaymentDto
{
    [Required(ErrorMessage = "L'ID de l'intervention est requis")]
    [Range(1, int.MaxValue, ErrorMessage = "L'ID de l'intervention doit être positif")]
    public int InterventionId { get; set; }
    
    [Required(ErrorMessage = "L'ID du client est requis")]
    [Range(1, int.MaxValue, ErrorMessage = "L'ID du client doit être positif")]
    public int ClientId { get; set; }
    
    [Required(ErrorMessage = "Le montant est requis")]
    [Range(0.01, double.MaxValue, ErrorMessage = "Le montant doit être positif")]
    public decimal Montant { get; set; }
    
    [MaxLength(500, ErrorMessage = "La description ne peut pas dépasser 500 caractères")]
    public string? Description { get; set; }
    
    [Required(ErrorMessage = "L'URL de succès est requise")]
    [Url(ErrorMessage = "L'URL de succès doit être valide")]
    public string SuccessUrl { get; set; } = string.Empty;
    
    [Required(ErrorMessage = "L'URL d'annulation est requise")]
    [Url(ErrorMessage = "L'URL d'annulation doit être valide")]
    public string CancelUrl { get; set; } = string.Empty;
}

public class CreateManualPaymentDto
{
    [Required(ErrorMessage = "L'ID de l'intervention est requis")]
    [Range(1, int.MaxValue, ErrorMessage = "L'ID de l'intervention doit être positif")]
    public int InterventionId { get; set; }
    
    [Required(ErrorMessage = "L'ID du client est requis")]
    [Range(1, int.MaxValue, ErrorMessage = "L'ID du client doit être positif")]
    public int ClientId { get; set; }
    
    [Required(ErrorMessage = "Le montant est requis")]
    [Range(0.01, double.MaxValue, ErrorMessage = "Le montant doit être positif")]
    public decimal Montant { get; set; }
    
    [Required(ErrorMessage = "La méthode de paiement est requise")]
    public PaymentMethode Methode { get; set; }
    
    [MaxLength(500, ErrorMessage = "La description ne peut pas dépasser 500 caractères")]
    public string? Description { get; set; }
    
    [MaxLength(100, ErrorMessage = "Le numéro de transaction ne peut pas dépasser 100 caractères")]
    public string? NumeroTransaction { get; set; }
}

public class StripeCheckoutSessionDto
{
    public string SessionId { get; set; } = string.Empty;
    public string SessionUrl { get; set; } = string.Empty;
}

public class PaymentStatsDto
{
    public decimal TotalRevenue { get; set; }
    public decimal RevenueThisMonth { get; set; }
    public int TotalPayments { get; set; }
    public int PendingPayments { get; set; }
    public int SuccessfulPayments { get; set; }
    public int FailedPayments { get; set; }
}
