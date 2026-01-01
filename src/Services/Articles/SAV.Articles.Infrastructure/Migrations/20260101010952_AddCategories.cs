using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SAV.Articles.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddCategories : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "Categorie",
                table: "Articles",
                newName: "CategorieNom");

            migrationBuilder.AddColumn<int>(
                name: "CategorieId",
                table: "Articles",
                type: "int",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Categories",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Nom = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Categories", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Articles_CategorieId",
                table: "Articles",
                column: "CategorieId");

            migrationBuilder.CreateIndex(
                name: "IX_Categories_Nom",
                table: "Categories",
                column: "Nom",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Articles_Categories_CategorieId",
                table: "Articles",
                column: "CategorieId",
                principalTable: "Categories",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Articles_Categories_CategorieId",
                table: "Articles");

            migrationBuilder.DropTable(
                name: "Categories");

            migrationBuilder.DropIndex(
                name: "IX_Articles_CategorieId",
                table: "Articles");

            migrationBuilder.DropColumn(
                name: "CategorieId",
                table: "Articles");

            migrationBuilder.RenameColumn(
                name: "CategorieNom",
                table: "Articles",
                newName: "Categorie");
        }
    }
}
