namespace CaseMngmt.Models.PurchaseOrders
{
    public class PurchaseOrderExtractionResult
    {
        public string? SupplierNameGuess { get; set; }
        public double SupplierNameConfidence { get; set; } = 0.5;
        public Guid? SupplierIdMatch { get; set; }
        public DateTime? OrderDateGuess { get; set; }
        public DateTime? ExpectedDeliveryDateGuess { get; set; }
        public List<PurchaseOrderExtractionItem> Items { get; set; } = new();
    }

    public class PurchaseOrderExtractionItem
    {
        public string ProductNameRaw { get; set; } = string.Empty;
        public Guid? ProductIdMatch { get; set; }
        public decimal Quantity { get; set; }
        public decimal? UnitPrice { get; set; }
        public double Confidence { get; set; }
    }
}
