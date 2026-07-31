using CaseMngmt.Models.EntityKeywords;
using System.ComponentModel.DataAnnotations;

namespace CaseMngmt.Models.Products
{
    public class ProductRequest : UpdateByModel
    {
        [Required]
        [MaxLength(256)]
        public string Name { get; set; }

        [MaxLength(100)]
        public string? ProductCode { get; set; }

        [Required]
        public decimal StockQuantity { get; set; }

        [MaxLength(20)]
        public string? UnitOfMeasure { get; set; }

        public decimal? ProductionCapacityPerDay { get; set; }

        public decimal? UnitPrice { get; set; }

        [MaxLength(1000)]
        public string? Note { get; set; }

        [Required]
        public Guid CompanyId { get; set; }

        public List<EntityKeywordValueRequest> CustomFieldValues { get; set; } = new();
    }
}
