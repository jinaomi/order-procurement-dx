namespace CaseMngmt.Models.GoodsReceipts
{
    public class GoodsReceiptCreateResult
    {
        // > 0 success, 0 = purchase order not found / save failed, -1 = business rule violation
        public int StatusCode { get; set; }
        public Guid? GoodsReceiptId { get; set; }
        public string? Message { get; set; }
        public List<string> OverDeliveryWarnings { get; set; } = new();
    }
}
