using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace SAV.Clients.API.Filters;

/// <summary>
/// Attribut d'autorisation qui accepte SOIT une authentification JWT valide, 
/// SOIT une API Key inter-services valide.
/// Cela permet aux endpoints d'être appelés par le frontend (JWT) ou par d'autres microservices (API Key).
/// </summary>
[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method)]
public class ApiKeyAuthAttribute : Attribute, IAuthorizationFilter
{
    private const string ApiKeyHeaderName = "X-API-Key";

    public void OnAuthorization(AuthorizationFilterContext context)
    {
        // Option 1: L'utilisateur est déjà authentifié via JWT Bearer
        if (context.HttpContext.User.Identity?.IsAuthenticated == true)
        {
            return; // Autorisation accordée via JWT
        }

        // Option 2: Vérification de l'API Key pour les appels inter-services
        if (!context.HttpContext.Request.Headers.TryGetValue(ApiKeyHeaderName, out var extractedApiKey))
        {
            context.Result = new UnauthorizedObjectResult("Authentification requise (JWT ou API Key)");
            return;
        }

        var configuration = context.HttpContext.RequestServices
            .GetRequiredService<IConfiguration>();

        var apiKey = configuration["InterServiceApiKey"];

        if (string.IsNullOrWhiteSpace(apiKey) || !apiKey.Equals(extractedApiKey))
        {
            context.Result = new UnauthorizedObjectResult("API Key invalide");
            return;
        }
    }
}
