using Microsoft.EntityFrameworkCore;
using SAV.Notifications.Domain.Entities;
using SAV.Notifications.Domain.Interfaces;
using SAV.Notifications.Infrastructure.Data;

namespace SAV.Notifications.Infrastructure.Repositories;

public class NotificationRepository : INotificationRepository
{
    private readonly NotificationDbContext _context;

    public NotificationRepository(NotificationDbContext context)
    {
        _context = context;
    }

    public async Task<Notification?> GetByIdAsync(int id)
    {
        return await _context.Notifications.FindAsync(id);
    }

    public async Task<IEnumerable<Notification>> GetByClientIdAsync(int clientId)
    {
        return await _context.Notifications
            .Where(n => n.ClientId == clientId)
            .OrderByDescending(n => n.CreatedAt)
            .ToListAsync();
    }

    public async Task<IEnumerable<Notification>> GetPendingAsync()
    {
        return await _context.Notifications
            .Where(n => n.Statut == NotificationStatut.EnAttente && n.RetryCount < 3)
            .OrderBy(n => n.CreatedAt)
            .Take(50)
            .ToListAsync();
    }

    public async Task<IEnumerable<Notification>> GetAllAsync()
    {
        return await _context.Notifications
            .OrderByDescending(n => n.CreatedAt)
            .ToListAsync();
    }

    public async Task<Notification> CreateAsync(Notification notification)
    {
        _context.Notifications.Add(notification);
        await _context.SaveChangesAsync();
        return notification;
    }

    public async Task UpdateAsync(Notification notification)
    {
        _context.Entry(notification).State = EntityState.Modified;
        await _context.SaveChangesAsync();
    }

    public async Task DeleteAsync(int id)
    {
        var notification = await _context.Notifications.FindAsync(id);
        if (notification != null)
        {
            _context.Notifications.Remove(notification);
            await _context.SaveChangesAsync();
        }
    }
}

public class NotificationTemplateRepository : INotificationTemplateRepository
{
    private readonly NotificationDbContext _context;

    public NotificationTemplateRepository(NotificationDbContext context)
    {
        _context = context;
    }

    public async Task<NotificationTemplate?> GetByTypeAsync(NotificationType type)
    {
        return await _context.NotificationTemplates
            .FirstOrDefaultAsync(t => t.Type == type && t.IsActive);
    }

    public async Task<IEnumerable<NotificationTemplate>> GetAllAsync()
    {
        return await _context.NotificationTemplates.ToListAsync();
    }

    public async Task<NotificationTemplate> CreateAsync(NotificationTemplate template)
    {
        _context.NotificationTemplates.Add(template);
        await _context.SaveChangesAsync();
        return template;
    }

    public async Task UpdateAsync(NotificationTemplate template)
    {
        template.UpdatedAt = DateTime.UtcNow;
        _context.Entry(template).State = EntityState.Modified;
        await _context.SaveChangesAsync();
    }
}
