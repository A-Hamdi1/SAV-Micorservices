using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SAV.Articles.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddMouvementsStock : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAt",
                table: "PiecesDetachees",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<int>(
                name: "SeuilAlerte",
                table: "PiecesDetachees",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAt",
                table: "PiecesDetachees",
                type: "datetime2",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "MouvementsStock",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    PieceDetacheeId = table.Column<int>(type: "int", nullable: false),
                    Type = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Quantite = table.Column<int>(type: "int", nullable: false),
                    StockAvant = table.Column<int>(type: "int", nullable: false),
                    StockApres = table.Column<int>(type: "int", nullable: false),
                    Raison = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    InterventionId = table.Column<int>(type: "int", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MouvementsStock", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MouvementsStock_PiecesDetachees_PieceDetacheeId",
                        column: x => x.PieceDetacheeId,
                        principalTable: "PiecesDetachees",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_MouvementsStock_CreatedAt",
                table: "MouvementsStock",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_MouvementsStock_PieceDetacheeId",
                table: "MouvementsStock",
                column: "PieceDetacheeId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "MouvementsStock");

            migrationBuilder.DropColumn(
                name: "CreatedAt",
                table: "PiecesDetachees");

            migrationBuilder.DropColumn(
                name: "SeuilAlerte",
                table: "PiecesDetachees");

            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                table: "PiecesDetachees");
        }
    }
}
