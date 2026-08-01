namespace CaseMngmt.Models.GoodsReceipts
{
    public class GoodsReceiptExtractionResult
    {
        public DateTime? ReceivedDateGuess { get; set; }
        public List<GoodsReceiptExtractionItem> Items { get; set; } = new();
    }

    public class GoodsReceiptExtractionItem
    {
        public string ProductNameRaw { get; set; } = string.Empty;
        public Guid? ProductIdMatch { get; set; }
        public Guid? PurchaseOrderItemIdMatch { get; set; }
        public decimal ReceivedQuantity { get; set; }
        public double Confidence { get; set; }
    }
}
