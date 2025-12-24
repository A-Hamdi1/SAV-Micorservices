namespace SAV.Interventions.Domain.Entities;

public class Evaluation
{
    public int Id { get; set; }
    public int InterventionId { get; set; }
    public Intervention Intervention { get; set; } = null!;
    public int ClientId { get; set; }
    public int Note { get; set; } // 1-5 étoiles
    public string? Commentaire { get; set; }
    public bool RecommandeTechnicien { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
