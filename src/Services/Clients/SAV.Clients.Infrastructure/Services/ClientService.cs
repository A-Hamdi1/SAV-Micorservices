using Microsoft.EntityFrameworkCore;
using SAV.Clients.Application.Interfaces;
using SAV.Clients.Domain.Entities;
using SAV.Clients.Infrastructure.Data;
using SAV.Shared.DTOs.Clients;

namespace SAV.Clients.Infrastructure.Services;

public class ClientService : IClientService
{
    private readonly ClientsDbContext _context;

    public ClientService(ClientsDbContext context)
    {
        _context = context;
    }

    public async Task<ClientDto?> GetClientByUserIdAsync(string userId)
    {
        var client = await _context.Clients
            .FirstOrDefaultAsync(c => c.UserId == userId);

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

    public async Task<ClientDto?> GetClientByIdAsync(int clientId)
    {
        var client = await _context.Clients.FindAsync(clientId);

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

    public async Task<List<ClientDto>> GetAllClientsAsync()
    {
        var clients = await _context.Clients.ToListAsync();

        return clients.Select(c => new ClientDto
        {
            Id = c.Id,
            UserId = c.UserId,
            Nom = c.Nom,
            Prenom = c.Prenom,
            Telephone = c.Telephone,
            Adresse = c.Adresse,
            CreatedAt = c.CreatedAt
        }).ToList();
    }

    public async Task<ClientDto?> CreateClientAsync(string userId, CreateClientDto dto)
    {
        var existingClient = await _context.Clients
            .FirstOrDefaultAsync(c => c.UserId == userId);

        if (existingClient != null)
            return null;

        var client = new Client
        {
            UserId = userId,
            Nom = dto.Nom,
            Prenom = dto.Prenom,
            Telephone = dto.Telephone,
            Adresse = dto.Adresse
        };

        _context.Clients.Add(client);
        await _context.SaveChangesAsync();

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

    public async Task<ClientDto?> UpdateClientAsync(string userId, UpdateClientDto dto)
    {
        var client = await _context.Clients
            .FirstOrDefaultAsync(c => c.UserId == userId);

        if (client == null)
            return null;

        client.Nom = dto.Nom;
        client.Prenom = dto.Prenom;
        client.Telephone = dto.Telephone;
        client.Adresse = dto.Adresse;

        await _context.SaveChangesAsync();

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

    public async Task<ClientDto?> CreateClientByResponsableAsync(string userId, CreateClientDto dto)
    {
        // Vérifier si un client existe déjà pour cet userId
        var existingClient = await _context.Clients
            .FirstOrDefaultAsync(c => c.UserId == userId);

        if (existingClient != null)
            return null;

        var client = new Client
        {
            UserId = userId,
            Nom = dto.Nom,
            Prenom = dto.Prenom,
            Telephone = dto.Telephone,
            Adresse = dto.Adresse
        };

        _context.Clients.Add(client);
        await _context.SaveChangesAsync();

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

    public async Task<ClientDto?> UpdateClientByIdAsync(int clientId, UpdateClientDto dto)
    {
        var client = await _context.Clients.FindAsync(clientId);

        if (client == null)
            return null;

        client.Nom = dto.Nom;
        client.Prenom = dto.Prenom;
        client.Telephone = dto.Telephone;
        client.Adresse = dto.Adresse;

        await _context.SaveChangesAsync();

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

    public async Task<bool> DeleteClientAsync(int clientId)
    {
        var client = await _context.Clients
            .Include(c => c.Reclamations)
            .Include(c => c.ArticlesAchetes)
            .FirstOrDefaultAsync(c => c.Id == clientId);

        if (client == null)
            return false;

        // Ne pas supprimer si le client a des réclamations
        if (client.Reclamations.Any())
            return false;

        _context.Clients.Remove(client);
        await _context.SaveChangesAsync();

        return true;
    }
}
