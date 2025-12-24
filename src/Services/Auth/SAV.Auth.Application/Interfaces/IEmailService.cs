namespace SAV.Auth.Application.Interfaces;

public interface IEmailService
{
    Task<bool> SendOtpEmailAsync(string email, string otp);
}
