namespace SAV.Shared.DTOs.Messaging;

/// <summary>
/// DTO pour une conversation
/// </summary>
public class ConversationDto
{
    public int Id { get; set; }
    public string ParticipantUserId { get; set; } = string.Empty;
    public string ParticipantNom { get; set; } = string.Empty;
    public string ParticipantRole { get; set; } = string.Empty;
    public string ResponsableUserId { get; set; } = string.Empty;
    public string ResponsableNom { get; set; } = string.Empty;
    public string? Sujet { get; set; }
    public int? ReclamationId { get; set; }
    public int? InterventionId { get; set; }
    public DateTime DateCreation { get; set; }
    public DateTime? DernierMessageDate { get; set; }
    public string? DernierMessageApercu { get; set; }
    public bool EstArchivee { get; set; }
    public int MessagesNonLus { get; set; }
}

/// <summary>
/// DTO pour créer une conversation
/// </summary>
public class CreateConversationDto
{
    public string ParticipantUserId { get; set; } = string.Empty;
    public string ParticipantNom { get; set; } = string.Empty;
    public string ParticipantRole { get; set; } = string.Empty;
    public string ResponsableUserId { get; set; } = string.Empty;
    public string ResponsableNom { get; set; } = string.Empty;
    public string? Sujet { get; set; }
    public int? ReclamationId { get; set; }
    public int? InterventionId { get; set; }
}

/// <summary>
/// DTO pour un message
/// </summary>
public class MessageDto
{
    public int Id { get; set; }
    public int ConversationId { get; set; }
    public string ExpediteurUserId { get; set; } = string.Empty;
    public string ExpediteurNom { get; set; } = string.Empty;
    public string Contenu { get; set; } = string.Empty;
    public DateTime DateEnvoi { get; set; }
    public bool EstLu { get; set; }
    public DateTime? DateLecture { get; set; }
    public string Type { get; set; } = "Texte";
    public string? PieceJointeUrl { get; set; }
    public string? PieceJointeNom { get; set; }
    public bool EstMoi { get; set; } // Pour le frontend: indique si c'est l'utilisateur courant
}

/// <summary>
/// DTO pour envoyer un message
/// </summary>
public class SendMessageDto
{
    public int ConversationId { get; set; }
    public string ExpediteurUserId { get; set; } = string.Empty;
    public string ExpediteurNom { get; set; } = string.Empty;
    public string Contenu { get; set; } = string.Empty;
    public string Type { get; set; } = "Texte";
    public string? PieceJointeUrl { get; set; }
    public string? PieceJointeNom { get; set; }
}

/// <summary>
/// DTO pour démarrer une conversation avec le responsable
/// </summary>
public class StartConversationDto
{
    public string? Sujet { get; set; }
    public string? MessageInitial { get; set; }
    public int? ReclamationId { get; set; }
    public int? InterventionId { get; set; }
}

/// <summary>
/// DTO pour le compteur de messages non lus
/// </summary>
public class UnreadCountDto
{
    public int TotalNonLus { get; set; }
    public List<ConversationUnreadDto> ParConversation { get; set; } = new();
}

/// <summary>
/// DTO pour les messages non lus par conversation
/// </summary>
public class ConversationUnreadDto
{
    public int ConversationId { get; set; }
    public int NonLus { get; set; }
}

/// <summary>
/// DTO pour la notification de frappe
/// </summary>
public class TypingNotificationDto
{
    public int ConversationId { get; set; }
    public string UserId { get; set; } = string.Empty;
    public string UserName { get; set; } = string.Empty;
    public bool IsTyping { get; set; }
}

/// <summary>
/// DTO pour un contact disponible pour la messagerie
/// </summary>
public class ContactDto
{
    public string UserId { get; set; } = string.Empty;
    public string Nom { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public int? ConversationId { get; set; } // Null si pas encore de conversation
}
