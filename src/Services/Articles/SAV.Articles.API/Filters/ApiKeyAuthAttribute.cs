using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace SAV.Articles.API.Filters;

[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method)]
public class ApiKeyAuthAttribute : Attribute, IAuthorizationFilter
{
    private const string ApiKeyHeaderName = "X-API-Key";

    public void OnAuthorization(AuthorizationFilterContext context)
    {
        // Check if user is already authenticated via JWT
        if (context.HttpContext.User.Identity?.IsAuthenticated == true)
        {
            return; // Allow access - user has valid JWT
        }

        // Otherwise, check for API Key
        if (!context.HttpContext.Request.Headers.TryGetValue(ApiKeyHeaderName, out var extractedApiKey))
        {
            context.Result = new UnauthorizedObjectResult("Authentication required (JWT or API Key)");
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
