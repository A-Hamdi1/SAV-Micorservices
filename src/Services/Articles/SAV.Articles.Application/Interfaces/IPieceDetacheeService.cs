using SAV.Shared.DTOs.Articles;

namespace SAV.Articles.Application.Interfaces;

public interface IPieceDetacheeService
{
    Task<PieceDetacheeDto> CreatePieceDetacheeAsync(CreatePieceDetacheeDto dto);
    Task<PieceDetacheeDto?> GetPieceDetacheeByIdAsync(int id);
    Task<IEnumerable<PieceDetacheeDto>> GetAllPiecesDetacheesAsync();
    Task<IEnumerable<PieceDetacheeDto>> GetPiecesDetacheesByArticleIdAsync(int articleId);
    Task<PieceDetacheeDto?> UpdatePieceDetacheeAsync(int id, UpdatePieceDetacheeDto dto);
    Task<bool> DeletePieceDetacheeAsync(int id);
    Task<bool> ReduceStockAsync(int pieceId, int quantite);
    Task<bool> AddStockAsync(int pieceId, int quantite);
    Task<IEnumerable<PieceDetacheeDto>> GetPiecesLowStockAsync(int seuil = 10);
    Task<IEnumerable<MouvementStockDto>> GetMouvementsStockAsync(int pieceId);
    Task<StockStatsDto> GetStockStatsAsync();
}
