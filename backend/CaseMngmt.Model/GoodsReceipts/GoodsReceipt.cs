using CaseMngmt.Models.PurchaseOrders;
using CaseMngmt.Models.Suppliers;
using System.ComponentModel.DataAnnotations;

namespace CaseMngmt.Models.GoodsReceipts
{
    public class GoodsReceipt : BaseModel
    {
        [Required]
        public Guid CompanyId { get; set; }

        [Required]
        public Guid PurchaseOrderId { get; set; }

        [Required]
        public Guid SupplierId { get; set; }

        [MaxLength(50)]
        public string GoodsReceiptNumber { get; set; }

        [Required]
        public DateTime ReceivedDate { get; set; }

        [Required]
        [MaxLength(20)]
        public string SourceType { get; set; } = "Manual";

        [MaxLength(500)]
        public string? SourceDocumentPath { get; set; }

        [MaxLength(3000)]
        public string? Note { get; set; }

        public PurchaseOrder? PurchaseOrder { get; set; }

        public Supplier? Supplier { get; set; }

        public List<GoodsReceiptItem> GoodsReceiptItems { get; set; } = new List<GoodsReceiptItem>();
    }
}
