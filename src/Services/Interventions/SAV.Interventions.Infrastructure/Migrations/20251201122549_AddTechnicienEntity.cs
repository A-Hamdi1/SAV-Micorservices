using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SAV.Interventions.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddTechnicienEntity : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "TechnicienNom",
                table: "Interventions",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(200)",
                oldMaxLength: 200);

            migrationBuilder.AddColumn<int>(
                name: "TechnicienId",
                table: "Interventions",
                type: "int",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Techniciens",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Nom = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Prenom = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Email = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Telephone = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    Specialite = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    EstDisponible = table.Column<bool>(type: "bit", nullable: false),
                    DateEmbauche = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Techniciens", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Interventions_TechnicienId",
                table: "Interventions",
                column: "TechnicienId");

            migrationBuilder.CreateIndex(
                name: "IX_Techniciens_Email",
                table: "Techniciens",
                column: "Email",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Interventions_Techniciens_TechnicienId",
                table: "Interventions",
                column: "TechnicienId",
                principalTable: "Techniciens",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Interventions_Techniciens_TechnicienId",
                table: "Interventions");

            migrationBuilder.DropTable(
                name: "Techniciens");

            migrationBuilder.DropIndex(
                name: "IX_Interventions_TechnicienId",
                table: "Interventions");

            migrationBuilder.DropColumn(
                name: "TechnicienId",
                table: "Interventions");

            migrationBuilder.AlterColumn<string>(
                name: "TechnicienNom",
                table: "Interventions",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "nvarchar(200)",
                oldMaxLength: 200,
                oldNullable: true);
        }
    }
}
