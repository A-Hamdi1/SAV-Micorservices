using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SAV.Interventions.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddUserIdToTechnicien : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "UserId",
                table: "Techniciens",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "UserId",
                table: "Techniciens");
        }
    }
}
