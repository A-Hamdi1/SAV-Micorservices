using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace SAV.Clients.API.Filters;

/// <summary>
/// Attribut d'autorisation qui accepte soit un JWT Bearer token soit une API Key
/// Utile pour les endpoints qui doivent être accessibles à la fois par les utilisateurs authentifiés
/// et par les appels inter-services
/// </summary>
[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method)]
public class AllowApiKeyOrJwtAttribute : Attribute, IAuthorizationFilter
{
    private const string ApiKeyHeaderName = "X-API-Key";

    public void OnAuthorization(AuthorizationFilterContext context)
    {
        // Vérifier d'abord si l'utilisateur est authentifié via JWT
        if (context.HttpContext.User.Identity?.IsAuthenticated == true)
        {
            // JWT valide, autoriser l'accès
            return;
        }

        // Sinon, vérifier l'API Key
        if (!context.HttpContext.Request.Headers.TryGetValue(ApiKeyHeaderName, out var extractedApiKey))
        {
            context.Result = new UnauthorizedObjectResult(new
            {
                Success = false,
                Message = "Authentification requise : JWT Bearer token ou API Key"
            });
            return;
        }

        var configuration = context.HttpContext.RequestServices
            .GetRequiredService<IConfiguration>();

        var apiKey = configuration["InterServiceApiKey"];

        if (string.IsNullOrWhiteSpace(apiKey) || !apiKey.Equals(extractedApiKey))
        {
            context.Result = new UnauthorizedObjectResult(new
            {
                Success = false,
                Message = "API Key invalide"
            });
            return;
        }

        // API Key valide, autoriser l'accès
    }
}
