using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SAV.Interventions.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddEvaluationsAndRdv : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "CreneauxDisponibles",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TechnicienId = table.Column<int>(type: "int", nullable: false),
                    DateDebut = table.Column<DateTime>(type: "datetime2", nullable: false),
                    DateFin = table.Column<DateTime>(type: "datetime2", nullable: false),
                    EstReserve = table.Column<bool>(type: "bit", nullable: false),
                    InterventionId = table.Column<int>(type: "int", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CreneauxDisponibles", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CreneauxDisponibles_Interventions_InterventionId",
                        column: x => x.InterventionId,
                        principalTable: "Interventions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_CreneauxDisponibles_Techniciens_TechnicienId",
                        column: x => x.TechnicienId,
                        principalTable: "Techniciens",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Evaluations",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    InterventionId = table.Column<int>(type: "int", nullable: false),
                    ClientId = table.Column<int>(type: "int", nullable: false),
                    Note = table.Column<int>(type: "int", nullable: false),
                    Commentaire = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    RecommandeTechnicien = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Evaluations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Evaluations_Interventions_InterventionId",
                        column: x => x.InterventionId,
                        principalTable: "Interventions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "DemandesRdv",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ReclamationId = table.Column<int>(type: "int", nullable: false),
                    ClientId = table.Column<int>(type: "int", nullable: false),
                    CreneauId = table.Column<int>(type: "int", nullable: true),
                    DateSouhaitee = table.Column<DateTime>(type: "datetime2", nullable: true),
                    PreferenceMoment = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    Statut = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Commentaire = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    TraiteeAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DemandesRdv", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DemandesRdv_CreneauxDisponibles_CreneauId",
                        column: x => x.CreneauId,
                        principalTable: "CreneauxDisponibles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_CreneauxDisponibles_EstReserve",
                table: "CreneauxDisponibles",
                column: "EstReserve");

            migrationBuilder.CreateIndex(
                name: "IX_CreneauxDisponibles_InterventionId",
                table: "CreneauxDisponibles",
                column: "InterventionId");

            migrationBuilder.CreateIndex(
                name: "IX_CreneauxDisponibles_TechnicienId_DateDebut",
                table: "CreneauxDisponibles",
                columns: new[] { "TechnicienId", "DateDebut" });

            migrationBuilder.CreateIndex(
                name: "IX_DemandesRdv_ClientId",
                table: "DemandesRdv",
                column: "ClientId");

            migrationBuilder.CreateIndex(
                name: "IX_DemandesRdv_CreneauId",
                table: "DemandesRdv",
                column: "CreneauId");

            migrationBuilder.CreateIndex(
                name: "IX_DemandesRdv_ReclamationId",
                table: "DemandesRdv",
                column: "ReclamationId");

            migrationBuilder.CreateIndex(
                name: "IX_DemandesRdv_Statut",
                table: "DemandesRdv",
                column: "Statut");

            migrationBuilder.CreateIndex(
                name: "IX_Evaluations_ClientId",
                table: "Evaluations",
                column: "ClientId");

            migrationBuilder.CreateIndex(
                name: "IX_Evaluations_InterventionId",
                table: "Evaluations",
                column: "InterventionId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "DemandesRdv");

            migrationBuilder.DropTable(
                name: "Evaluations");

            migrationBuilder.DropTable(
                name: "CreneauxDisponibles");
        }
    }
}
