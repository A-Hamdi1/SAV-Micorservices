namespace SAV.Shared.DTOs.Articles;

public class ArticleDto
{
    public int Id { get; set; }
    public string Reference { get; set; } = string.Empty;
    public string Nom { get; set; } = string.Empty;
    public int? CategorieId { get; set; }
    public string Categorie { get; set; } = string.Empty;
    public decimal PrixVente { get; set; }
    public int DureeGarantie { get; set; } // En mois
    public DateTime CreatedAt { get; set; }
}

public class CreateArticleDto
{
    public string Reference { get; set; } = string.Empty;
    public string Nom { get; set; } = string.Empty;
    public int? CategorieId { get; set; }
    public string Categorie { get; set; } = string.Empty;
    public decimal PrixVente { get; set; }
    public int DureeGarantie { get; set; }
}

public class UpdateArticleDto
{
    public string Nom { get; set; } = string.Empty;
    public int? CategorieId { get; set; }
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
    public bool EstEnAlerte { get; set; } // Calculé: Stock <= SeuilAlerte
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

public class UpdatePieceDetacheeDto
{
    public string? Nom { get; set; }
    public string? Reference { get; set; }
    public decimal? Prix { get; set; }
    public int? SeuilAlerte { get; set; }
}

public class MouvementStockDto
{
    public int Id { get; set; }
    public int PieceDetacheeId { get; set; }
    public string NomPiece { get; set; } = string.Empty;
    public string TypeMouvement { get; set; } = string.Empty; // Entree, Sortie, Ajustement
    public int Quantite { get; set; }
    public int StockAvant { get; set; }
    public int StockApres { get; set; }
    public string? Raison { get; set; }
    public int? InterventionId { get; set; }
    public DateTime DateMouvement { get; set; }
}

public class StockStatsDto
{
    public int TotalPieces { get; set; }
    public int TotalStockItems { get; set; }
    public decimal ValeurTotaleStock { get; set; }
    public int PiecesEnAlerte { get; set; }
    public int PiecesRuptureStock { get; set; }
    public List<TopPieceDto> PiecesLesPlusUtilisees { get; set; } = new();
    public List<PieceAlerteDto> PiecesEnAlerteDetails { get; set; } = new();
    public List<MouvementStockRecentDto> MouvementsRecents { get; set; } = new();
}

public class TopPieceDto
{
    public int Id { get; set; }
    public string Nom { get; set; } = string.Empty;
    public string Reference { get; set; } = string.Empty;
    public int NombreUtilisations { get; set; }
    public int StockActuel { get; set; }
}

public class PieceAlerteDto
{
    public int Id { get; set; }
    public string Nom { get; set; } = string.Empty;
    public string Reference { get; set; } = string.Empty;
    public int Stock { get; set; }
    public int SeuilAlerte { get; set; }
    public int ArticleId { get; set; }
    public string ArticleNom { get; set; } = string.Empty;
}

public class MouvementStockRecentDto
{
    public int Id { get; set; }
    public string PieceNom { get; set; } = string.Empty;
    public string TypeMouvement { get; set; } = string.Empty;
    public int Quantite { get; set; }
    public DateTime DateMouvement { get; set; }
}
