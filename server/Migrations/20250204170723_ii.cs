using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace server.Migrations
{
    /// <inheritdoc />
    public partial class ii : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<byte[]>(
                name: "RowVersion",
                table: "Slides",
                type: "varbinary(8)",
                nullable: false, // не допускаем null
                defaultValue: new byte[] { 0, 0, 0, 0, 0, 0, 0, 0 }, // <-- DEFAULT
                rowVersion: true // для EF (оптимистическая блокировка)
            );
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "RowVersion",
                table: "Slides");
        }
    }
}
