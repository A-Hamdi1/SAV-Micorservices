namespace SAV.Shared.DTOs.Notifications;

public class NotificationDto
{
    public int Id { get; set; }
    public string UserId { get; set; } = string.Empty;
    public string Titre { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public bool EstLue { get; set; }
    public string? LienAction { get; set; }
    public int? ReferenceId { get; set; }
    public DateTime DateCreation { get; set; }
    public DateTime? DateLecture { get; set; }
}

public class CreateNotificationDto
{
    public string UserId { get; set; } = string.Empty;
    public string Titre { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public string? LienAction { get; set; }
    public int? ReferenceId { get; set; }
}

public class NotificationCountDto
{
    public int Total { get; set; }
    public int NonLues { get; set; }
}
