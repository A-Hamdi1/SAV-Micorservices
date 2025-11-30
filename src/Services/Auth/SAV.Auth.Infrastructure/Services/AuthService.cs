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
    private readonly AuthDbContext _context;

    public AuthService(
        UserManager<ApplicationUser> userManager,
        ITokenService tokenService,
        AuthDbContext context)
    {
        _userManager = userManager;
        _tokenService = tokenService;
        _context = context;
    }

    public async Task<AuthResponseDto?> RegisterAsync(RegisterDto registerDto)
    {
        if (registerDto.Password != registerDto.ConfirmPassword)
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
}
