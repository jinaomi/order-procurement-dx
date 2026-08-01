namespace CaseMngmt.Models.GoodsReceipts
{
    public class GoodsReceiptItemViewModel
    {
        public Guid Id { get; set; }
        public Guid GoodsReceiptId { get; set; }
        public Guid PurchaseOrderItemId { get; set; }
        public Guid? ProductId { get; set; }
        public string ProductNameRaw { get; set; }
        public decimal ReceivedQuantity { get; set; }
        public string? Note { get; set; }
    }
}
