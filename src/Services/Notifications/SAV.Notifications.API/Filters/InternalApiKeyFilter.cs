using SAV.Shared.Common;

namespace SAV.Notifications.API.Filters;

public class InternalApiKeyFilter : IEndpointFilter
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<InternalApiKeyFilter> _logger;

    public InternalApiKeyFilter(IConfiguration configuration, ILogger<InternalApiKeyFilter> logger)
    {
        _configuration = configuration;
        _logger = logger;
    }

    public async ValueTask<object?> InvokeAsync(EndpointFilterInvocationContext context, EndpointFilterDelegate next)
    {
        var httpContext = context.HttpContext;
        
        if (!httpContext.Request.Headers.TryGetValue(ApiKeyConstants.HeaderName, out var providedApiKey))
        {
            _logger.LogWarning("API Key header missing for internal endpoint");
            return Results.Unauthorized();
        }

        var validApiKey = _configuration["ApiKeys:Internal"];
        
        if (string.IsNullOrEmpty(validApiKey) || providedApiKey != validApiKey)
        {
            _logger.LogWarning("Invalid API Key provided for internal endpoint");
            return Results.Unauthorized();
        }

        return await next(context);
    }
}

public class InternalApiKeyAttribute : Attribute
{
}
