namespace SAV.Shared.DTOs.Articles;

public class ArticleDto
{
    public int Id { get; set; }
    public string Reference { get; set; } = string.Empty;
    public string Nom { get; set; } = string.Empty;
    public string Categorie { get; set; } = string.Empty;
    public decimal PrixVente { get; set; }
    public int DureeGarantie { get; set; } // En mois
    public DateTime CreatedAt { get; set; }
}

public class CreateArticleDto
{
    public string Reference { get; set; } = string.Empty;
    public string Nom { get; set; } = string.Empty;
    public string Categorie { get; set; } = string.Empty;
    public decimal PrixVente { get; set; }
    public int DureeGarantie { get; set; }
}

public class UpdateArticleDto
{
    public string Nom { get; set; } = string.Empty;
    public string Categorie { get; set; } = string.Empty;
    public decimal PrixVente { get; set; }
    public int DureeGarantie { get; set; }
}

public class PieceDetacheeDto
{
    public int Id { get; set; }
    public int ArticleId { get; set; }
    public string Nom { get; set; } = string.Empty;
    public string Reference { get; set; } = string.Empty;
    public decimal Prix { get; set; }
    public int Stock { get; set; }
}

public class CreatePieceDetacheeDto
{
    public int ArticleId { get; set; }
    public string Nom { get; set; } = string.Empty;
    public string Reference { get; set; } = string.Empty;
    public decimal Prix { get; set; }
    public int Stock { get; set; }
}

public class ArticleListDto
{
    public List<ArticleDto> Items { get; set; } = new();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
}

public class ArticleStatsDto
{
    public int NombreTotalArticles { get; set; }
    public int NombrePiecesDetachees { get; set; }
    public decimal ValeurStockTotal { get; set; }
    public decimal PrixMoyenArticle { get; set; }
    public List<ArticleCategoryStatsDto> ParCategorie { get; set; } = new();
    public List<ArticleTopDto> ArticlesLesPlusVendus { get; set; } = new();
}

public class ArticleCategoryStatsDto
{
    public string Categorie { get; set; } = string.Empty;
    public int Nombre { get; set; }
    public decimal PrixMoyen { get; set; }
}

public class ArticleTopDto
{
    public int Id { get; set; }
    public string Nom { get; set; } = string.Empty;
    public string Reference { get; set; } = string.Empty;
    public string Categorie { get; set; } = string.Empty;
    public int NombreVentes { get; set; }
}
