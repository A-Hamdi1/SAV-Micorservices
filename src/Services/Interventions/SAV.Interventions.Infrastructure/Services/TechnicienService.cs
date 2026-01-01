using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using SAV.Interventions.Application.Interfaces;
using SAV.Interventions.Domain.Entities;
using SAV.Interventions.Infrastructure.Data;
using SAV.Shared.DTOs.Interventions;
using System.Globalization;

namespace SAV.Interventions.Infrastructure.Services;

public class TechnicienService : ITechnicienService
{
    private readonly InterventionsDbContext _context;
    private readonly IClientsApiClient _clientsApiClient;
    private readonly ILogger<TechnicienService> _logger;

    public TechnicienService(
        InterventionsDbContext context, 
        IClientsApiClient clientsApiClient,
        ILogger<TechnicienService> logger)
    {
        _context = context;
        _clientsApiClient = clientsApiClient;
        _logger = logger;
    }

    public async Task<List<TechnicienDto>> GetAllTechniciensAsync(bool? disponible = null)
    {
        var query = _context.Techniciens
            .Include(t => t.Interventions)
            .AsQueryable();

        if (disponible.HasValue)
        {
            query = query.Where(t => t.EstDisponible == disponible.Value);
        }

        var techniciens = await query
            .OrderBy(t => t.Nom)
            .ThenBy(t => t.Prenom)
            .ToListAsync();

        return techniciens.Select(t => MapToDto(t)).ToList();
    }

    public async Task<TechnicienDetailsDto?> GetTechnicienByIdAsync(int id)
    {
        var technicien = await _context.Techniciens
            .Include(t => t.Interventions)
                .ThenInclude(i => i.PiecesUtilisees)
            .FirstOrDefaultAsync(t => t.Id == id);

        if (technicien == null)
            return null;

        var interventions = technicien.Interventions
            .Select(i => MapInterventionToDto(i))
            .OrderByDescending(i => i.DateIntervention)
            .ToList();

        var stats = await CalculerStatsAsync(technicien);

        return new TechnicienDetailsDto
        {
            Id = technicien.Id,
            Nom = technicien.Nom,
            Prenom = technicien.Prenom,
            NomComplet = technicien.NomComplet,
            Email = technicien.Email,
            Telephone = technicien.Telephone,
            Specialite = technicien.Specialite,
            EstDisponible = technicien.EstDisponible,
            DateEmbauche = technicien.DateEmbauche,
            CreatedAt = technicien.CreatedAt,
            Interventions = interventions,
            Stats = stats
        };
    }

    public async Task<List<TechnicienDto>> GetTechniciensBySpecialiteAsync(string specialite)
    {
        var techniciens = await _context.Techniciens
            .Include(t => t.Interventions)
            .Where(t => t.Specialite.ToLower().Contains(specialite.ToLower()))
            .OrderBy(t => t.Nom)
            .ThenBy(t => t.Prenom)
            .ToListAsync();

        return techniciens.Select(t => MapToDto(t)).ToList();
    }

    public async Task<List<TechnicienDto>> GetTechniciensDisponiblesAsync()
    {
        var techniciens = await _context.Techniciens
            .Include(t => t.Interventions)
            .Where(t => t.EstDisponible)
            .OrderBy(t => t.Nom)
            .ThenBy(t => t.Prenom)
            .ToListAsync();

        return techniciens.Select(t => MapToDto(t)).ToList();
    }

    public async Task<TechnicienDetailsDto?> GetTechnicienByUserIdAsync(string userId)
    {
        var technicien = await _context.Techniciens
            .Include(t => t.Interventions)
                .ThenInclude(i => i.PiecesUtilisees)
            .FirstOrDefaultAsync(t => t.UserId == userId);

        if (technicien == null)
            return null;

        var interventions = technicien.Interventions
            .Select(i => MapInterventionToDto(i))
            .OrderByDescending(i => i.DateIntervention)
            .ToList();

        var stats = await CalculerStatsAsync(technicien);

        return new TechnicienDetailsDto
        {
            Id = technicien.Id,
            UserId = technicien.UserId,
            Nom = technicien.Nom,
            Prenom = technicien.Prenom,
            NomComplet = technicien.NomComplet,
            Email = technicien.Email,
            Telephone = technicien.Telephone,
            Specialite = technicien.Specialite,
            EstDisponible = technicien.EstDisponible,
            DateEmbauche = technicien.DateEmbauche,
            CreatedAt = technicien.CreatedAt,
            Interventions = interventions,
            Stats = stats
        };
    }

    public async Task<TechnicienDto?> CreateTechnicienAsync(CreateTechnicienDto dto, string? userId = null)
    {
        // Vérifier si l'email existe déjà
        var emailExists = await _context.Techniciens
            .AnyAsync(t => t.Email.ToLower() == dto.Email.ToLower());

        if (emailExists)
        {
            _logger.LogWarning("Tentative de création d'un technicien avec un email existant: {Email}", dto.Email);
            return null;
        }

        var technicien = new Technicien
        {
            UserId = userId,
            Nom = dto.Nom,
            Prenom = dto.Prenom,
            Email = dto.Email,
            Telephone = dto.Telephone,
            Specialite = dto.Specialite,
            DateEmbauche = dto.DateEmbauche ?? DateTime.UtcNow,
            EstDisponible = true,
            CreatedAt = DateTime.UtcNow
        };

        _context.Techniciens.Add(technicien);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Technicien créé: {TechnicienId} - {NomComplet}", technicien.Id, technicien.NomComplet);

        return MapToDto(technicien);
    }

    public async Task<TechnicienDto?> UpdateTechnicienAsync(int id, UpdateTechnicienDto dto)
    {
        var technicien = await _context.Techniciens
            .Include(t => t.Interventions)
            .FirstOrDefaultAsync(t => t.Id == id);

        if (technicien == null)
            return null;

        // Vérifier si le nouvel email existe déjà pour un autre technicien
        if (technicien.Email != dto.Email)
        {
            var emailExists = await _context.Techniciens
                .AnyAsync(t => t.Id != id && t.Email.ToLower() == dto.Email.ToLower());

            if (emailExists)
            {
                _logger.LogWarning("Tentative de modification avec un email existant: {Email}", dto.Email);
                return null;
            }
        }

        technicien.Nom = dto.Nom;
        technicien.Prenom = dto.Prenom;
        technicien.Email = dto.Email;
        technicien.Telephone = dto.Telephone;
        technicien.Specialite = dto.Specialite;
        technicien.EstDisponible = dto.EstDisponible;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Technicien mis à jour: {TechnicienId}", id);

        return MapToDto(technicien);
    }

    public async Task<TechnicienDto?> UpdateDisponibiliteAsync(int id, bool estDisponible)
    {
        var technicien = await _context.Techniciens
            .Include(t => t.Interventions)
            .FirstOrDefaultAsync(t => t.Id == id);

        if (technicien == null)
            return null;

        technicien.EstDisponible = estDisponible;
        await _context.SaveChangesAsync();

        _logger.LogInformation("Disponibilité du technicien {TechnicienId} mise à jour: {Disponible}", id, estDisponible);

        return MapToDto(technicien);
    }

    public async Task<bool> DeleteTechnicienAsync(int id)
    {
        var technicien = await _context.Techniciens
            .Include(t => t.Interventions)
            .FirstOrDefaultAsync(t => t.Id == id);

        if (technicien == null)
            return false;

        // Vérifier s'il a des interventions actives (Planifiée ou EnCours)
        var hasActiveInterventions = technicien.Interventions.Any(i => 
            i.Statut == InterventionStatut.Planifiee || 
            i.Statut == InterventionStatut.EnCours);

        if (hasActiveInterventions)
        {
            _logger.LogWarning("Impossible de supprimer le technicien {TechnicienId}: interventions actives", id);
            return false;
        }

        _context.Techniciens.Remove(technicien);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Technicien supprimé: {TechnicienId}", id);

        return true;
    }

    public async Task<List<InterventionDto>> GetTechnicienInterventionsAsync(
        int technicienId, 
        string? statut = null, 
        DateTime? dateDebut = null, 
        DateTime? dateFin = null)
    {
        var query = _context.Interventions
            .Include(i => i.PiecesUtilisees)
            .Where(i => i.TechnicienId == technicienId)
            .AsQueryable();

        if (!string.IsNullOrEmpty(statut) && Enum.TryParse<InterventionStatut>(statut, out var statutEnum))
        {
            query = query.Where(i => i.Statut == statutEnum);
        }

        if (dateDebut.HasValue)
        {
            query = query.Where(i => i.DateIntervention >= dateDebut.Value);
        }

        if (dateFin.HasValue)
        {
            query = query.Where(i => i.DateIntervention <= dateFin.Value);
        }

        var interventions = await query
            .OrderByDescending(i => i.DateIntervention)
            .ToListAsync();

        return interventions.Select(i => MapInterventionToDto(i)).ToList();
    }

    public async Task<TechnicienStatsDto> GetTechnicienStatsAsync(int technicienId)
    {
        var technicien = await _context.Techniciens
            .Include(t => t.Interventions)
                .ThenInclude(i => i.PiecesUtilisees)
            .FirstOrDefaultAsync(t => t.Id == technicienId);

        if (technicien == null)
        {
            return new TechnicienStatsDto();
        }

        return await CalculerStatsAsync(technicien);
    }

    public async Task<TechniciensStatsGlobalesDto> GetTechniciensStatsGlobalesAsync()
    {
        var techniciens = await _context.Techniciens
            .Include(t => t.Interventions)
                .ThenInclude(i => i.PiecesUtilisees)
            .ToListAsync();

        var nombreTotal = techniciens.Count;
        var nombreDisponibles = techniciens.Count(t => t.EstDisponible);
        var nombreInterventionsTotal = techniciens.Sum(t => t.Interventions.Count);
        var chiffreAffaireTotal = techniciens.Sum(t => 
            t.Interventions.Sum(i => i.MontantTotal));

        var tauxReussiteMoyen = 0m;
        if (nombreTotal > 0)
        {
            var tauxReussites = new List<decimal>();
            foreach (var tech in techniciens)
            {
                var stats = await CalculerStatsAsync(tech);
                if (stats.NombreInterventionsTotal > 0)
                {
                    tauxReussites.Add(stats.TauxReussite);
                }
            }
            tauxReussiteMoyen = tauxReussites.Any() ? tauxReussites.Average() : 0;
        }

        // Top 10 techniciens
        var topTechniciens = new List<TechnicienStatsSummaryDto>();
        foreach (var tech in techniciens.OrderByDescending(t => t.Interventions.Sum(i => i.MontantTotal)).Take(10))
        {
            var stats = await CalculerStatsAsync(tech);
            topTechniciens.Add(new TechnicienStatsSummaryDto
            {
                Id = tech.Id,
                NomComplet = tech.NomComplet,
                NombreInterventions = stats.NombreInterventionsTotal,
                ChiffreAffaire = stats.ChiffreAffaireTotal,
                TauxReussite = stats.TauxReussite
            });
        }

        return new TechniciensStatsGlobalesDto
        {
            NombreTechniciensTotal = nombreTotal,
            NombreTechniciensDisponibles = nombreDisponibles,
            NombreInterventionsTotal = nombreInterventionsTotal,
            ChiffreAffaireTotal = chiffreAffaireTotal,
            TauxReussiteMoyen = tauxReussiteMoyen,
            TopTechniciens = topTechniciens
        };
    }

    private TechnicienDto MapToDto(Technicien technicien)
    {
        return new TechnicienDto
        {
            Id = technicien.Id,
            UserId = technicien.UserId,
            Nom = technicien.Nom,
            Prenom = technicien.Prenom,
            NomComplet = technicien.NomComplet,
            Email = technicien.Email,
            Telephone = technicien.Telephone,
            Specialite = technicien.Specialite,
            EstDisponible = technicien.EstDisponible,
            DateEmbauche = technicien.DateEmbauche,
            CreatedAt = technicien.CreatedAt,
            NombreInterventions = technicien.Interventions?.Count ?? 0
        };
    }

    private InterventionDto MapInterventionToDto(Intervention intervention)
    {
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
            PiecesUtilisees = intervention.PiecesUtilisees.Select(p => new PieceUtiliseeDto
            {
                Id = p.Id,
                InterventionId = p.InterventionId,
                PieceDetacheeId = p.PieceDetacheeId,
                PieceNom = "",
                PieceReference = "",
                Quantite = p.Quantite,
                PrixUnitaire = p.PrixUnitaire,
                SousTotal = p.SousTotal
            }).ToList()
        };
    }

    private async Task<TechnicienStatsDto> CalculerStatsAsync(Technicien technicien)
    {
        var interventions = technicien.Interventions ?? new List<Intervention>();
        var nombreTotal = interventions.Count;
        var nombreTerminees = interventions.Count(i => i.Statut == InterventionStatut.Terminee);
        var nombreEnCours = interventions.Count(i => i.Statut == InterventionStatut.EnCours);

        var tauxReussite = nombreTotal > 0 
            ? Math.Round((decimal)nombreTerminees / nombreTotal * 100, 2) 
            : 0;

        var chiffreAffaireTotal = interventions
            .Where(i => i.Statut == InterventionStatut.Terminee)
            .Sum(i => i.MontantTotal);

        var chiffreAffaireMoyen = nombreTerminees > 0 
            ? Math.Round(chiffreAffaireTotal / nombreTerminees, 2) 
            : 0;

        return new TechnicienStatsDto
        {
            NombreInterventionsTotal = nombreTotal,
            NombreInterventionsTerminees = nombreTerminees,
            NombreInterventionsEnCours = nombreEnCours,
            TauxReussite = tauxReussite,
            ChiffreAffaireTotal = chiffreAffaireTotal,
            ChiffreAffaireMoyen = chiffreAffaireMoyen
        };
    }

    public async Task<InterventionDto?> UpdateInterventionStatutByTechnicienAsync(
        int interventionId, 
        int technicienId, 
        string statut, 
        string? commentaire = null)
    {
        var intervention = await _context.Interventions
            .Include(i => i.PiecesUtilisees)
            .Include(i => i.Technicien)
            .FirstOrDefaultAsync(i => i.Id == interventionId && i.TechnicienId == technicienId);

        if (intervention == null)
        {
            _logger.LogWarning("Intervention {InterventionId} non trouvée ou n'appartient pas au technicien {TechnicienId}", 
                interventionId, technicienId);
            return null;
        }

        // Technicien ne peut que passer de Planifiee -> EnCours -> Terminee
        if (Enum.TryParse<InterventionStatut>(statut, out var newStatut))
        {
            // Vérifier la logique de transition
            var currentStatut = intervention.Statut;
            
            // Transitions valides pour technicien
            bool isValidTransition = 
                (currentStatut == InterventionStatut.Planifiee && newStatut == InterventionStatut.EnCours) ||
                (currentStatut == InterventionStatut.EnCours && newStatut == InterventionStatut.Terminee);

            if (!isValidTransition)
            {
                _logger.LogWarning("Transition invalide de {CurrentStatut} vers {NewStatut} pour technicien", 
                    currentStatut, newStatut);
                return null;
            }

            intervention.Statut = newStatut;
            
            if (!string.IsNullOrEmpty(commentaire))
            {
                intervention.Commentaire = commentaire;
            }

            // Si l'intervention est terminée, libérer le technicien et mettre à jour la réclamation
            if (newStatut == InterventionStatut.Terminee)
            {
                var technicien = await _context.Techniciens.FindAsync(technicienId);
                if (technicien != null)
                {
                    technicien.EstDisponible = true;
                    _logger.LogInformation("Technicien {TechnicienId} libéré après intervention terminée", technicienId);
                }
            }

            await _context.SaveChangesAsync();

            // Synchroniser automatiquement le statut de la réclamation
            if (newStatut == InterventionStatut.Terminee)
            {
                try
                {
                    var updated = await _clientsApiClient.UpdateReclamationStatutAsync(intervention.ReclamationId, "Resolue");
                    if (updated)
                    {
                        _logger.LogInformation("Réclamation {ReclamationId} statut mis à jour automatiquement vers Resolue par technicien", 
                            intervention.ReclamationId);
                    }
                    else
                    {
                        _logger.LogWarning("Échec de la mise à jour automatique du statut de la réclamation {ReclamationId}", 
                            intervention.ReclamationId);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Erreur lors de la mise à jour du statut de la réclamation {ReclamationId}", 
                        intervention.ReclamationId);
                }
            }

            _logger.LogInformation("Statut de l'intervention {InterventionId} mis à jour par technicien {TechnicienId}: {Statut}", 
                interventionId, technicienId, statut);
        }

        return MapInterventionToDto(intervention);
    }
}
