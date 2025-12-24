using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using SAV.Auth.Application.Interfaces;
using System.Net;
using System.Net.Mail;

namespace SAV.Auth.Infrastructure.Services;

public class EmailService : IEmailService
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<EmailService> _logger;

    public EmailService(IConfiguration configuration, ILogger<EmailService> logger)
    {
        _configuration = configuration;
        _logger = logger;
    }

    public async Task<bool> SendOtpEmailAsync(string email, string otp)
    {
        try
        {
            var smtpHost = _configuration["Smtp:Host"] ?? "smtp.gmail.com";
            var smtpPort = int.Parse(_configuration["Smtp:Port"] ?? "587");
            var smtpUser = _configuration["Smtp:User"] ?? "";
            var smtpPassword = _configuration["Smtp:Password"] ?? "";
            var fromEmail = _configuration["Smtp:FromEmail"] ?? smtpUser;
            var fromName = _configuration["Smtp:FromName"] ?? "SAV Pro";

            using var client = new SmtpClient(smtpHost, smtpPort)
            {
                Credentials = new NetworkCredential(smtpUser, smtpPassword),
                EnableSsl = true
            };

            var htmlBody = $@"
<!DOCTYPE html>
<html>
<head>
    <meta charset='utf-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; }}
        .container {{ max-width: 600px; margin: 20px auto; padding: 30px; background-color: #ffffff; border-radius: 10px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }}
        h1 {{ color: #2563eb; margin-bottom: 20px; }}
        .otp-box {{ background-color: #f0f7ff; border: 2px dashed #2563eb; border-radius: 8px; padding: 20px; text-align: center; margin: 25px 0; }}
        .otp-code {{ font-size: 36px; font-weight: bold; color: #2563eb; letter-spacing: 8px; }}
        .warning {{ color: #dc2626; font-size: 14px; margin-top: 20px; }}
        .footer {{ margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; text-align: center; }}
    </style>
</head>
<body>
    <div class='container'>
        <h1>🔐 Réinitialisation de mot de passe</h1>
        <p>Bonjour,</p>
        <p>Vous avez demandé la réinitialisation de votre mot de passe. Voici votre code de vérification :</p>
        
        <div class='otp-box'>
            <div class='otp-code'>{otp}</div>
        </div>
        
        <p>Ce code est valable pendant <strong>10 minutes</strong>.</p>
        
        <p class='warning'>⚠️ Si vous n'avez pas demandé cette réinitialisation, veuillez ignorer cet email. Votre mot de passe restera inchangé.</p>
        
        <div class='footer'>
            <p>Cet email a été envoyé automatiquement par SAV Pro.</p>
            <p>© {DateTime.Now.Year} SAV Pro - Service Après-Vente</p>
        </div>
    </div>
</body>
</html>";

            var message = new MailMessage
            {
                From = new MailAddress(fromEmail, fromName),
                Subject = "🔐 Code de réinitialisation de mot de passe - SAV Pro",
                Body = htmlBody,
                IsBodyHtml = true
            };
            message.To.Add(email);

            await client.SendMailAsync(message);
            _logger.LogInformation("OTP email envoyé à {Email}", email);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erreur lors de l'envoi de l'OTP à {Email}", email);
            return false;
        }
    }
}
