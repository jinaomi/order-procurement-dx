namespace CaseMngmt.Models.PurchaseOrders
{
    public class PurchaseOrderItemViewModel
    {
        public Guid Id { get; set; }
        public Guid PurchaseOrderId { get; set; }
        public Guid? ProductId { get; set; }
        public string ProductNameRaw { get; set; }
        public decimal Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal LineAmount { get; set; }
        public decimal ReceivedQuantity { get; set; }
        public string? Note { get; set; }
    }
}
