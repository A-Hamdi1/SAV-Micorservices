using Microsoft.EntityFrameworkCore;
using SAV.Interventions.Application.Interfaces;
using SAV.Interventions.Domain.Entities;
using SAV.Interventions.Infrastructure.Data;

namespace SAV.Interventions.Infrastructure.Services;

public class EvaluationService : IEvaluationService
{
    private readonly InterventionsDbContext _context;
    private readonly INotificationsApiClient _notificationsApiClient;

    public EvaluationService(InterventionsDbContext context, INotificationsApiClient notificationsApiClient)
    {
        _context = context;
        _notificationsApiClient = notificationsApiClient;
    }

    public async Task<EvaluationDto?> GetByIdAsync(int id)
    {
        var evaluation = await _context.Evaluations
            .Include(e => e.Intervention)
                .ThenInclude(i => i.Technicien)
            .FirstOrDefaultAsync(e => e.Id == id);
        
        return evaluation == null ? null : MapToDto(evaluation);
    }

    public async Task<EvaluationDto?> GetByInterventionIdAsync(int interventionId)
    {
        var evaluation = await _context.Evaluations
            .Include(e => e.Intervention)
                .ThenInclude(i => i.Technicien)
            .FirstOrDefaultAsync(e => e.InterventionId == interventionId);
        
        return evaluation == null ? null : MapToDto(evaluation);
    }

    public async Task<IEnumerable<EvaluationDto>> GetByClientIdAsync(int clientId)
    {
        var evaluations = await _context.Evaluations
            .Include(e => e.Intervention)
                .ThenInclude(i => i.Technicien)
            .Where(e => e.ClientId == clientId)
            .OrderByDescending(e => e.CreatedAt)
            .ToListAsync();
        
        return evaluations.Select(MapToDto);
    }

    public async Task<IEnumerable<EvaluationDto>> GetByTechnicienIdAsync(int technicienId)
    {
        var evaluations = await _context.Evaluations
            .Include(e => e.Intervention)
                .ThenInclude(i => i.Technicien)
            .Where(e => e.Intervention.TechnicienId == technicienId)
            .OrderByDescending(e => e.CreatedAt)
            .ToListAsync();
        
        return evaluations.Select(MapToDto);
    }

    public async Task<IEnumerable<EvaluationDto>> GetAllAsync()
    {
        var evaluations = await _context.Evaluations
            .Include(e => e.Intervention)
                .ThenInclude(i => i.Technicien)
            .OrderByDescending(e => e.CreatedAt)
            .ToListAsync();
        
        return evaluations.Select(MapToDto);
    }

    public async Task<EvaluationDto?> CreateAsync(CreateEvaluationDto dto)
    {
        // Vérifier que l'intervention existe et est terminée
        var intervention = await _context.Interventions
            .Include(i => i.Technicien)
            .FirstOrDefaultAsync(i => i.Id == dto.InterventionId);
        
        if (intervention == null)
            return null;
        
        if (intervention.Statut != InterventionStatut.Terminee)
            throw new InvalidOperationException("Seules les interventions terminées peuvent être évaluées");
        
        // Vérifier qu'une évaluation n'existe pas déjà
        var existingEvaluation = await _context.Evaluations
            .FirstOrDefaultAsync(e => e.InterventionId == dto.InterventionId);
        
        if (existingEvaluation != null)
            throw new InvalidOperationException("Cette intervention a déjà été évaluée");
        
        // Valider la note
        if (dto.Note < 1 || dto.Note > 5)
            throw new ArgumentException("La note doit être entre 1 et 5");
        
        var evaluation = new Evaluation
        {
            InterventionId = dto.InterventionId,
            ClientId = dto.ClientId,
            Note = dto.Note,
            Commentaire = dto.Commentaire,
            RecommandeTechnicien = dto.RecommandeTechnicien
        };
        
        _context.Evaluations.Add(evaluation);
        await _context.SaveChangesAsync();
        
        // Envoyer notification au technicien
        if (intervention.Technicien != null)
        {
            await _notificationsApiClient.NotifyEvaluationReceivedAsync(
                evaluation.Id, 
                intervention.Id, 
                intervention.Technicien.UserId);
        }
        
        evaluation.Intervention = intervention;
        return MapToDto(evaluation);
    }

    public async Task<EvaluationDto?> UpdateAsync(int id, UpdateEvaluationDto dto)
    {
        var evaluation = await _context.Evaluations
            .Include(e => e.Intervention)
                .ThenInclude(i => i.Technicien)
            .FirstOrDefaultAsync(e => e.Id == id);
        
        if (evaluation == null)
            return null;
        
        if (dto.Note < 1 || dto.Note > 5)
            throw new ArgumentException("La note doit être entre 1 et 5");
        
        evaluation.Note = dto.Note;
        evaluation.Commentaire = dto.Commentaire;
        evaluation.RecommandeTechnicien = dto.RecommandeTechnicien;
        
        await _context.SaveChangesAsync();
        return MapToDto(evaluation);
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var evaluation = await _context.Evaluations.FindAsync(id);
        if (evaluation == null)
            return false;
        
        _context.Evaluations.Remove(evaluation);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<EvaluationStatsDto> GetStatsAsync()
    {
        var evaluations = await _context.Evaluations.ToListAsync();
        
        return new EvaluationStatsDto
        {
            TotalEvaluations = evaluations.Count,
            NoteMoyenne = evaluations.Count > 0 ? evaluations.Average(e => e.Note) : 0,
            NotesCinqEtoiles = evaluations.Count(e => e.Note == 5),
            NotesQuatreEtoiles = evaluations.Count(e => e.Note == 4),
            NotesTroisEtoiles = evaluations.Count(e => e.Note == 3),
            NotesDeuxEtoiles = evaluations.Count(e => e.Note == 2),
            NotesUneEtoile = evaluations.Count(e => e.Note == 1),
            TauxRecommandation = evaluations.Count > 0 
                ? (evaluations.Count(e => e.RecommandeTechnicien) * 100.0 / evaluations.Count) 
                : 0
        };
    }

    public async Task<TechnicienEvaluationStatsDto?> GetTechnicienStatsAsync(int technicienId)
    {
        var technicien = await _context.Techniciens.FindAsync(technicienId);
        if (technicien == null)
            return null;
        
        var evaluations = await _context.Evaluations
            .Include(e => e.Intervention)
            .Where(e => e.Intervention.TechnicienId == technicienId)
            .ToListAsync();
        
        return new TechnicienEvaluationStatsDto
        {
            TechnicienId = technicienId,
            TechnicienNom = $"{technicien.Prenom} {technicien.Nom}",
            NombreEvaluations = evaluations.Count,
            NoteMoyenne = evaluations.Count > 0 ? evaluations.Average(e => e.Note) : 0,
            TauxRecommandation = evaluations.Count > 0 
                ? (evaluations.Count(e => e.RecommandeTechnicien) * 100.0 / evaluations.Count) 
                : 0
        };
    }

    private static EvaluationDto MapToDto(Evaluation evaluation) => new()
    {
        Id = evaluation.Id,
        InterventionId = evaluation.InterventionId,
        ClientId = evaluation.ClientId,
        Note = evaluation.Note,
        Commentaire = evaluation.Commentaire,
        RecommandeTechnicien = evaluation.RecommandeTechnicien,
        CreatedAt = evaluation.CreatedAt,
        TechnicienNom = evaluation.Intervention?.Technicien != null 
            ? $"{evaluation.Intervention.Technicien.Prenom} {evaluation.Intervention.Technicien.Nom}"
            : null
    };
}
