namespace CaseMngmt.Models.GoodsReceipts
{
    public class GoodsReceiptViewModel
    {
        public Guid Id { get; set; }
        public Guid CompanyId { get; set; }
        public Guid PurchaseOrderId { get; set; }
        public string? PurchaseOrderNumber { get; set; }
        public Guid SupplierId { get; set; }
        public string? SupplierName { get; set; }
        public string GoodsReceiptNumber { get; set; }
        public DateTime ReceivedDate { get; set; }
        public string SourceType { get; set; }
        public string? SourceDocumentPath { get; set; }
        public string? Note { get; set; }
        public Guid CreatedBy { get; set; }
        public Guid UpdatedBy { get; set; }
        public DateTime CreatedDate { get; set; }
        public DateTime UpdatedDate { get; set; }
        public List<GoodsReceiptItemViewModel> GoodsReceiptItems { get; set; } = new List<GoodsReceiptItemViewModel>();
    }
}
