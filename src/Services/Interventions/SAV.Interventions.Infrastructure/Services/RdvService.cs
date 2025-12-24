using Microsoft.EntityFrameworkCore;
using SAV.Interventions.Application.Interfaces;
using SAV.Interventions.Domain.Entities;
using SAV.Interventions.Infrastructure.Data;

namespace SAV.Interventions.Infrastructure.Services;

public class RdvService : IRdvService
{
    private readonly InterventionsDbContext _context;

    public RdvService(InterventionsDbContext context)
    {
        _context = context;
    }

    #region Créneaux

    public async Task<IEnumerable<CreneauDto>> GetCreneauxDisponiblesAsync(DateTime dateDebut, DateTime dateFin, int? technicienId = null)
    {
        var query = _context.CreneauxDisponibles
            .Include(c => c.Technicien)
            .Where(c => !c.EstReserve && c.DateDebut >= dateDebut && c.DateFin <= dateFin);

        if (technicienId.HasValue)
            query = query.Where(c => c.TechnicienId == technicienId.Value);

        var creneaux = await query.OrderBy(c => c.DateDebut).ToListAsync();
        return creneaux.Select(MapToCreneauDto);
    }

    public async Task<CreneauxPaginatedResult> GetAllCreneauxAsync(DateTime dateDebut, DateTime dateFin, int? technicienId = null, int page = 1, int pageSize = 20)
    {
        var query = _context.CreneauxDisponibles
            .Include(c => c.Technicien)
            .Where(c => c.DateDebut >= dateDebut && c.DateFin <= dateFin);

        if (technicienId.HasValue)
            query = query.Where(c => c.TechnicienId == technicienId.Value);

        var totalCount = await query.CountAsync();
        var totalLibres = await query.CountAsync(c => !c.EstReserve);
        var totalReserves = await query.CountAsync(c => c.EstReserve);

        var creneaux = await query
            .OrderBy(c => c.DateDebut)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return new CreneauxPaginatedResult
        {
            Creneaux = creneaux.Select(MapToCreneauDto),
            TotalCount = totalCount,
            TotalLibres = totalLibres,
            TotalReserves = totalReserves,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<CreneauDto?> CreateCreneauAsync(CreateCreneauDto dto)
    {
        var technicien = await _context.Techniciens.FindAsync(dto.TechnicienId);
        if (technicien == null)
            return null;

        // Vérifier les chevauchements
        var chevauchement = await _context.CreneauxDisponibles
            .AnyAsync(c => c.TechnicienId == dto.TechnicienId &&
                          ((c.DateDebut <= dto.DateDebut && c.DateFin > dto.DateDebut) ||
                           (c.DateDebut < dto.DateFin && c.DateFin >= dto.DateFin)));

        if (chevauchement)
            throw new InvalidOperationException("Ce créneau chevauche un créneau existant");

        var creneau = new CreneauDisponible
        {
            TechnicienId = dto.TechnicienId,
            DateDebut = dto.DateDebut,
            DateFin = dto.DateFin
        };

        _context.CreneauxDisponibles.Add(creneau);
        await _context.SaveChangesAsync();

        creneau.Technicien = technicien;
        return MapToCreneauDto(creneau);
    }

    public async Task<IEnumerable<CreneauDto>> CreateCreneauxRecurrentsAsync(CreateCreneauxRecurrentsDto dto)
    {
        var technicien = await _context.Techniciens.FindAsync(dto.TechnicienId);
        if (technicien == null)
            throw new KeyNotFoundException("Technicien non trouvé");

        var creneaux = new List<CreneauDisponible>();
        var currentDate = dto.DateDebut.Date;

        while (currentDate <= dto.DateFin.Date)
        {
            if (dto.Jours.Contains(currentDate.DayOfWeek))
            {
                var heureActuelle = dto.HeureDebut;
                while (heureActuelle.Add(TimeSpan.FromMinutes(dto.DureeMinutes)) <= dto.HeureFin)
                {
                    var dateDebut = currentDate.Add(heureActuelle);
                    var dateFin = dateDebut.AddMinutes(dto.DureeMinutes);

                    // Vérifier si le créneau n'existe pas déjà
                    var existe = await _context.CreneauxDisponibles
                        .AnyAsync(c => c.TechnicienId == dto.TechnicienId &&
                                      c.DateDebut == dateDebut && c.DateFin == dateFin);

                    if (!existe)
                    {
                        creneaux.Add(new CreneauDisponible
                        {
                            TechnicienId = dto.TechnicienId,
                            Technicien = technicien,
                            DateDebut = dateDebut,
                            DateFin = dateFin
                        });
                    }

                    heureActuelle = heureActuelle.Add(TimeSpan.FromMinutes(dto.DureeMinutes));
                }
            }
            currentDate = currentDate.AddDays(1);
        }

        _context.CreneauxDisponibles.AddRange(creneaux);
        await _context.SaveChangesAsync();

        return creneaux.Select(MapToCreneauDto);
    }

    public async Task<bool> DeleteCreneauAsync(int id)
    {
        var creneau = await _context.CreneauxDisponibles.FindAsync(id);
        if (creneau == null || creneau.EstReserve)
            return false;

        _context.CreneauxDisponibles.Remove(creneau);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<CreneauDto?> ReserverCreneauAsync(int creneauId, int interventionId)
    {
        var creneau = await _context.CreneauxDisponibles
            .Include(c => c.Technicien)
            .FirstOrDefaultAsync(c => c.Id == creneauId);

        if (creneau == null || creneau.EstReserve)
            return null;

        creneau.EstReserve = true;
        creneau.InterventionId = interventionId;
        await _context.SaveChangesAsync();

        return MapToCreneauDto(creneau);
    }

    public async Task<bool> LibererCreneauAsync(int creneauId)
    {
        var creneau = await _context.CreneauxDisponibles.FindAsync(creneauId);
        if (creneau == null)
            return false;

        creneau.EstReserve = false;
        creneau.InterventionId = null;
        await _context.SaveChangesAsync();

        return true;
    }

    public async Task<IEnumerable<CreneauDto>> GetCreneauxByTechnicienAsync(int technicienId, DateTime? date = null)
    {
        var query = _context.CreneauxDisponibles
            .Include(c => c.Technicien)
            .Where(c => c.TechnicienId == technicienId);

        if (date.HasValue)
            query = query.Where(c => c.DateDebut.Date == date.Value.Date);

        var creneaux = await query.OrderBy(c => c.DateDebut).ToListAsync();
        return creneaux.Select(MapToCreneauDto);
    }

    #endregion

    #region Demandes RDV

    public async Task<DemandeRdvDto?> GetDemandeRdvByIdAsync(int id)
    {
        var demande = await _context.DemandesRdv
            .Include(d => d.Creneau)
                .ThenInclude(c => c!.Technicien)
            .FirstOrDefaultAsync(d => d.Id == id);

        return demande == null ? null : MapToDemandeRdvDto(demande);
    }

    public async Task<IEnumerable<DemandeRdvDto>> GetDemandesRdvAsync(string? statut = null)
    {
        IQueryable<DemandeRdv> query = _context.DemandesRdv
            .Include(d => d.Creneau)
                .ThenInclude(c => c!.Technicien);

        if (!string.IsNullOrEmpty(statut) && Enum.TryParse<DemandeRdvStatut>(statut, out var s))
            query = query.Where(d => d.Statut == s);

        var demandes = await query.OrderByDescending(d => d.CreatedAt).ToListAsync();
        return demandes.Select(MapToDemandeRdvDto);
    }

    public async Task<IEnumerable<DemandeRdvDto>> GetDemandesRdvByClientAsync(int clientId)
    {
        var demandes = await _context.DemandesRdv
            .Include(d => d.Creneau)
                .ThenInclude(c => c!.Technicien)
            .Where(d => d.ClientId == clientId)
            .OrderByDescending(d => d.CreatedAt)
            .ToListAsync();

        return demandes.Select(MapToDemandeRdvDto);
    }

    public async Task<DemandeRdvDto?> CreateDemandeRdvAsync(CreateDemandeRdvDto dto)
    {
        // Vérifier si le client a déjà un RDV actif (EnAttente ou Confirmée avec date future)
        var rdvActif = await _context.DemandesRdv
            .Include(d => d.Creneau)
            .Where(d => d.ClientId == dto.ClientId)
            .Where(d => d.Statut == DemandeRdvStatut.EnAttente || d.Statut == DemandeRdvStatut.Confirmee)
            .Where(d => 
                // Si pas de créneau assigné, considérer comme actif
                d.CreneauId == null || 
                // Si créneau assigné, vérifier que la date n'est pas passée
                (d.Creneau != null && d.Creneau.DateFin > DateTime.UtcNow))
            .FirstOrDefaultAsync();

        if (rdvActif != null)
        {
            var message = rdvActif.Statut == DemandeRdvStatut.EnAttente
                ? "Vous avez déjà une demande de RDV en attente de traitement."
                : $"Vous avez déjà un RDV confirmé prévu. Veuillez attendre qu'il soit passé pour en demander un autre.";
            throw new InvalidOperationException(message);
        }

        // Le créneau est maintenant obligatoire
        if (!dto.CreneauId.HasValue)
        {
            throw new InvalidOperationException("Vous devez sélectionner un créneau pour votre demande de RDV.");
        }

        // Vérifier si le créneau sélectionné est disponible
        var creneauSelectionne = await _context.CreneauxDisponibles
            .Include(c => c.Technicien)
            .FirstOrDefaultAsync(c => c.Id == dto.CreneauId.Value);
        
        if (creneauSelectionne == null)
            throw new InvalidOperationException("Le créneau sélectionné n'existe pas.");
        
        if (creneauSelectionne.EstReserve)
            throw new InvalidOperationException("Le créneau sélectionné n'est plus disponible.");

        var demande = new DemandeRdv
        {
            ReclamationId = dto.ReclamationId,
            ClientId = dto.ClientId,
            Motif = dto.Motif,
            CreneauId = dto.CreneauId,
            DateSouhaitee = dto.DateSouhaitee ?? creneauSelectionne?.DateDebut,
            PreferenceMoment = dto.PreferenceMoment,
            Commentaire = dto.Commentaire
        };

        _context.DemandesRdv.Add(demande);
        await _context.SaveChangesAsync();

        if (creneauSelectionne != null)
        {
            demande.Creneau = creneauSelectionne;
        }

        return MapToDemandeRdvDto(demande);
    }

    public async Task<DemandeRdvDto?> TraiterDemandeRdvAsync(int id, TraiterDemandeRdvDto dto)
    {
        var demande = await _context.DemandesRdv
            .Include(d => d.Creneau)
                .ThenInclude(c => c!.Technicien)
            .FirstOrDefaultAsync(d => d.Id == id);

        if (demande == null)
            return null;

        if (dto.Accepter)
        {
            // Utiliser le créneau fourni par le responsable, sinon celui déjà sélectionné par le client
            var creneauIdToUse = dto.CreneauId ?? demande.CreneauId;
            
            if (creneauIdToUse.HasValue)
            {
                var creneau = await _context.CreneauxDisponibles
                    .Include(c => c.Technicien)
                    .FirstOrDefaultAsync(c => c.Id == creneauIdToUse.Value);

                if (creneau == null || creneau.EstReserve)
                    throw new InvalidOperationException("Créneau non disponible");

                // Marquer le créneau comme réservé
                creneau.EstReserve = true;
                
                demande.CreneauId = creneauIdToUse;
                demande.Creneau = creneau;
            }

            demande.Statut = DemandeRdvStatut.Confirmee;
        }
        else
        {
            demande.Statut = DemandeRdvStatut.Refusee;
        }

        demande.Commentaire = dto.Commentaire ?? demande.Commentaire;
        demande.TraiteeAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return MapToDemandeRdvDto(demande);
    }

    public async Task<DemandeRdvDto?> AnnulerDemandeRdvAsync(int id)
    {
        var demande = await _context.DemandesRdv
            .Include(d => d.Creneau)
            .FirstOrDefaultAsync(d => d.Id == id);

        if (demande == null)
            return null;

        // Libérer le créneau si il était réservé
        if (demande.Creneau != null && demande.Creneau.EstReserve)
        {
            demande.Creneau.EstReserve = false;
        }

        demande.Statut = DemandeRdvStatut.Annulee;
        demande.TraiteeAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return MapToDemandeRdvDto(demande);
    }

    #endregion

    #region Mappers

    private static CreneauDto MapToCreneauDto(CreneauDisponible creneau) => new()
    {
        Id = creneau.Id,
        TechnicienId = creneau.TechnicienId,
        TechnicienNom = creneau.Technicien != null ? $"{creneau.Technicien.Prenom} {creneau.Technicien.Nom}" : "",
        DateDebut = creneau.DateDebut,
        DateFin = creneau.DateFin,
        EstReserve = creneau.EstReserve,
        InterventionId = creneau.InterventionId
    };

    private static DemandeRdvDto MapToDemandeRdvDto(DemandeRdv demande) => new()
    {
        Id = demande.Id,
        ReclamationId = demande.ReclamationId,
        ClientId = demande.ClientId,
        Motif = demande.Motif,
        CreneauId = demande.CreneauId,
        Creneau = demande.Creneau != null ? MapToCreneauDto(demande.Creneau) : null,
        DateSouhaitee = demande.DateSouhaitee,
        PreferenceMoment = demande.PreferenceMoment,
        Statut = demande.Statut.ToString(),
        Commentaire = demande.Commentaire,
        CreatedAt = demande.CreatedAt,
        TraiteeAt = demande.TraiteeAt
    };

    #endregion
}
