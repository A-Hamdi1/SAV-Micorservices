using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SAV.Payments.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddClientUserId : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ClientUserId",
                table: "Payments",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ClientUserId",
                table: "Payments");
        }
    }
}
