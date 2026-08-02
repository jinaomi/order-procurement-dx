using CaseMngmt.Models.EntityKeywords;

namespace CaseMngmt.Models.PurchaseInvoices
{
    public class PurchaseInvoiceViewModel
    {
        public Guid Id { get; set; }
        public Guid CompanyId { get; set; }
        public Guid SupplierId { get; set; }
        public string? SupplierName { get; set; }
        public Guid PurchaseOrderId { get; set; }
        public string? PurchaseOrderNumber { get; set; }
        public Guid? GoodsReceiptId { get; set; }
        public string PurchaseInvoiceNumber { get; set; }
        public string? SupplierInvoiceNumber { get; set; }
        public DateTime IssueDate { get; set; }
        public DateTime DueDate { get; set; }
        public decimal SubTotalAmount { get; set; }
        public decimal TaxAmount { get; set; }
        public decimal TotalAmount { get; set; }
        public string Status { get; set; }
        public DateTime? PaidDate { get; set; }
        public string? Note { get; set; }
        public DateTime CreatedDate { get; set; }
        public List<EntityKeywordValue> CustomFieldValues { get; set; } = new();
    }
}
