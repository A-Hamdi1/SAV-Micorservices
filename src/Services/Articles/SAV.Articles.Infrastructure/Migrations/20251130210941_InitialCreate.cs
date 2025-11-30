using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SAV.Articles.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Articles",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Reference = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Nom = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Categorie = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    PrixVente = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    DureeGarantie = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Articles", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "PiecesDetachees",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ArticleId = table.Column<int>(type: "int", nullable: false),
                    Nom = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Reference = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Prix = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Stock = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PiecesDetachees", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PiecesDetachees_Articles_ArticleId",
                        column: x => x.ArticleId,
                        principalTable: "Articles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Articles_Reference",
                table: "Articles",
                column: "Reference",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PiecesDetachees_ArticleId",
                table: "PiecesDetachees",
                column: "ArticleId");

            migrationBuilder.CreateIndex(
                name: "IX_PiecesDetachees_Reference",
                table: "PiecesDetachees",
                column: "Reference");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "PiecesDetachees");

            migrationBuilder.DropTable(
                name: "Articles");
        }
    }
}
