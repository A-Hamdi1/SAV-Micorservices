using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace SAV.Notifications.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Notifications",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ClientId = table.Column<int>(type: "int", nullable: true),
                    Email = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Sujet = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Corps = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Type = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Statut = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    ReferenceType = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ReferenceId = table.Column<int>(type: "int", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    SentAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ErrorMessage = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    RetryCount = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Notifications", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "NotificationTemplates",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Type = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Sujet = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CorpsHtml = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_NotificationTemplates", x => x.Id);
                });

            migrationBuilder.InsertData(
                table: "NotificationTemplates",
                columns: new[] { "Id", "CorpsHtml", "CreatedAt", "IsActive", "Sujet", "Type", "UpdatedAt" },
                values: new object[,]
                {
                    { 1, "\r\n                    <h1>Bienvenue {{ClientNom}}!</h1>\r\n                    <p>Merci de vous être inscrit sur notre plateforme SAV.</p>\r\n                    <p>Vous pouvez maintenant gérer vos articles et créer des réclamations.</p>\r\n                ", new DateTime(2025, 12, 14, 18, 48, 24, 899, DateTimeKind.Utc).AddTicks(2141), true, "Bienvenue chez SAV Pro!", "Bienvenue", null },
                    { 2, "\r\n                    <h1>Bonjour {{ClientNom}},</h1>\r\n                    <p>Votre réclamation #{{ReclamationId}} pour l'article <strong>{{ArticleNom}}</strong> a été créée avec succès.</p>\r\n                    <p>Notre équipe va traiter votre demande dans les plus brefs délais.</p>\r\n                ", new DateTime(2025, 12, 14, 18, 48, 24, 899, DateTimeKind.Utc).AddTicks(2146), true, "Réclamation #{{ReclamationId}} créée", "ReclamationCreee", null },
                    { 3, "\r\n                    <h1>Bonjour {{ClientNom}},</h1>\r\n                    <p>Le statut de votre réclamation #{{ReclamationId}} a été mis à jour.</p>\r\n                    <p><strong>Nouveau statut:</strong> {{Statut}}</p>\r\n                ", new DateTime(2025, 12, 14, 18, 48, 24, 899, DateTimeKind.Utc).AddTicks(2149), true, "Mise à jour réclamation #{{ReclamationId}}", "ReclamationStatutChange", null },
                    { 4, "\r\n                    <h1>Bonjour {{ClientNom}},</h1>\r\n                    <p>Une intervention a été planifiée pour votre réclamation.</p>\r\n                    <p><strong>Date:</strong> {{DateIntervention}}</p>\r\n                    <p>Un technicien vous contactera prochainement.</p>\r\n                ", new DateTime(2025, 12, 14, 18, 48, 24, 899, DateTimeKind.Utc).AddTicks(2151), true, "Intervention planifiée - {{DateIntervention}}", "InterventionPlanifiee", null },
                    { 5, "\r\n                    <h1>Bonjour {{ClientNom}},</h1>\r\n                    <p>L'intervention pour votre réclamation #{{ReclamationId}} est terminée.</p>\r\n                    <p>Merci de votre confiance!</p>\r\n                ", new DateTime(2025, 12, 14, 18, 48, 24, 899, DateTimeKind.Utc).AddTicks(2152), true, "Intervention terminée - Réclamation #{{ReclamationId}}", "InterventionTerminee", null },
                    { 6, "\r\n                    <h1>Bonjour {{ClientNom}},</h1>\r\n                    <p>Nous avons bien reçu votre paiement de <strong>{{Montant}}€</strong>.</p>\r\n                    <p>Merci pour votre règlement!</p>\r\n                ", new DateTime(2025, 12, 14, 18, 48, 24, 899, DateTimeKind.Utc).AddTicks(2154), true, "Paiement reçu - {{Montant}}€", "PaiementRecu", null },
                    { 7, "\r\n                    <h1>Bonjour {{ClientNom}},</h1>\r\n                    <p>La garantie de votre article <strong>{{ArticleNom}}</strong> expire le <strong>{{DateExpiration}}</strong>.</p>\r\n                    <p>Pensez à vérifier votre équipement avant cette date.</p>\r\n                ", new DateTime(2025, 12, 14, 18, 48, 24, 899, DateTimeKind.Utc).AddTicks(2155), true, "Votre garantie expire bientôt!", "GarantieExpiration", null },
                    { 8, "\r\n                    <h1>Bonjour {{ClientNom}},</h1>\r\n                    <p>Nous vous rappelons qu'une facture de <strong>{{Montant}}€</strong> est en attente de paiement.</p>\r\n                    <p>Merci de régulariser votre situation.</p>\r\n                ", new DateTime(2025, 12, 14, 18, 48, 24, 899, DateTimeKind.Utc).AddTicks(2157), true, "Rappel: Facture en attente de paiement", "RappelPaiement", null }
                });

            migrationBuilder.CreateIndex(
                name: "IX_Notifications_ClientId",
                table: "Notifications",
                column: "ClientId");

            migrationBuilder.CreateIndex(
                name: "IX_Notifications_Statut",
                table: "Notifications",
                column: "Statut");

            migrationBuilder.CreateIndex(
                name: "IX_NotificationTemplates_Type",
                table: "NotificationTemplates",
                column: "Type",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Notifications");

            migrationBuilder.DropTable(
                name: "NotificationTemplates");
        }
    }
}
