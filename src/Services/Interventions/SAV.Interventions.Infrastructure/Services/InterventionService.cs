using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using SAV.Interventions.Application.Interfaces;
using SAV.Interventions.Domain.Entities;
using SAV.Interventions.Infrastructure.Data;
using SAV.Shared.DTOs.Interventions;

namespace SAV.Interventions.Infrastructure.Services;

public class InterventionService : IInterventionService
{
    private readonly InterventionsDbContext _context;
    private readonly IClientsApiClient _clientsApiClient;
    private readonly IArticlesApiClient _articlesApiClient;
    private readonly ILogger<InterventionService> _logger;

    public InterventionService(
        InterventionsDbContext context,
        IClientsApiClient clientsApiClient,
        IArticlesApiClient articlesApiClient,
        ILogger<InterventionService> logger)
    {
        _context = context;
        _clientsApiClient = clientsApiClient;
        _articlesApiClient = articlesApiClient;
        _logger = logger;
    }

    public async Task<InterventionDto?> CreateInterventionAsync(CreateInterventionDto dto)
    {
        try
        {
            _logger.LogInformation("Attempting to create intervention for reclamation {ReclamationId}", dto.ReclamationId);
            
            var reclamation = await _clientsApiClient.GetReclamationByIdAsync(dto.ReclamationId);
            if (reclamation == null)
            {
                _logger.LogWarning("Reclamation {ReclamationId} not found", dto.ReclamationId);
                return null;
            }

            _logger.LogInformation("Found reclamation {ReclamationId}, checking warranty for article achat {ArticleAchatId}", 
                dto.ReclamationId, reclamation.ArticleAchatId);
            
            var isUnderWarranty = await _clientsApiClient.IsArticleUnderWarrantyAsync(reclamation.ArticleAchatId);
            _logger.LogInformation("Article under warranty: {IsUnderWarranty}", isUnderWarranty);

            var intervention = new Intervention
            {
                ReclamationId = dto.ReclamationId,
                TechnicienNom = dto.TechnicienNom,
                DateIntervention = dto.DateIntervention,
                MontantMainOeuvre = dto.MontantMainOeuvre,
                Commentaire = dto.Commentaire,
                EstGratuite = isUnderWarranty,
                Statut = InterventionStatut.Planifiee
            };

            _context.Interventions.Add(intervention);
            await _context.SaveChangesAsync();
            
            _logger.LogInformation("Successfully created intervention {InterventionId}", intervention.Id);

            return await MapToDto(intervention);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating intervention for reclamation {ReclamationId}", dto.ReclamationId);
            return null;
        }
    }

    public async Task<InterventionListDto> GetAllInterventionsAsync(int page, int pageSize, string? statut = null)
    {
        var query = _context.Interventions
            .Include(i => i.PiecesUtilisees)
            .AsQueryable();

        if (!string.IsNullOrEmpty(statut) && Enum.TryParse<InterventionStatut>(statut, out var statutEnum))
        {
            query = query.Where(i => i.Statut == statutEnum);
        }

        var totalCount = await query.CountAsync();
        var interventions = await query
            .OrderByDescending(i => i.DateIntervention)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var items = new List<InterventionDto>();
        foreach (var intervention in interventions)
        {
            var dto = await MapToDto(intervention);
            if (dto != null)
                items.Add(dto);
        }

        return new InterventionListDto
        {
            Items = items,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<InterventionDto?> GetInterventionByIdAsync(int id)
    {
        var intervention = await _context.Interventions
            .Include(i => i.PiecesUtilisees)
            .FirstOrDefaultAsync(i => i.Id == id);

        if (intervention == null)
            return null;

        return await MapToDto(intervention);
    }

    public async Task<Intervention?> GetInterventionEntityByIdAsync(int id)
    {
        return await _context.Interventions
            .Include(i => i.PiecesUtilisees)
            .FirstOrDefaultAsync(i => i.Id == id);
    }

    public async Task<InterventionDto?> UpdateInterventionAsync(int id, UpdateInterventionDto dto)
    {
        var intervention = await _context.Interventions
            .Include(i => i.PiecesUtilisees)
            .FirstOrDefaultAsync(i => i.Id == id);

        if (intervention == null)
            return null;

        intervention.TechnicienNom = dto.TechnicienNom;
        intervention.DateIntervention = dto.DateIntervention;
        intervention.MontantMainOeuvre = dto.MontantMainOeuvre;
        intervention.Commentaire = dto.Commentaire;

        await _context.SaveChangesAsync();

        return await MapToDto(intervention);
    }

    public async Task<InterventionDto?> UpdateInterventionStatutAsync(int id, UpdateInterventionStatutDto dto)
    {
        var intervention = await _context.Interventions
            .Include(i => i.PiecesUtilisees)
            .FirstOrDefaultAsync(i => i.Id == id);

        if (intervention == null)
            return null;

        if (Enum.TryParse<InterventionStatut>(dto.Statut, out var newStatut))
        {
            intervention.Statut = newStatut;
            await _context.SaveChangesAsync();
        }

        return await MapToDto(intervention);
    }

    public async Task<List<InterventionDto>> GetInterventionsByReclamationIdAsync(int reclamationId)
    {
        var interventions = await _context.Interventions
            .Include(i => i.PiecesUtilisees)
            .Where(i => i.ReclamationId == reclamationId)
            .ToListAsync();

        var dtos = new List<InterventionDto>();
        foreach (var intervention in interventions)
        {
            var dto = await MapToDto(intervention);
            if (dto != null)
                dtos.Add(dto);
        }

        return dtos;
    }

    public async Task<PieceUtiliseeDto?> AddPieceUtiliseeAsync(int interventionId, AddPieceUtiliseeDto dto)
    {
        try
        {
            _logger.LogInformation("Adding piece {PieceDetacheeId} to intervention {InterventionId}", 
                dto.PieceDetacheeId, interventionId);
            
            var intervention = await _context.Interventions
                .Include(i => i.PiecesUtilisees)
                .FirstOrDefaultAsync(i => i.Id == interventionId);

            if (intervention == null)
            {
                _logger.LogWarning("Intervention {InterventionId} not found", interventionId);
                return null;
            }

            _logger.LogInformation("Fetching piece detachee {PieceDetacheeId} from Articles API", dto.PieceDetacheeId);
            
            var pieceInfo = await _articlesApiClient.GetPieceDetacheeByIdAsync(dto.PieceDetacheeId);
            if (pieceInfo == null)
            {
                _logger.LogWarning("Piece detachee {PieceDetacheeId} not found in Articles API", dto.PieceDetacheeId);
                return null;
            }

            var pieceUtilisee = new PieceUtilisee
            {
                InterventionId = interventionId,
                PieceDetacheeId = dto.PieceDetacheeId,
                Quantite = dto.Quantite,
                PrixUnitaire = pieceInfo.Prix
            };

            _context.PiecesUtilisees.Add(pieceUtilisee);
            await _context.SaveChangesAsync();
            
            _logger.LogInformation("Successfully added piece {PieceUtiliseeId} to intervention {InterventionId}", 
                pieceUtilisee.Id, interventionId);

            return new PieceUtiliseeDto
            {
                Id = pieceUtilisee.Id,
                InterventionId = pieceUtilisee.InterventionId,
                PieceDetacheeId = pieceUtilisee.PieceDetacheeId,
                PieceNom = pieceInfo.Nom,
                PieceReference = pieceInfo.Reference,
                Quantite = pieceUtilisee.Quantite,
                PrixUnitaire = pieceUtilisee.PrixUnitaire,
                SousTotal = pieceUtilisee.SousTotal
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error adding piece {PieceDetacheeId} to intervention {InterventionId}", 
                dto.PieceDetacheeId, interventionId);
            return null;
        }
    }

    private async Task<InterventionDto?> MapToDto(Intervention intervention)
    {
        var pieces = new List<PieceUtiliseeDto>();

        foreach (var piece in intervention.PiecesUtilisees)
        {
            var pieceInfo = await _articlesApiClient.GetPieceDetacheeByIdAsync(piece.PieceDetacheeId);
            
            pieces.Add(new PieceUtiliseeDto
            {
                Id = piece.Id,
                InterventionId = piece.InterventionId,
                PieceDetacheeId = piece.PieceDetacheeId,
                PieceNom = pieceInfo?.Nom ?? "Pièce introuvable",
                PieceReference = pieceInfo?.Reference ?? "",
                Quantite = piece.Quantite,
                PrixUnitaire = piece.PrixUnitaire,
                SousTotal = piece.SousTotal
            });
        }

        return new InterventionDto
        {
            Id = intervention.Id,
            ReclamationId = intervention.ReclamationId,
            TechnicienNom = intervention.Technicien?.NomComplet ?? intervention.TechnicienNom,
            DateIntervention = intervention.DateIntervention,
            Statut = intervention.Statut.ToString(),
            EstGratuite = intervention.EstGratuite,
            MontantMainOeuvre = intervention.MontantMainOeuvre,
            MontantTotal = intervention.MontantTotal,
            Commentaire = intervention.Commentaire,
            CreatedAt = intervention.CreatedAt,
            PiecesUtilisees = pieces
        };
    }

    public async Task<List<InterventionDto>> GetInterventionsByTechnicienAsync(int technicienId)
    {
        var interventions = await _context.Interventions
            .Include(i => i.PiecesUtilisees)
            .Include(i => i.Technicien)
            .Where(i => i.TechnicienId == technicienId)
            .OrderByDescending(i => i.DateIntervention)
            .ToListAsync();

        var result = new List<InterventionDto>();
        foreach (var intervention in interventions)
        {
            var dto = await MapToDto(intervention);
            if (dto != null)
                result.Add(dto);
        }

        return result;
    }

    public async Task<List<InterventionDto>> GetInterventionsPlanifieesAsync()
    {
        var interventions = await _context.Interventions
            .Include(i => i.PiecesUtilisees)
            .Include(i => i.Technicien)
            .Where(i => i.Statut == InterventionStatut.Planifiee || i.Statut == InterventionStatut.EnCours)
            .OrderBy(i => i.DateIntervention)
            .ToListAsync();

        var result = new List<InterventionDto>();
        foreach (var intervention in interventions)
        {
            var dto = await MapToDto(intervention);
            if (dto != null)
                result.Add(dto);
        }

        return result;
    }

    public async Task<InterventionDto?> UpdateInterventionTechnicienAsync(int id, int technicienId)
    {
        var intervention = await _context.Interventions
            .Include(i => i.PiecesUtilisees)
            .Include(i => i.Technicien)
            .FirstOrDefaultAsync(i => i.Id == id);

        if (intervention == null)
            return null;

        // Vérifier que le technicien existe
        var technicien = await _context.Techniciens.FindAsync(technicienId);
        if (technicien == null)
        {
            _logger.LogWarning("Technicien {TechnicienId} not found", technicienId);
            return null;
        }

        intervention.TechnicienId = technicienId;
        intervention.TechnicienNom = technicien.NomComplet;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Technicien updated for intervention {InterventionId}: {TechnicienNom}", id, technicien.NomComplet);

        return await MapToDto(intervention);
    }

    public async Task<bool> DeleteInterventionAsync(int id)
    {
        var intervention = await _context.Interventions
            .Include(i => i.PiecesUtilisees)
            .FirstOrDefaultAsync(i => i.Id == id);

        if (intervention == null)
            return false;

        // Ne peut supprimer que si pas en cours ou terminée
        if (intervention.Statut == InterventionStatut.EnCours || intervention.Statut == InterventionStatut.Terminee)
        {
            _logger.LogWarning("Cannot delete intervention {InterventionId}: status is {Statut}", id, intervention.Statut);
            return false;
        }

        _context.Interventions.Remove(intervention);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Intervention {InterventionId} deleted", id);

        return true;
    }

    public async Task<InterventionStatsDto> GetInterventionsStatsAsync()
    {
        var interventions = await _context.Interventions
            .Include(i => i.PiecesUtilisees)
            .ToListAsync();

        var nombreTotal = interventions.Count;
        var nombrePlanifiees = interventions.Count(i => i.Statut == InterventionStatut.Planifiee);
        var nombreEnCours = interventions.Count(i => i.Statut == InterventionStatut.EnCours);
        var nombreTerminees = interventions.Count(i => i.Statut == InterventionStatut.Terminee);
        var nombreAnnulees = interventions.Count(i => i.Statut == InterventionStatut.Annulee);

        var interventionsTerminees = interventions.Where(i => i.Statut == InterventionStatut.Terminee).ToList();
        var montantTotalGenere = interventionsTerminees.Sum(i => i.MontantTotal);
        var montantMoyen = interventionsTerminees.Any() ? montantTotalGenere / interventionsTerminees.Count : 0;

        // Calcul durée moyenne (de création à date intervention)
        var dureeMoyenneJours = 0m;
        if (interventionsTerminees.Any())
        {
            var durees = interventionsTerminees.Select(i => (i.DateIntervention - i.CreatedAt).TotalDays).ToList();
            dureeMoyenneJours = (decimal)durees.Average();
        }

        // Stats par mois (6 derniers mois)
        var statsParMois = interventions
            .Where(i => i.DateIntervention >= DateTime.UtcNow.AddMonths(-6))
            .GroupBy(i => new { i.DateIntervention.Year, i.DateIntervention.Month })
            .Select(g => new InterventionStatsByMonthDto
            {
                Annee = g.Key.Year,
                Mois = g.Key.Month,
                MoisNom = new DateTime(g.Key.Year, g.Key.Month, 1).ToString("MMMM yyyy"),
                Nombre = g.Count(),
                Montant = g.Where(i => i.Statut == InterventionStatut.Terminee).Sum(i => i.MontantTotal)
            })
            .OrderBy(s => s.Annee)
            .ThenBy(s => s.Mois)
            .ToList();

        return new InterventionStatsDto
        {
            NombreTotal = nombreTotal,
            NombrePlanifiees = nombrePlanifiees,
            NombreEnCours = nombreEnCours,
            NombreTerminees = nombreTerminees,
            NombreAnnulees = nombreAnnulees,
            MontantTotalGenere = montantTotalGenere,
            MontantMoyen = montantMoyen,
            DureeMoyenneJours = Math.Round(dureeMoyenneJours, 2),
            ParMois = statsParMois
        };
    }
}
