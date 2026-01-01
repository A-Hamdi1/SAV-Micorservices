namespace SAV.Shared.DTOs.Clients;

public class ClientDto
{
    public int Id { get; set; }
    public string UserId { get; set; } = string.Empty;
    public string Nom { get; set; } = string.Empty;
    public string Prenom { get; set; } = string.Empty;
    public string Telephone { get; set; } = string.Empty;
    public string Adresse { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

public class CreateClientDto
{
    public string Nom { get; set; } = string.Empty;
    public string Prenom { get; set; } = string.Empty;
    public string Telephone { get; set; } = string.Empty;
    public string Adresse { get; set; } = string.Empty;
}

public class CreateClientByResponsableDto
{
    public string UserId { get; set; } = string.Empty;
    public string Nom { get; set; } = string.Empty;
    public string Prenom { get; set; } = string.Empty;
    public string Telephone { get; set; } = string.Empty;
    public string Adresse { get; set; } = string.Empty;
}

public class UpdateClientDto
{
    public string Nom { get; set; } = string.Empty;
    public string Prenom { get; set; } = string.Empty;
    public string Telephone { get; set; } = string.Empty;
    public string Adresse { get; set; } = string.Empty;
}

public class ArticleAchatDto
{
    public int Id { get; set; }
    public int ClientId { get; set; }
    public int ArticleId { get; set; }
    public string ArticleNom { get; set; } = string.Empty;
    public string ArticleReference { get; set; } = string.Empty;
    public DateTime DateAchat { get; set; }
    public string NumeroSerie { get; set; } = string.Empty;
    public bool SousGarantie { get; set; }
    public int DureeGarantieJours { get; set; }
}

public class CreateArticleAchatDto
{
    public int ArticleId { get; set; }
    public DateTime DateAchat { get; set; }
    public string NumeroSerie { get; set; } = string.Empty;
}

public class UpdateArticleAchatDto
{
    public DateTime DateAchat { get; set; }
    public string NumeroSerie { get; set; } = string.Empty;
    public int DureeGarantieJours { get; set; }
}

public class ArticleAchatStatsDto
{
    public int NombreTotalArticles { get; set; }
    public int NombreArticlesSousGarantie { get; set; }
    public int NombreArticlesHorsGarantie { get; set; }
    public decimal PourcentageSousGarantie { get; set; }
    public List<ArticleAchatExpirationDto> GarantiesExpirantProchainement { get; set; } = new();
}

public class ArticleAchatExpirationDto
{
    public int Id { get; set; }
    public string ClientNom { get; set; } = string.Empty;
    public string ArticleNom { get; set; } = string.Empty;
    public string NumeroSerie { get; set; } = string.Empty;
    public DateTime DateExpiration { get; set; }
    public int JoursRestants { get; set; }
}

public class ReclamationDto
{
    public int Id { get; set; }
    public int ClientId { get; set; }
    public string? ClientUserId { get; set; }
    public string ClientNom { get; set; } = string.Empty;
    public string ClientPrenom { get; set; } = string.Empty;
    public int ArticleAchatId { get; set; }
    public string ArticleNom { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Statut { get; set; } = string.Empty;
    public DateTime DateCreation { get; set; }
    public DateTime? DateResolution { get; set; }
    public string? CommentaireResponsable { get; set; }
}

public class CreateReclamationDto
{
    public int ArticleAchatId { get; set; }
    public string Description { get; set; } = string.Empty;
}

public class UpdateReclamationStatutDto
{
    public string Statut { get; set; } = string.Empty;
    public string? CommentaireResponsable { get; set; }
}

public class ReclamationListDto
{
    public List<ReclamationDto> Items { get; set; } = new();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
}
