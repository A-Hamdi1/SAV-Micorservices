namespace SAV.Interventions.Application.Interfaces;

public interface IArticlesApiClient
{
    Task<PieceDetacheeApiDto?> GetPieceDetacheeByIdAsync(int pieceDetacheeId);
}

public class PieceDetacheeApiDto
{
    public int Id { get; set; }
    public string Nom { get; set; } = string.Empty;
    public string Reference { get; set; } = string.Empty;
    public decimal Prix { get; set; }
    public int Stock { get; set; }
}
