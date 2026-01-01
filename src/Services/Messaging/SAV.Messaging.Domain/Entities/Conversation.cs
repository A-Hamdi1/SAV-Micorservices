namespace SAV.Messaging.Domain.Entities;

/// <summary>
/// Représente une conversation entre deux utilisateurs
/// Les conversations sont uniquement entre Client-Responsable ou Technicien-Responsable
/// </summary>
public class Conversation
{
    public int Id { get; set; }
    
    /// <summary>
    /// UserId du premier participant (Client ou Technicien)
    /// </summary>
    public string ParticipantUserId { get; set; } = string.Empty;
    
    /// <summary>
    /// Nom du participant pour l'affichage
    /// </summary>
    public string ParticipantNom { get; set; } = string.Empty;
    
    /// <summary>
    /// Rôle du participant (Client ou Technicien)
    /// </summary>
    public ParticipantRole ParticipantRole { get; set; }
    
    /// <summary>
    /// UserId du responsable SAV
    /// </summary>
    public string ResponsableUserId { get; set; } = string.Empty;
    
    /// <summary>
    /// Nom du responsable pour l'affichage
    /// </summary>
    public string ResponsableNom { get; set; } = string.Empty;
    
    /// <summary>
    /// Sujet/titre de la conversation (optionnel)
    /// </summary>
    public string? Sujet { get; set; }
    
    /// <summary>
    /// ID de la réclamation associée (optionnel)
    /// </summary>
    public int? ReclamationId { get; set; }
    
    /// <summary>
    /// ID de l'intervention associée (optionnel)
    /// </summary>
    public int? InterventionId { get; set; }
    
    /// <summary>
    /// Date de création de la conversation
    /// </summary>
    public DateTime DateCreation { get; set; } = DateTime.UtcNow;
    
    /// <summary>
    /// Date du dernier message
    /// </summary>
    public DateTime? DernierMessageDate { get; set; }
    
    /// <summary>
    /// Aperçu du dernier message
    /// </summary>
    public string? DernierMessageApercu { get; set; }
    
    /// <summary>
    /// La conversation est-elle archivée?
    /// </summary>
    public bool EstArchivee { get; set; } = false;
    
    /// <summary>
    /// Messages de la conversation
    /// </summary>
    public virtual ICollection<Message> Messages { get; set; } = new List<Message>();
}

/// <summary>
/// Rôle du participant (non-responsable) dans la conversation
/// </summary>
public enum ParticipantRole
{
    Client = 0,
    Technicien = 1
}
