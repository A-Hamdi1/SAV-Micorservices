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

            // Si un TechnicienId est fourni, récupérer le technicien et le marquer non disponible
            Technicien? technicien = null;
            if (dto.TechnicienId.HasValue)
            {
                technicien = await _context.Techniciens.FindAsync(dto.TechnicienId.Value);
                if (technicien == null)
                {
                    _logger.LogWarning("Technicien {TechnicienId} not found", dto.TechnicienId);
                    return null;
                }
                technicien.EstDisponible = false;
            }

            var intervention = new Intervention
            {
                ReclamationId = dto.ReclamationId,
                TechnicienId = dto.TechnicienId,
                TechnicienNom = technicien?.NomComplet ?? dto.TechnicienNom,
                DateIntervention = dto.DateIntervention,
                MontantMainOeuvre = dto.MontantMainOeuvre,
                Commentaire = dto.Commentaire,
                EstGratuite = isUnderWarranty,
                Statut = InterventionStatut.Planifiee
            };

            _context.Interventions.Add(intervention);
            await _context.SaveChangesAsync();
            
            _logger.LogInformation("Successfully created intervention {InterventionId} with technicien {TechnicienId}", 
                intervention.Id, dto.TechnicienId);

            // Mettre à jour automatiquement le statut de la réclamation vers "EnCours"
            var updated = await _clientsApiClient.UpdateReclamationStatutAsync(dto.ReclamationId, "EnCours");
            if (updated)
            {
                _logger.LogInformation("Réclamation {ReclamationId} passée en statut EnCours", dto.ReclamationId);
            }

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
            .Include(i => i.Technicien)
            .FirstOrDefaultAsync(i => i.Id == id);

        if (intervention == null)
            return null;

        if (Enum.TryParse<InterventionStatut>(dto.Statut, out var newStatut))
        {
            intervention.Statut = newStatut;
            
            // Si l'intervention est terminée ou annulée, libérer le technicien
            if ((newStatut == InterventionStatut.Terminee || newStatut == InterventionStatut.Annulee) 
                && intervention.TechnicienId.HasValue)
            {
                var technicien = await _context.Techniciens.FindAsync(intervention.TechnicienId);
                if (technicien != null)
                {
                    technicien.EstDisponible = true;
                    _logger.LogInformation("Technicien {TechnicienId} libéré après intervention {Statut}", 
                        technicien.Id, newStatut);
                }
            }
            
            await _context.SaveChangesAsync();

            // Synchroniser automatiquement le statut de la réclamation
            string? reclamationStatut = newStatut switch
            {
                InterventionStatut.Planifiee => "EnCours",
                InterventionStatut.EnCours => "EnCours",
                InterventionStatut.Terminee => "Resolue",
                InterventionStatut.Annulee => "Rejetee",
                _ => null
            };

            if (reclamationStatut != null)
            {
                var updated = await _clientsApiClient.UpdateReclamationStatutAsync(intervention.ReclamationId, reclamationStatut);
                if (updated)
                {
                    _logger.LogInformation("Réclamation {ReclamationId} statut mis à jour automatiquement vers {Statut}", 
                        intervention.ReclamationId, reclamationStatut);
                }
                else
                {
                    _logger.LogWarning("Échec de la mise à jour automatique du statut de la réclamation {ReclamationId}", 
                        intervention.ReclamationId);
                }
            }
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

            // Vérifier et réduire le stock
            if (pieceInfo.Stock < dto.Quantite)
            {
                _logger.LogWarning("Insufficient stock for piece {PieceDetacheeId}: available {Stock}, requested {Quantite}", 
                    dto.PieceDetacheeId, pieceInfo.Stock, dto.Quantite);
                return null;
            }

            var stockReduced = await _articlesApiClient.ReduceStockAsync(dto.PieceDetacheeId, dto.Quantite);
            if (!stockReduced)
            {
                _logger.LogWarning("Failed to reduce stock for piece {PieceDetacheeId}", dto.PieceDetacheeId);
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
            
            _logger.LogInformation("Successfully added piece {PieceUtiliseeId} to intervention {InterventionId} and reduced stock", 
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
        var newTechnicien = await _context.Techniciens.FindAsync(technicienId);
        if (newTechnicien == null)
        {
            _logger.LogWarning("Technicien {TechnicienId} not found", technicienId);
            return null;
        }

        // Si l'intervention avait déjà un technicien assigné, le libérer
        if (intervention.TechnicienId.HasValue && intervention.TechnicienId != technicienId)
        {
            var oldTechnicien = await _context.Techniciens.FindAsync(intervention.TechnicienId);
            if (oldTechnicien != null)
            {
                oldTechnicien.EstDisponible = true;
                _logger.LogInformation("Technicien {TechnicienId} is now available", oldTechnicien.Id);
            }
        }

        // Assigner le nouveau technicien et le marquer comme non disponible
        intervention.TechnicienId = technicienId;
        intervention.TechnicienNom = newTechnicien.NomComplet;
        newTechnicien.EstDisponible = false;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Technicien {TechnicienId} assigned to intervention {InterventionId} and marked as unavailable", 
            technicienId, id);

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

        // Libérer le technicien si assigné
        if (intervention.TechnicienId.HasValue)
        {
            var technicien = await _context.Techniciens.FindAsync(intervention.TechnicienId);
            if (technicien != null)
            {
                technicien.EstDisponible = true;
                _logger.LogInformation("Technicien {TechnicienId} libéré après suppression intervention", technicien.Id);
            }
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
        var nombreSousGarantie = interventions.Count(i => i.EstGratuite);

        var interventionsTermineesListe = interventions.Where(i => i.Statut == InterventionStatut.Terminee).ToList();
        var chiffreAffairesTotal = interventionsTermineesListe.Sum(i => i.MontantTotal);

        // Chiffre d'affaires du mois courant
        var debutMois = new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1);
        var chiffreAffairesMois = interventionsTermineesListe
            .Where(i => i.DateIntervention >= debutMois)
            .Sum(i => i.MontantTotal);

        // Taux de résolution
        var tauxResolution = nombreTotal > 0 ? (double)nombreTerminees / nombreTotal * 100 : 0;

        // Temps moyen de résolution (de création à date intervention)
        var tempsMoyenResolution = 0.0;
        if (interventionsTermineesListe.Any())
        {
            var durees = interventionsTermineesListe.Select(i => (i.DateIntervention - i.CreatedAt).TotalDays).ToList();
            tempsMoyenResolution = durees.Average();
        }

        return new InterventionStatsDto
        {
            TotalInterventions = nombreTotal,
            InterventionsPlanifiees = nombrePlanifiees,
            InterventionsEnCours = nombreEnCours,
            InterventionsTerminees = nombreTerminees,
            InterventionsAnnulees = nombreAnnulees,
            ChiffreAffairesTotal = chiffreAffairesTotal,
            ChiffreAffairesMois = chiffreAffairesMois,
            TauxResolution = Math.Round(tauxResolution, 2),
            TempsMoyenResolution = Math.Round(tempsMoyenResolution, 2),
            InterventionsSousGarantie = nombreSousGarantie
        };
    }

    public async Task<AnalyticsDto> GetAnalyticsAsync(int? annee = null)
    {
        var year = annee ?? DateTime.UtcNow.Year;
        var startOfYear = new DateTime(year, 1, 1);
        var endOfYear = new DateTime(year, 12, 31, 23, 59, 59);
        var startOfMonth = new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1);

        var interventions = await _context.Interventions
            .Include(i => i.PiecesUtilisees)
            .Include(i => i.Technicien)
            .Where(i => i.DateIntervention >= startOfYear && i.DateIntervention <= endOfYear)
            .ToListAsync();

        var evaluations = await _context.Evaluations
            .Include(e => e.Intervention)
            .Where(e => e.Intervention.DateIntervention >= startOfYear && e.Intervention.DateIntervention <= endOfYear)
            .ToListAsync();

        var total = interventions.Count;
        var terminees = interventions.Count(i => i.Statut == InterventionStatut.Terminee);
        var enCours = interventions.Count(i => i.Statut == InterventionStatut.EnCours);
        var planifiees = interventions.Count(i => i.Statut == InterventionStatut.Planifiee);
        var annulees = interventions.Count(i => i.Statut == InterventionStatut.Annulee);
        var sousGarantie = interventions.Count(i => i.EstGratuite);

        var interventionsTerminees = interventions.Where(i => i.Statut == InterventionStatut.Terminee).ToList();
        var chiffreAffairesTotal = interventionsTerminees.Sum(i => i.MontantTotal);
        var chiffreAffairesMois = interventions
            .Where(i => i.DateIntervention >= startOfMonth && i.Statut == InterventionStatut.Terminee)
            .Sum(i => i.MontantTotal);

        var tauxResolution = total > 0 ? (terminees * 100.0 / total) : 0;
        var tempsMoyenResolution = interventionsTerminees.Any()
            ? interventionsTerminees.Average(i => (i.DateIntervention - i.CreatedAt).TotalDays)
            : 0;

        // Chiffre d'affaires par mois
        var chiffreParMois = interventionsTerminees
            .GroupBy(i => new { i.DateIntervention.Year, i.DateIntervention.Month })
            .Select(g => new ChiffreAffairesMensuelDto
            {
                Annee = g.Key.Year,
                Mois = g.Key.Month,
                MoisNom = new DateTime(g.Key.Year, g.Key.Month, 1).ToString("MMMM"),
                Montant = g.Sum(i => i.MontantTotal),
                NombreInterventions = g.Count()
            })
            .OrderBy(c => c.Annee).ThenBy(c => c.Mois)
            .ToList();

        // Interventions par statut
        var parStatut = new List<InterventionsParStatutDto>
        {
            new() { Statut = "Planifiée", Nombre = planifiees, Pourcentage = total > 0 ? planifiees * 100.0 / total : 0 },
            new() { Statut = "En cours", Nombre = enCours, Pourcentage = total > 0 ? enCours * 100.0 / total : 0 },
            new() { Statut = "Terminée", Nombre = terminees, Pourcentage = total > 0 ? terminees * 100.0 / total : 0 },
            new() { Statut = "Annulée", Nombre = annulees, Pourcentage = total > 0 ? annulees * 100.0 / total : 0 }
        };

        // Top techniciens
        var topTechniciens = interventions
            .Where(i => i.TechnicienId.HasValue)
            .GroupBy(i => i.TechnicienId!.Value)
            .Select(g =>
            {
                var tech = g.First().Technicien;
                var techEvals = evaluations.Where(e => e.Intervention.TechnicienId == g.Key).ToList();
                var nombreTotal = g.Count();
                var nombreTerminees = g.Count(i => i.Statut == InterventionStatut.Terminee);
                var interventionsTermineesAvecDates = g.Where(i => i.Statut == InterventionStatut.Terminee).ToList();
                var dureeMoyenne = interventionsTermineesAvecDates.Any() 
                    ? interventionsTermineesAvecDates.Average(i => (i.DateIntervention - i.CreatedAt).TotalDays)
                    : 0;
                return new TechnicienPerformanceDto
                {
                    TechnicienId = g.Key,
                    TechnicienNom = tech != null ? $"{tech.Prenom} {tech.Nom}" : "",
                    NombreInterventions = nombreTotal,
                    InterventionsTerminees = nombreTerminees,
                    TauxReussite = nombreTotal > 0 ? (double)nombreTerminees / nombreTotal * 100 : 0,
                    DureeMoyenne = Math.Abs(dureeMoyenne),
                    NoteMoyenne = techEvals.Any() ? techEvals.Average(e => e.Note) : 0,
                    ChiffreAffaires = g.Where(i => i.Statut == InterventionStatut.Terminee).Sum(i => i.MontantTotal)
                };
            })
            .OrderByDescending(t => t.InterventionsTerminees)
            .Take(5)
            .ToList();

        // Interventions par jour (30 derniers jours)
        var last30Days = DateTime.UtcNow.AddDays(-30);
        var parJour = interventions
            .Where(i => i.DateIntervention >= last30Days)
            .GroupBy(i => i.DateIntervention.Date)
            .Select(g => new InterventionsParJourDto
            {
                Date = g.Key,
                Nombre = g.Count()
            })
            .OrderBy(p => p.Date)
            .ToList();

        return new AnalyticsDto
        {
            InterventionStats = new InterventionStatsDto
            {
                TotalInterventions = total,
                InterventionsTerminees = terminees,
                InterventionsEnCours = enCours,
                InterventionsPlanifiees = planifiees,
                InterventionsAnnulees = annulees,
                ChiffreAffairesTotal = chiffreAffairesTotal,
                ChiffreAffairesMois = chiffreAffairesMois,
                TauxResolution = Math.Round(tauxResolution, 2),
                TempsMoyenResolution = Math.Round(tempsMoyenResolution, 2),
                InterventionsSousGarantie = sousGarantie
            },
            ChiffreAffairesMensuel = chiffreParMois,
            InterventionsParStatut = parStatut,
            TopTechniciens = topTechniciens,
            TopArticlesProblemes = new List<ArticleProblemeDto>(), // Nécessiterait appel API Clients
            InterventionsParJour = parJour
        };
    }
}
