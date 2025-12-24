namespace SAV.Notifications.Domain.Entities;

public class NotificationTemplate
{
    public int Id { get; set; }
    public NotificationType Type { get; set; }
    public string Sujet { get; set; } = string.Empty;
    public string CorpsHtml { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}
