using CaseMngmt.Models.GoodsReceipts;
using CaseMngmt.Models.PurchaseOrders;
using CaseMngmt.Models.Suppliers;
using System.ComponentModel.DataAnnotations;

namespace CaseMngmt.Models.PurchaseInvoices
{
    public class PurchaseInvoice : BaseModel
    {
        [Required]
        public Guid CompanyId { get; set; }

        [Required]
        public Guid SupplierId { get; set; }

        [Required]
        public Guid PurchaseOrderId { get; set; }

        public Guid? GoodsReceiptId { get; set; }

        [MaxLength(50)]
        public string PurchaseInvoiceNumber { get; set; }

        [MaxLength(100)]
        public string? SupplierInvoiceNumber { get; set; }

        [Required]
        public DateTime IssueDate { get; set; }

        [Required]
        public DateTime DueDate { get; set; }

        public decimal SubTotalAmount { get; set; }

        public decimal TaxAmount { get; set; }

        public decimal TotalAmount { get; set; }

        [Required]
        [MaxLength(50)]
        public string Status { get; set; } = "Recorded";

        public DateTime? PaidDate { get; set; }

        [MaxLength(3000)]
        public string? Note { get; set; }

        public Supplier? Supplier { get; set; }

        public PurchaseOrder? PurchaseOrder { get; set; }

        public GoodsReceipt? GoodsReceipt { get; set; }
    }
}
