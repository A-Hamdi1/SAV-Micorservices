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
        var demande = new DemandeRdv
        {
            ReclamationId = dto.ReclamationId,
            ClientId = dto.ClientId,
            CreneauId = dto.CreneauId,
            DateSouhaitee = dto.DateSouhaitee,
            PreferenceMoment = dto.PreferenceMoment,
            Commentaire = dto.Commentaire
        };

        _context.DemandesRdv.Add(demande);
        await _context.SaveChangesAsync();

        if (dto.CreneauId.HasValue)
        {
            demande.Creneau = await _context.CreneauxDisponibles
                .Include(c => c.Technicien)
                .FirstOrDefaultAsync(c => c.Id == dto.CreneauId.Value);
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
            if (dto.CreneauId.HasValue)
            {
                var creneau = await _context.CreneauxDisponibles
                    .Include(c => c.Technicien)
                    .FirstOrDefaultAsync(c => c.Id == dto.CreneauId.Value);

                if (creneau == null || creneau.EstReserve)
                    throw new InvalidOperationException("Créneau non disponible");

                demande.CreneauId = dto.CreneauId;
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
