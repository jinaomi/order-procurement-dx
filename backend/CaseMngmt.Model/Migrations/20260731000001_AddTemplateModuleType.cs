using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CaseMngmt.Models.Migrations
{
    public partial class AddTemplateModuleType : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ModuleType",
                table: "Template",
                type: "nvarchar(30)",
                maxLength: 30,
                nullable: false,
                defaultValue: "Case");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ModuleType",
                table: "Template");
        }
    }
}
