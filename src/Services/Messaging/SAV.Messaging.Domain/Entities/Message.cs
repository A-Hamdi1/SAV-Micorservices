namespace SAV.Messaging.Domain.Entities;

/// <summary>
/// Représente un message dans une conversation
/// </summary>
public class Message
{
    public int Id { get; set; }
    
    /// <summary>
    /// ID de la conversation
    /// </summary>
    public int ConversationId { get; set; }
    
    /// <summary>
    /// UserId de l'expéditeur
    /// </summary>
    public string ExpediteurUserId { get; set; } = string.Empty;
    
    /// <summary>
    /// Nom de l'expéditeur pour l'affichage
    /// </summary>
    public string ExpediteurNom { get; set; } = string.Empty;
    
    /// <summary>
    /// Contenu du message
    /// </summary>
    public string Contenu { get; set; } = string.Empty;
    
    /// <summary>
    /// Date d'envoi du message
    /// </summary>
    public DateTime DateEnvoi { get; set; } = DateTime.UtcNow;
    
    /// <summary>
    /// Le message a-t-il été lu par le destinataire?
    /// </summary>
    public bool EstLu { get; set; } = false;
    
    /// <summary>
    /// Date de lecture du message
    /// </summary>
    public DateTime? DateLecture { get; set; }
    
    /// <summary>
    /// Type de message
    /// </summary>
    public MessageType Type { get; set; } = MessageType.Texte;
    
    /// <summary>
    /// URL de la pièce jointe (si applicable)
    /// </summary>
    public string? PieceJointeUrl { get; set; }
    
    /// <summary>
    /// Nom de la pièce jointe (si applicable)
    /// </summary>
    public string? PieceJointeNom { get; set; }
    
    /// <summary>
    /// Navigation vers la conversation
    /// </summary>
    public virtual Conversation? Conversation { get; set; }
}

/// <summary>
/// Type de message
/// </summary>
public enum MessageType
{
    Texte = 0,
    Image = 1,
    Document = 2,
    Systeme = 3
}
