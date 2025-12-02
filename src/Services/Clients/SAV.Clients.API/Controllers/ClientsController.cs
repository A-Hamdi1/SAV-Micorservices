using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SAV.Clients.Application.Interfaces;
using SAV.Shared.Common;
using SAV.Shared.DTOs.Clients;
using System.Security.Claims;

namespace SAV.Clients.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ClientsController : ControllerBase
{
    private readonly IClientService _clientService;

    public ClientsController(IClientService clientService)
    {
        _clientService = clientService;
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<ClientDto>>> GetMyProfile()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized(new ApiResponse<ClientDto>
            {
                Success = false,
                Message = "Utilisateur non authentifié"
            });
        }

        var client = await _clientService.GetClientByUserIdAsync(userId);
        
        if (client == null)
        {
            return NotFound(new ApiResponse<ClientDto>
            {
                Success = false,
                Message = "Profil client non trouvé"
            });
        }

        return Ok(new ApiResponse<ClientDto>
        {
            Success = true,
            Data = client
        });
    }

    [HttpPost("me")]
    [Authorize(Roles = "Client")]
    public async Task<ActionResult<ApiResponse<ClientDto>>> CreateMyProfile([FromBody] CreateClientDto dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized(new ApiResponse<ClientDto>
            {
                Success = false,
                Message = "Utilisateur non authentifié"
            });
        }

        var client = await _clientService.CreateClientAsync(userId, dto);
        
        if (client == null)
        {
            return BadRequest(new ApiResponse<ClientDto>
            {
                Success = false,
                Message = "Le profil client existe déjà"
            });
        }

        return CreatedAtAction(nameof(GetMyProfile), new ApiResponse<ClientDto>
        {
            Success = true,
            Data = client,
            Message = "Profil client créé avec succès"
        });
    }

    [HttpPut("me")]
    [Authorize(Roles = "Client")]
    public async Task<ActionResult<ApiResponse<ClientDto>>> UpdateMyProfile([FromBody] UpdateClientDto dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized(new ApiResponse<ClientDto>
            {
                Success = false,
                Message = "Utilisateur non authentifié"
            });
        }

        var client = await _clientService.UpdateClientAsync(userId, dto);
        
        if (client == null)
        {
            return NotFound(new ApiResponse<ClientDto>
            {
                Success = false,
                Message = "Profil client non trouvé"
            });
        }

        return Ok(new ApiResponse<ClientDto>
        {
            Success = true,
            Data = client,
            Message = "Profil mis à jour avec succès"
        });
    }

    [HttpGet]
    [Authorize(Roles = "ResponsableSAV")]
    public async Task<ActionResult<ApiResponse<List<ClientDto>>>> GetAllClients(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10)
    {
        var clients = await _clientService.GetAllClientsAsync();
        
        return Ok(new ApiResponse<List<ClientDto>>
        {
            Success = true,
            Data = clients
        });
    }

    [HttpGet("{id}")]
    [Authorize(Roles = "ResponsableSAV")]
    public async Task<ActionResult<ApiResponse<ClientDto>>> GetClientById(int id)
    {
        var client = await _clientService.GetClientByIdAsync(id);
        
        if (client == null)
        {
            return NotFound(new ApiResponse<ClientDto>
            {
                Success = false,
                Message = "Client non trouvé"
            });
        }

        return Ok(new ApiResponse<ClientDto>
        {
            Success = true,
            Data = client
        });
    }

    [HttpPost]
    [Authorize(Roles = "ResponsableSAV")]
    public async Task<ActionResult<ApiResponse<ClientDto>>> CreateClient([FromBody] CreateClientByResponsableDto dto)
    {
        var createDto = new CreateClientDto
        {
            Nom = dto.Nom,
            Prenom = dto.Prenom,
            Telephone = dto.Telephone,
            Adresse = dto.Adresse
        };

        var client = await _clientService.CreateClientByResponsableAsync(dto.UserId, createDto);

        if (client == null)
        {
            return BadRequest(new ApiResponse<ClientDto>
            {
                Success = false,
                Message = "Un client existe déjà pour cet utilisateur"
            });
        }

        return CreatedAtAction(nameof(GetClientById), new { id = client.Id }, new ApiResponse<ClientDto>
        {
            Success = true,
            Data = client,
            Message = "Client créé avec succès"
        });
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "ResponsableSAV")]
    public async Task<ActionResult<ApiResponse<ClientDto>>> UpdateClient(int id, [FromBody] UpdateClientDto dto)
    {
        var client = await _clientService.UpdateClientByIdAsync(id, dto);

        if (client == null)
        {
            return NotFound(new ApiResponse<ClientDto>
            {
                Success = false,
                Message = "Client non trouvé"
            });
        }

        return Ok(new ApiResponse<ClientDto>
        {
            Success = true,
            Data = client,
            Message = "Client mis à jour avec succès"
        });
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "ResponsableSAV")]
    public async Task<ActionResult<ApiResponse>> DeleteClient(int id)
    {
        var result = await _clientService.DeleteClientAsync(id);

        if (!result)
        {
            return BadRequest(new ApiResponse
            {
                Success = false,
                Message = "Impossible de supprimer le client. Il a peut-être des réclamations associées."
            });
        }

        return Ok(new ApiResponse
        {
            Success = true,
            Message = "Client supprimé avec succès"
        });
    }
}
