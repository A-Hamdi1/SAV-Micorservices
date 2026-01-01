using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using SAV.Auth.Application.Interfaces;
using SAV.Auth.Domain.Entities;
using SAV.Auth.Infrastructure.Data;
using SAV.Shared.DTOs.Auth;

namespace SAV.Auth.Infrastructure.Services;

public class AuthService : IAuthService
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly ITokenService _tokenService;
    private readonly IEmailService _emailService;
    private readonly AuthDbContext _context;

    public AuthService(
        UserManager<ApplicationUser> userManager,
        ITokenService tokenService,
        IEmailService emailService,
        AuthDbContext context)
    {
        _userManager = userManager;
        _tokenService = tokenService;
        _emailService = emailService;
        _context = context;
    }

    public async Task<AuthResponseDto?> RegisterAsync(RegisterDto registerDto)
    {
        if (registerDto.Password != registerDto.ConfirmPassword)
        {
            return null;
        }

        // Validation du rôle
        var validRoles = new[] { "Client", "Technicien", "ResponsableSAV" };
        if (!validRoles.Contains(registerDto.Role))
        {
            return null;
        }

        var existingUser = await _userManager.FindByEmailAsync(registerDto.Email);
        if (existingUser != null)
        {
            return null;
        }

        var user = new ApplicationUser
        {
            UserName = registerDto.Email,
            Email = registerDto.Email,
            Role = registerDto.Role,
            EmailConfirmed = true
        };

        var result = await _userManager.CreateAsync(user, registerDto.Password);
        
        if (!result.Succeeded)
        {
            return null;
        }

        var accessToken = _tokenService.GenerateAccessToken(user.Id, user.Email!, user.Role);
        var refreshToken = _tokenService.GenerateRefreshToken();

        var refreshTokenEntity = new RefreshToken
        {
            Token = refreshToken,
            UserId = user.Id,
            ExpiryDate = DateTime.UtcNow.AddDays(7)
        };

        _context.RefreshTokens.Add(refreshTokenEntity);
        await _context.SaveChangesAsync();

        return new AuthResponseDto
        {
            Token = accessToken,
            RefreshToken = refreshToken,
            Email = user.Email!,
            Role = user.Role,
            ExpiresIn = 3600
        };
    }

    public async Task<AuthResponseDto?> LoginAsync(LoginDto loginDto)
    {
        var user = await _userManager.FindByEmailAsync(loginDto.Email);
        
        if (user == null)
        {
            return null;
        }

        var isPasswordValid = await _userManager.CheckPasswordAsync(user, loginDto.Password);
        
        if (!isPasswordValid)
        {
            return null;
        }

        var accessToken = _tokenService.GenerateAccessToken(user.Id, user.Email!, user.Role);
        var refreshToken = _tokenService.GenerateRefreshToken();

        var refreshTokenEntity = new RefreshToken
        {
            Token = refreshToken,
            UserId = user.Id,
            ExpiryDate = DateTime.UtcNow.AddDays(7)
        };

        _context.RefreshTokens.Add(refreshTokenEntity);
        await _context.SaveChangesAsync();

        return new AuthResponseDto
        {
            Token = accessToken,
            RefreshToken = refreshToken,
            Email = user.Email!,
            Role = user.Role,
            ExpiresIn = 3600
        };
    }

    public async Task<AuthResponseDto?> RefreshTokenAsync(string refreshToken)
    {
        var isValid = await _tokenService.ValidateRefreshTokenAsync(refreshToken);
        
        if (!isValid)
        {
            return null;
        }

        var tokenEntity = await _context.RefreshTokens
            .FirstOrDefaultAsync(rt => rt.Token == refreshToken);

        if (tokenEntity == null)
        {
            return null;
        }

        var user = await _userManager.FindByIdAsync(tokenEntity.UserId);
        
        if (user == null)
        {
            return null;
        }

        await _tokenService.RevokeRefreshTokenAsync(refreshToken);

        var newAccessToken = _tokenService.GenerateAccessToken(user.Id, user.Email!, user.Role);
        var newRefreshToken = _tokenService.GenerateRefreshToken();

        var newRefreshTokenEntity = new RefreshToken
        {
            Token = newRefreshToken,
            UserId = user.Id,
            ExpiryDate = DateTime.UtcNow.AddDays(7)
        };

        _context.RefreshTokens.Add(newRefreshTokenEntity);
        await _context.SaveChangesAsync();

        return new AuthResponseDto
        {
            Token = newAccessToken,
            RefreshToken = newRefreshToken,
            Email = user.Email!,
            Role = user.Role,
            ExpiresIn = 3600
        };
    }

    public async Task<UserDto?> GetUserByIdAsync(string userId)
    {
        var user = await _userManager.FindByIdAsync(userId);
        
        if (user == null)
        {
            return null;
        }

        return new UserDto
        {
            Id = user.Id,
            Email = user.Email!,
            Role = user.Role
        };
    }

    public async Task<bool> RevokeTokenAsync(string refreshToken)
    {
        var tokenEntity = await _context.RefreshTokens
            .FirstOrDefaultAsync(rt => rt.Token == refreshToken);

        if (tokenEntity == null)
        {
            return false;
        }

        _context.RefreshTokens.Remove(tokenEntity);
        await _context.SaveChangesAsync();

        return true;
    }

    // Password Reset Methods
    public async Task<bool> SendPasswordResetOtpAsync(string email)
    {
        var user = await _userManager.FindByEmailAsync(email);
        if (user == null)
        {
            // Pour des raisons de sécurité, on retourne true même si l'utilisateur n'existe pas
            return true;
        }

        // Invalider tous les OTP précédents pour cet utilisateur
        var existingOtps = await _context.PasswordResetOtps
            .Where(o => o.Email == email && !o.IsUsed)
            .ToListAsync();
        
        foreach (var existingOtp in existingOtps)
        {
            existingOtp.IsUsed = true;
        }

        // Générer un nouveau code OTP à 6 chiffres
        var otp = GenerateOtp();

        var otpEntity = new PasswordResetOtp
        {
            UserId = user.Id,
            Email = email,
            Otp = otp,
            CreatedAt = DateTime.UtcNow,
            ExpiresAt = DateTime.UtcNow.AddMinutes(10), // Valide 10 minutes
            IsUsed = false
        };

        _context.PasswordResetOtps.Add(otpEntity);
        await _context.SaveChangesAsync();

        // Envoyer l'email avec le code OTP
        return await _emailService.SendOtpEmailAsync(email, otp);
    }

    public async Task<bool> VerifyOtpAsync(string email, string otp)
    {
        var otpEntity = await _context.PasswordResetOtps
            .Where(o => o.Email == email && o.Otp == otp && !o.IsUsed && o.ExpiresAt > DateTime.UtcNow)
            .OrderByDescending(o => o.CreatedAt)
            .FirstOrDefaultAsync();

        return otpEntity != null;
    }

    public async Task<(bool Success, List<string> Errors)> ResetPasswordAsync(string email, string otp, string newPassword)
    {
        var errors = new List<string>();
        
        var otpEntity = await _context.PasswordResetOtps
            .Where(o => o.Email == email && o.Otp == otp && !o.IsUsed && o.ExpiresAt > DateTime.UtcNow)
            .OrderByDescending(o => o.CreatedAt)
            .FirstOrDefaultAsync();

        if (otpEntity == null)
        {
            errors.Add("Code OTP invalide ou expiré");
            return (false, errors);
        }

        var user = await _userManager.FindByEmailAsync(email);
        if (user == null)
        {
            errors.Add("Utilisateur non trouvé");
            return (false, errors);
        }

        // Réinitialiser le mot de passe
        var token = await _userManager.GeneratePasswordResetTokenAsync(user);
        var result = await _userManager.ResetPasswordAsync(user, token, newPassword);

        if (result.Succeeded)
        {
            // Marquer l'OTP comme utilisé
            otpEntity.IsUsed = true;
            await _context.SaveChangesAsync();
            return (true, errors);
        }

        // Collecter les erreurs de validation du mot de passe
        foreach (var error in result.Errors)
        {
            var errorMessage = error.Code switch
            {
                "PasswordTooShort" => "Le mot de passe doit contenir au moins 8 caractères",
                "PasswordRequiresDigit" => "Le mot de passe doit contenir au moins un chiffre",
                "PasswordRequiresLower" => "Le mot de passe doit contenir au moins une minuscule",
                "PasswordRequiresUpper" => "Le mot de passe doit contenir au moins une majuscule",
                "PasswordRequiresNonAlphanumeric" => "Le mot de passe doit contenir au moins un caractère spécial (!@#$%^&*)",
                _ => error.Description
            };
            errors.Add(errorMessage);
        }

        return (false, errors);
    }

    public async Task<(bool Success, List<string> Errors)> ChangePasswordAsync(string userId, string currentPassword, string newPassword)
    {
        var errors = new List<string>();

        // Trouver l'utilisateur
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null)
        {
            errors.Add("Utilisateur non trouvé");
            return (false, errors);
        }

        // Vérifier le mot de passe actuel
        var isPasswordValid = await _userManager.CheckPasswordAsync(user, currentPassword);
        if (!isPasswordValid)
        {
            errors.Add("Le mot de passe actuel est incorrect");
            return (false, errors);
        }

        // Changer le mot de passe
        var result = await _userManager.ChangePasswordAsync(user, currentPassword, newPassword);

        if (!result.Succeeded)
        {
            foreach (var error in result.Errors)
            {
                var errorMessage = error.Code switch
                {
                    "PasswordTooShort" => "Le mot de passe doit contenir au moins 8 caractères",
                    "PasswordRequiresUniqueChars" => "Le mot de passe doit contenir au moins 3 caractères uniques",
                    "PasswordRequiresLower" => "Le mot de passe doit contenir au moins une minuscule",
                    "PasswordRequiresUpper" => "Le mot de passe doit contenir au moins une majuscule",
                    "PasswordRequiresNonAlphanumeric" => "Le mot de passe doit contenir au moins un chiffre",
                    _ => error.Description
                };
                errors.Add(errorMessage);
            }
            return (false, errors);
        }

        return (true, errors);
    }

    private static string GenerateOtp()
    {
        var random = new Random();
        return random.Next(100000, 999999).ToString();
    }
}
