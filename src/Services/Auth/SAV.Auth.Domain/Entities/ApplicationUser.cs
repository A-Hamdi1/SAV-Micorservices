using Microsoft.AspNetCore.Identity;

namespace SAV.Auth.Domain.Entities;

public class ApplicationUser : IdentityUser
{
    public string Role { get; set; } = "Client";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public string? GoogleId { get; set; } // ID Google pour l'authentification OAuth
}
