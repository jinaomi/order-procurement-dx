using System.ComponentModel.DataAnnotations;

namespace CaseMngmt.Models.PurchaseInvoices
{
    public class PurchaseInvoiceRequest : UpdateByModel
    {
        [Required]
        public Guid PurchaseOrderId { get; set; }

        public Guid? GoodsReceiptId { get; set; }

        [MaxLength(100)]
        public string? SupplierInvoiceNumber { get; set; }

        [Required]
        public DateTime IssueDate { get; set; }

        [MaxLength(3000)]
        public string? Note { get; set; }

        [Required]
        public Guid CompanyId { get; set; }
    }
}
