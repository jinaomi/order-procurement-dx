using CaseMngmt.Models.EntityKeywords;

namespace CaseMngmt.Models.Products
{
    public class ProductViewModel
    {
        public Guid Id { get; set; }
        public string? Name { get; set; }
        public string? ProductCode { get; set; }
        public decimal StockQuantity { get; set; }
        public string? UnitOfMeasure { get; set; }
        public decimal? ProductionCapacityPerDay { get; set; }
        public decimal? UnitPrice { get; set; }
        public string? Note { get; set; }
        public Guid CreatedBy { get; set; }
        public Guid UpdatedBy { get; set; }
        public DateTime CreatedDate { get; set; }
        public DateTime UpdatedDate { get; set; }
        public List<EntityKeywordValue> CustomFieldValues { get; set; } = new();
    }
}
