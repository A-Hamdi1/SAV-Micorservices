namespace SAV.Payments.Domain.Entities;

public class Payment
{
    public int Id { get; set; }
    public int InterventionId { get; set; }
    public int ClientId { get; set; }
    public string? ClientUserId { get; set; }
    public decimal Montant { get; set; }
    public string? StripePaymentIntentId { get; set; }
    public string? StripeSessionId { get; set; }
    public PaymentStatut Statut { get; set; } = PaymentStatut.EnAttente;
    public PaymentMethode Methode { get; set; } = PaymentMethode.Carte;
    public string? NumeroTransaction { get; set; }
    public string? Description { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? PaidAt { get; set; }
    public string? ReceiptUrl { get; set; }
}

public enum PaymentStatut
{
    EnAttente,
    EnCours,
    Reussi,
    Echoue,
    Rembourse,
    Annule
}

public enum PaymentMethode
{
    Carte,
    Virement,
    Especes,
    Cheque
}
