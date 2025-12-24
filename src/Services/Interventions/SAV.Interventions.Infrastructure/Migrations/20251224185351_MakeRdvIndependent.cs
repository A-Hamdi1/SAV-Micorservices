using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SAV.Interventions.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class MakeRdvIndependent : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<int>(
                name: "ReclamationId",
                table: "DemandesRdv",
                type: "int",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "int");

            migrationBuilder.AddColumn<string>(
                name: "Motif",
                table: "DemandesRdv",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Motif",
                table: "DemandesRdv");

            migrationBuilder.AlterColumn<int>(
                name: "ReclamationId",
                table: "DemandesRdv",
                type: "int",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "int",
                oldNullable: true);
        }
    }
}
