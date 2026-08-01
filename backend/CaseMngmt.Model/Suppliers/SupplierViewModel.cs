using CaseMngmt.Models.EntityKeywords;

namespace CaseMngmt.Models.Suppliers
{
    public class SupplierViewModel
    {
        public Guid Id { get; set; }
        public string? Name { get; set; }
        public string? ContactName { get; set; }
        public string? PhoneNumber { get; set; }
        public string? PostCode1 { get; set; }
        public string? PostCode2 { get; set; }
        public string? StateProvince { get; set; }
        public string? City { get; set; }
        public string? Street { get; set; }
        public string? BuildingName { get; set; }
        public string? RoomNumber { get; set; }
        public int ClosingDay { get; set; }
        public int PaymentCycleMonths { get; set; }
        public int PaymentDay { get; set; }
        public string? Note { get; set; }
        public Guid CreatedBy { get; set; }
        public Guid UpdatedBy { get; set; }
        public DateTime CreatedDate { get; set; }
        public DateTime UpdatedDate { get; set; }
        public List<EntityKeywordValue> CustomFieldValues { get; set; } = new();
    }
}
