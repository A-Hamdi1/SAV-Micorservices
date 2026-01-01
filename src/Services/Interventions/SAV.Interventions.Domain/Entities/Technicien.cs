namespace SAV.Interventions.Domain.Entities;

public class Technicien
{
    public int Id { get; set; }
    public string? UserId { get; set; } // Link to Auth User
    public string Nom { get; set; } = string.Empty;
    public string Prenom { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Telephone { get; set; } = string.Empty;
    public string Specialite { get; set; } = string.Empty;
    public bool EstDisponible { get; set; } = true;
    public DateTime DateEmbauche { get; set; } = DateTime.UtcNow;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public List<Intervention> Interventions { get; set; } = new();

    public string NomComplet => $"{Prenom} {Nom}";
}
