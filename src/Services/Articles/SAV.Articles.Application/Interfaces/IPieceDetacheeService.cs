using SAV.Shared.DTOs.Articles;

namespace SAV.Articles.Application.Interfaces;

public interface IPieceDetacheeService
{
    Task<PieceDetacheeDto> CreatePieceDetacheeAsync(CreatePieceDetacheeDto dto);
    Task<PieceDetacheeDto?> GetPieceDetacheeByIdAsync(int id);
}
