using System.ComponentModel.DataAnnotations;

namespace CaseMngmt.Models.Suppliers
{
    public class Supplier : BaseModel
    {
        [Required]
        public Guid CompanyId { get; set; }

        [MaxLength(256)]
        public string? ContactName { get; set; }

        [MaxLength(20)]
        public string? PhoneNumber { get; set; }

        [MaxLength(50)]
        public string? PostCode1 { get; set; }

        [MaxLength(50)]
        public string? PostCode2 { get; set; }

        [MaxLength(256)]
        public string? StateProvince { get; set; }

        [MaxLength(256)]
        public string? City { get; set; }

        [MaxLength(256)]
        public string? Street { get; set; }

        [MaxLength(256)]
        public string? BuildingName { get; set; }

        [MaxLength(50)]
        public string? RoomNumber { get; set; }

        [Required]
        public int ClosingDay { get; set; } = 99;

        [Required]
        public int PaymentCycleMonths { get; set; } = 1;

        [Required]
        public int PaymentDay { get; set; } = 99;

        [MaxLength(3000)]
        public string? Note { get; set; }
    }
}
