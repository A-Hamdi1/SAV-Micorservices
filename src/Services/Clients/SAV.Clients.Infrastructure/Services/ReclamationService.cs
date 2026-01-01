using Microsoft.EntityFrameworkCore;
using SAV.Clients.Application.Interfaces;
using SAV.Clients.Domain.Entities;
using SAV.Clients.Infrastructure.Data;
using SAV.Shared.DTOs.Clients;

namespace SAV.Clients.Infrastructure.Services;

public class ReclamationService : IReclamationService
{
    private readonly ClientsDbContext _context;
    private readonly IArticlesApiClient _articlesApiClient;

    public ReclamationService(ClientsDbContext context, IArticlesApiClient articlesApiClient)
    {
        _context = context;
        _articlesApiClient = articlesApiClient;
    }

    public async Task<ReclamationDto?> CreateReclamationAsync(string userId, CreateReclamationDto dto)
    {
        var client = await _context.Clients
            .Include(c => c.ArticlesAchetes)
            .Include(c => c.Reclamations)
            .FirstOrDefaultAsync(c => c.UserId == userId);

        if (client == null)
            return null;

        var articleAchat = client.ArticlesAchetes.FirstOrDefault(a => a.Id == dto.ArticleAchatId);
        if (articleAchat == null)
            return null;

        // Validation métier : Vérifier qu'il n'y a pas déjà une réclamation en cours pour cet article
        var reclamationEnCours = client.Reclamations
            .Any(r => r.ArticleAchatId == dto.ArticleAchatId && 
                     (r.Statut == ReclamationStatut.EnAttente || r.Statut == ReclamationStatut.EnCours));
        
        if (reclamationEnCours)
            return null;

        // Validation : La description doit avoir au moins 10 caractères
        if (string.IsNullOrWhiteSpace(dto.Description) || dto.Description.Length < 10)
            return null;

        var reclamation = new Reclamation
        {
            ClientId = client.Id,
            ArticleAchatId = dto.ArticleAchatId,
            Description = dto.Description,
            Statut = ReclamationStatut.EnAttente
        };

        _context.Reclamations.Add(reclamation);
        await _context.SaveChangesAsync();

        var articleInfo = await _articlesApiClient.GetArticleByIdAsync(articleAchat.ArticleId);

        return new ReclamationDto
        {
            Id = reclamation.Id,
            ClientId = reclamation.ClientId,
            ClientNom = client.Nom,
            ClientPrenom = client.Prenom,
            ArticleAchatId = reclamation.ArticleAchatId,
            ArticleNom = articleInfo?.Nom ?? "Article introuvable",
            Description = reclamation.Description,
            Statut = reclamation.Statut.ToString(),
            DateCreation = reclamation.DateCreation,
            DateResolution = reclamation.DateResolution,
            CommentaireResponsable = reclamation.CommentaireResponsable
        };
    }

    public async Task<List<ReclamationDto>> GetClientReclamationsAsync(string userId)
    {
        var client = await _context.Clients
            .Include(c => c.Reclamations.OrderByDescending(r => r.DateCreation))
                .ThenInclude(r => r.ArticleAchat)
            .FirstOrDefaultAsync(c => c.UserId == userId);

        if (client == null)
            return new List<ReclamationDto>();

        var reclamations = new List<ReclamationDto>();

        foreach (var reclamation in client.Reclamations)
        {
            var articleInfo = await _articlesApiClient.GetArticleByIdAsync(reclamation.ArticleAchat!.ArticleId);
            
            reclamations.Add(new ReclamationDto
            {
                Id = reclamation.Id,
                ClientId = reclamation.ClientId,
                ClientNom = client.Nom,
                ClientPrenom = client.Prenom,
                ArticleAchatId = reclamation.ArticleAchatId,
                ArticleNom = articleInfo?.Nom ?? "Article introuvable",
                Description = reclamation.Description,
                Statut = reclamation.Statut.ToString(),
                DateCreation = reclamation.DateCreation,
                DateResolution = reclamation.DateResolution,
                CommentaireResponsable = reclamation.CommentaireResponsable
            });
        }

        return reclamations;
    }

    public async Task<ReclamationListDto> GetAllReclamationsAsync(int page, int pageSize, string? statut = null)
    {
        var query = _context.Reclamations
            .Include(r => r.Client)
            .Include(r => r.ArticleAchat)
            .AsQueryable();

        if (!string.IsNullOrEmpty(statut) && Enum.TryParse<ReclamationStatut>(statut, out var statutEnum))
        {
            query = query.Where(r => r.Statut == statutEnum);
        }

        var totalCount = await query.CountAsync();
        var reclamations = await query
            .OrderByDescending(r => r.DateCreation)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var items = new List<ReclamationDto>();

        foreach (var reclamation in reclamations)
        {
            var articleInfo = await _articlesApiClient.GetArticleByIdAsync(reclamation.ArticleAchat!.ArticleId);
            
            items.Add(new ReclamationDto
            {
                Id = reclamation.Id,
                ClientId = reclamation.ClientId,
                ClientNom = reclamation.Client!.Nom,
                ClientPrenom = reclamation.Client.Prenom,
                ArticleAchatId = reclamation.ArticleAchatId,
                ArticleNom = articleInfo?.Nom ?? "Article introuvable",
                Description = reclamation.Description,
                Statut = reclamation.Statut.ToString(),
                DateCreation = reclamation.DateCreation,
                DateResolution = reclamation.DateResolution,
                CommentaireResponsable = reclamation.CommentaireResponsable
            });
        }

        return new ReclamationListDto
        {
            Items = items,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<ReclamationDto?> GetReclamationByIdAsync(int id)
    {
        var reclamation = await _context.Reclamations
            .Include(r => r.Client)
            .Include(r => r.ArticleAchat)
            .FirstOrDefaultAsync(r => r.Id == id);

        if (reclamation == null)
            return null;

        var articleInfo = await _articlesApiClient.GetArticleByIdAsync(reclamation.ArticleAchat!.ArticleId);

        return new ReclamationDto
        {
            Id = reclamation.Id,
            ClientId = reclamation.ClientId,
            ClientNom = reclamation.Client!.Nom,
            ClientPrenom = reclamation.Client.Prenom,
            ArticleAchatId = reclamation.ArticleAchatId,
            ArticleNom = articleInfo?.Nom ?? "Article introuvable",
            Description = reclamation.Description,
            Statut = reclamation.Statut.ToString(),
            DateCreation = reclamation.DateCreation,
            DateResolution = reclamation.DateResolution,
            CommentaireResponsable = reclamation.CommentaireResponsable
        };
    }

    public async Task<ReclamationDto?> UpdateReclamationStatutAsync(int id, UpdateReclamationStatutDto dto)
    {
        var reclamation = await _context.Reclamations
            .Include(r => r.Client)
            .Include(r => r.ArticleAchat)
            .FirstOrDefaultAsync(r => r.Id == id);

        if (reclamation == null)
            return null;

        if (Enum.TryParse<ReclamationStatut>(dto.Statut, out var newStatut))
        {
            reclamation.Statut = newStatut;
            reclamation.CommentaireResponsable = dto.CommentaireResponsable;
            
            if (newStatut == ReclamationStatut.Resolue || newStatut == ReclamationStatut.Rejetee)
            {
                reclamation.DateResolution = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();
        }

        var articleInfo = await _articlesApiClient.GetArticleByIdAsync(reclamation.ArticleAchat!.ArticleId);

        return new ReclamationDto
        {
            Id = reclamation.Id,
            ClientId = reclamation.ClientId,
            ClientNom = reclamation.Client!.Nom,
            ClientPrenom = reclamation.Client.Prenom,
            ArticleAchatId = reclamation.ArticleAchatId,
            ArticleNom = articleInfo?.Nom ?? "Article introuvable",
            Description = reclamation.Description,
            Statut = reclamation.Statut.ToString(),
            DateCreation = reclamation.DateCreation,
            DateResolution = reclamation.DateResolution,
            CommentaireResponsable = reclamation.CommentaireResponsable
        };
    }

    public async Task<List<ReclamationDto>> GetReclamationsByClientIdAsync(int clientId)
    {
        var reclamations = await _context.Reclamations
            .Include(r => r.Client)
            .Include(r => r.ArticleAchat)
            .Where(r => r.ClientId == clientId)
            .OrderByDescending(r => r.DateCreation)
            .ToListAsync();

        var result = new List<ReclamationDto>();

        foreach (var reclamation in reclamations)
        {
            var articleInfo = await _articlesApiClient.GetArticleByIdAsync(reclamation.ArticleAchat!.ArticleId);
            
            result.Add(new ReclamationDto
            {
                Id = reclamation.Id,
                ClientId = reclamation.ClientId,
                ClientNom = reclamation.Client!.Nom,
                ClientPrenom = reclamation.Client.Prenom,
                ArticleAchatId = reclamation.ArticleAchatId,
                ArticleNom = articleInfo?.Nom ?? "Article introuvable",
                Description = reclamation.Description,
                Statut = reclamation.Statut.ToString(),
                DateCreation = reclamation.DateCreation,
                DateResolution = reclamation.DateResolution,
                CommentaireResponsable = reclamation.CommentaireResponsable
            });
        }

        return result;
    }

    public async Task<bool> DeleteReclamationAsync(int id)
    {
        var reclamation = await _context.Reclamations.FindAsync(id);

        if (reclamation == null)
            return false;

        // Ne peut supprimer que si le statut est En Attente
        if (reclamation.Statut != ReclamationStatut.EnAttente)
            return false;

        _context.Reclamations.Remove(reclamation);
        await _context.SaveChangesAsync();

        return true;
    }

    public async Task<ClientDto?> GetClientByUserIdAsync(string userId)
    {
        var client = await _context.Clients.FirstOrDefaultAsync(c => c.UserId == userId);
        
        if (client == null)
            return null;

        return new ClientDto
        {
            Id = client.Id,
            UserId = client.UserId,
            Nom = client.Nom,
            Prenom = client.Prenom,
            Telephone = client.Telephone,
            Adresse = client.Adresse,
            CreatedAt = client.CreatedAt
        };
    }
}
