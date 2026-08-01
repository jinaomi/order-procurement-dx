using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CaseMngmt.Models.Migrations
{
    public partial class AddSupplierModule : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Supplier",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CompanyId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ContactName = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    PhoneNumber = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    PostCode1 = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    PostCode2 = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    StateProvince = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    City = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    Street = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    BuildingName = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    RoomNumber = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    ClosingDay = table.Column<int>(type: "int", nullable: false, defaultValue: 99),
                    PaymentCycleMonths = table.Column<int>(type: "int", nullable: false, defaultValue: 1),
                    PaymentDay = table.Column<int>(type: "int", nullable: false, defaultValue: 99),
                    Note = table.Column<string>(type: "nvarchar(3000)", maxLength: 3000, nullable: true),
                    Name = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: false),
                    CreatedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UpdatedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CreatedDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Deleted = table.Column<bool>(type: "bit", nullable: false, defaultValue: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Supplier", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Supplier_Company_CompanyId",
                        column: x => x.CompanyId,
                        principalTable: "Company",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Supplier_CompanyId",
                table: "Supplier",
                column: "CompanyId");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Supplier");
        }
    }
}
