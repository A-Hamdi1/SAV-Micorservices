using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SAV.Messaging.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Conversations",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ParticipantUserId = table.Column<string>(type: "nvarchar(450)", maxLength: 450, nullable: false),
                    ParticipantNom = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    ParticipantRole = table.Column<int>(type: "int", nullable: false),
                    ResponsableUserId = table.Column<string>(type: "nvarchar(450)", maxLength: 450, nullable: false),
                    ResponsableNom = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Sujet = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    ReclamationId = table.Column<int>(type: "int", nullable: true),
                    InterventionId = table.Column<int>(type: "int", nullable: true),
                    DateCreation = table.Column<DateTime>(type: "datetime2", nullable: false),
                    DernierMessageDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    DernierMessageApercu = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    EstArchivee = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Conversations", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Messages",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ConversationId = table.Column<int>(type: "int", nullable: false),
                    ExpediteurUserId = table.Column<string>(type: "nvarchar(450)", maxLength: 450, nullable: false),
                    ExpediteurNom = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Contenu = table.Column<string>(type: "nvarchar(4000)", maxLength: 4000, nullable: false),
                    DateEnvoi = table.Column<DateTime>(type: "datetime2", nullable: false),
                    EstLu = table.Column<bool>(type: "bit", nullable: false),
                    DateLecture = table.Column<DateTime>(type: "datetime2", nullable: true),
                    Type = table.Column<int>(type: "int", nullable: false),
                    PieceJointeUrl = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    PieceJointeNom = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Messages", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Messages_Conversations_ConversationId",
                        column: x => x.ConversationId,
                        principalTable: "Conversations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Conversations_DernierMessageDate",
                table: "Conversations",
                column: "DernierMessageDate");

            migrationBuilder.CreateIndex(
                name: "IX_Conversations_ParticipantUserId",
                table: "Conversations",
                column: "ParticipantUserId");

            migrationBuilder.CreateIndex(
                name: "IX_Conversations_ParticipantUserId_EstArchivee",
                table: "Conversations",
                columns: new[] { "ParticipantUserId", "EstArchivee" });

            migrationBuilder.CreateIndex(
                name: "IX_Conversations_ResponsableUserId",
                table: "Conversations",
                column: "ResponsableUserId");

            migrationBuilder.CreateIndex(
                name: "IX_Conversations_ResponsableUserId_EstArchivee",
                table: "Conversations",
                columns: new[] { "ResponsableUserId", "EstArchivee" });

            migrationBuilder.CreateIndex(
                name: "IX_Messages_ConversationId",
                table: "Messages",
                column: "ConversationId");

            migrationBuilder.CreateIndex(
                name: "IX_Messages_ConversationId_EstLu",
                table: "Messages",
                columns: new[] { "ConversationId", "EstLu" });

            migrationBuilder.CreateIndex(
                name: "IX_Messages_DateEnvoi",
                table: "Messages",
                column: "DateEnvoi");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Messages");

            migrationBuilder.DropTable(
                name: "Conversations");
        }
    }
}
