namespace SAV.Shared.DTOs.Articles;

public record CategorieDto(
    int Id,
    string Nom,
    string? Description,
    DateTime CreatedAt,
    int ArticlesCount
);

public record CreateCategorieDto(
    string Nom,
    string? Description
);

public record UpdateCategorieDto(
    string Nom,
    string? Description
);
