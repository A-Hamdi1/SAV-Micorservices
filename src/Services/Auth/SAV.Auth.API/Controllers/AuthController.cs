using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SAV.Auth.Application.Interfaces;
using SAV.Shared.Common;
using SAV.Shared.DTOs.Auth;
using System.Security.Claims;

namespace SAV.Auth.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly ILogger<AuthController> _logger;

    public AuthController(IAuthService authService, ILogger<AuthController> logger)
    {
        _authService = authService;
        _logger = logger;
    }

    [HttpPost("register")]
    public async Task<ActionResult<ApiResponse<AuthResponseDto>>> Register([FromBody] RegisterDto registerDto)
    {
        try
        {
            if (registerDto.Password != registerDto.ConfirmPassword)
            {
                return BadRequest(new ApiResponse<AuthResponseDto>
                {
                    Success = false,
                    Message = "Les mots de passe ne correspondent pas",
                    Errors = new List<string> { "Password and ConfirmPassword must match" }
                });
            }

            var result = await _authService.RegisterAsync(registerDto);

            if (result == null)
            {
                return BadRequest(new ApiResponse<AuthResponseDto>
                {
                    Success = false,
                    Message = "Échec de l'inscription",
                    Errors = new List<string> { "User already exists or invalid data" }
                });
            }

            return Ok(new ApiResponse<AuthResponseDto>
            {
                Success = true,
                Data = result,
                Message = "Inscription réussie"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during registration");
            return StatusCode(500, new ApiResponse<AuthResponseDto>
            {
                Success = false,
                Message = "Une erreur s'est produite",
                Errors = new List<string> { ex.Message }
            });
        }
    }

    [HttpPost("login")]
    public async Task<ActionResult<ApiResponse<AuthResponseDto>>> Login([FromBody] LoginDto loginDto)
    {
        try
        {
            var result = await _authService.LoginAsync(loginDto);

            if (result == null)
            {
                return Unauthorized(new ApiResponse<AuthResponseDto>
                {
                    Success = false,
                    Message = "Email ou mot de passe incorrect",
                    Errors = new List<string> { "Invalid credentials" }
                });
            }

            return Ok(new ApiResponse<AuthResponseDto>
            {
                Success = true,
                Data = result,
                Message = "Connexion réussie"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during login");
            return StatusCode(500, new ApiResponse<AuthResponseDto>
            {
                Success = false,
                Message = "Une erreur s'est produite",
                Errors = new List<string> { ex.Message }
            });
        }
    }

    [HttpPost("refresh-token")]
    public async Task<ActionResult<ApiResponse<AuthResponseDto>>> RefreshToken([FromBody] RefreshTokenDto refreshTokenDto)
    {
        try
        {
            var result = await _authService.RefreshTokenAsync(refreshTokenDto.RefreshToken);

            if (result == null)
            {
                return Unauthorized(new ApiResponse<AuthResponseDto>
                {
                    Success = false,
                    Message = "Token invalide ou expiré",
                    Errors = new List<string> { "Invalid or expired refresh token" }
                });
            }

            return Ok(new ApiResponse<AuthResponseDto>
            {
                Success = true,
                Data = result,
                Message = "Token rafraîchi avec succès"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during token refresh");
            return StatusCode(500, new ApiResponse<AuthResponseDto>
            {
                Success = false,
                Message = "Une erreur s'est produite",
                Errors = new List<string> { ex.Message }
            });
        }
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<UserDto>>> GetCurrentUser()
    {
        try
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new ApiResponse<UserDto>
                {
                    Success = false,
                    Message = "Non autorisé",
                    Errors = new List<string> { "User not authenticated" }
                });
            }

            var user = await _authService.GetUserByIdAsync(userId);

            if (user == null)
            {
                return NotFound(new ApiResponse<UserDto>
                {
                    Success = false,
                    Message = "Utilisateur non trouvé",
                    Errors = new List<string> { "User not found" }
                });
            }

            return Ok(new ApiResponse<UserDto>
            {
                Success = true,
                Data = user,
                Message = "Utilisateur récupéré avec succès"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting current user");
            return StatusCode(500, new ApiResponse<UserDto>
            {
                Success = false,
                Message = "Une erreur s'est produite",
                Errors = new List<string> { ex.Message }
            });
        }
    }

    [HttpPost("revoke-token")]
    [Authorize]
    public async Task<ActionResult<ApiResponse>> RevokeToken([FromBody] RefreshTokenDto refreshTokenDto)
    {
        try
        {
            var result = await _authService.RevokeTokenAsync(refreshTokenDto.RefreshToken);

            if (!result)
            {
                return BadRequest(new ApiResponse
                {
                    Success = false,
                    Message = "Token invalide ou déjà révoqué",
                    Errors = new List<string> { "Invalid or already revoked token" }
                });
            }

            return Ok(new ApiResponse
            {
                Success = true,
                Message = "Token révoqué avec succès"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error revoking token");
            return StatusCode(500, new ApiResponse
            {
                Success = false,
                Message = "Une erreur s'est produite",
                Errors = new List<string> { ex.Message }
            });
        }
    }
}
