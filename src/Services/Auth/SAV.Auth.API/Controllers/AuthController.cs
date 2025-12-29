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

    [HttpPost("forgot-password")]
    public async Task<ActionResult<ApiResponse>> ForgotPassword([FromBody] ForgotPasswordDto dto)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(dto.Email))
            {
                return BadRequest(new ApiResponse
                {
                    Success = false,
                    Message = "Email requis",
                    Errors = new List<string> { "Email is required" }
                });
            }

            await _authService.SendPasswordResetOtpAsync(dto.Email);

            // Toujours retourner succès pour des raisons de sécurité (ne pas révéler si l'email existe)
            return Ok(new ApiResponse
            {
                Success = true,
                Message = "Si cet email existe, un code de vérification a été envoyé"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending password reset OTP");
            return StatusCode(500, new ApiResponse
            {
                Success = false,
                Message = "Une erreur s'est produite",
                Errors = new List<string> { ex.Message }
            });
        }
    }

    [HttpPost("verify-otp")]
    public async Task<ActionResult<ApiResponse>> VerifyOtp([FromBody] VerifyOtpDto dto)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(dto.Email) || string.IsNullOrWhiteSpace(dto.Otp))
            {
                return BadRequest(new ApiResponse
                {
                    Success = false,
                    Message = "Email et code OTP requis",
                    Errors = new List<string> { "Email and OTP are required" }
                });
            }

            var isValid = await _authService.VerifyOtpAsync(dto.Email, dto.Otp);

            if (!isValid)
            {
                return BadRequest(new ApiResponse
                {
                    Success = false,
                    Message = "Code OTP invalide ou expiré",
                    Errors = new List<string> { "Invalid or expired OTP" }
                });
            }

            return Ok(new ApiResponse
            {
                Success = true,
                Message = "Code OTP vérifié avec succès"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error verifying OTP");
            return StatusCode(500, new ApiResponse
            {
                Success = false,
                Message = "Une erreur s'est produite",
                Errors = new List<string> { ex.Message }
            });
        }
    }

    [HttpPost("reset-password")]
    public async Task<ActionResult<ApiResponse>> ResetPassword([FromBody] ResetPasswordDto dto)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(dto.Email) || string.IsNullOrWhiteSpace(dto.Otp) || 
                string.IsNullOrWhiteSpace(dto.NewPassword))
            {
                return BadRequest(new ApiResponse
                {
                    Success = false,
                    Message = "Tous les champs sont requis",
                    Errors = new List<string> { "All fields are required" }
                });
            }

            if (dto.NewPassword != dto.ConfirmPassword)
            {
                return BadRequest(new ApiResponse
                {
                    Success = false,
                    Message = "Les mots de passe ne correspondent pas",
                    Errors = new List<string> { "Passwords do not match" }
                });
            }

            var (success, errors) = await _authService.ResetPasswordAsync(dto.Email, dto.Otp, dto.NewPassword);

            if (!success)
            {
                return BadRequest(new ApiResponse
                {
                    Success = false,
                    Message = errors.FirstOrDefault() ?? "Erreur lors de la réinitialisation",
                    Errors = errors
                });
            }

            return Ok(new ApiResponse
            {
                Success = true,
                Message = "Mot de passe réinitialisé avec succès"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error resetting password");
            return StatusCode(500, new ApiResponse
            {
                Success = false,
                Message = "Une erreur s'est produite",
                Errors = new List<string> { ex.Message }
            });
        }
    }

    [HttpPost("change-password")]
    [Authorize]
    public async Task<ActionResult<ApiResponse>> ChangePassword([FromBody] ChangePasswordDto changePasswordDto)
    {
        try
        {
            if (changePasswordDto.NewPassword != changePasswordDto.ConfirmPassword)
            {
                return BadRequest(new ApiResponse
                {
                    Success = false,
                    Message = "Les mots de passe ne correspondent pas",
                    Errors = new List<string> { "NewPassword and ConfirmPassword must match" }
                });
            }

            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new ApiResponse
                {
                    Success = false,
                    Message = "Utilisateur non authentifié"
                });
            }

            var (success, errors) = await _authService.ChangePasswordAsync(userId, changePasswordDto.CurrentPassword, changePasswordDto.NewPassword);

            if (!success)
            {
                return BadRequest(new ApiResponse
                {
                    Success = false,
                    Message = errors.FirstOrDefault() ?? "Erreur lors du changement du mot de passe",
                    Errors = errors
                });
            }

            return Ok(new ApiResponse
            {
                Success = true,
                Message = "Mot de passe changé avec succès"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error changing password");
            return StatusCode(500, new ApiResponse
            {
                Success = false,
                Message = "Une erreur s'est produite",
                Errors = new List<string> { ex.Message }
            });
        }
    }
}
