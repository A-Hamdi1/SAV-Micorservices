using SAV.Shared.DTOs.Auth;

namespace SAV.Auth.Application.Interfaces;

public interface IAuthService
{
    Task<AuthResponseDto?> RegisterAsync(RegisterDto registerDto);
    Task<AuthResponseDto?> LoginAsync(LoginDto loginDto);
    Task<AuthResponseDto?> RefreshTokenAsync(string refreshToken);
    Task<UserDto?> GetUserByIdAsync(string userId);
    Task<bool> RevokeTokenAsync(string refreshToken);
    
    // Password Reset
    Task<bool> SendPasswordResetOtpAsync(string email);
    Task<bool> VerifyOtpAsync(string email, string otp);
    Task<(bool Success, List<string> Errors)> ResetPasswordAsync(string email, string otp, string newPassword);
    
    // Change Password
    Task<(bool Success, List<string> Errors)> ChangePasswordAsync(string userId, string currentPassword, string newPassword);
}
