using CaseMngmt.Models.Suppliers;
using System.ComponentModel.DataAnnotations;

namespace CaseMngmt.Models.PurchaseOrders
{
    public class PurchaseOrder : BaseModel
    {
        [Required]
        public Guid CompanyId { get; set; }

        [Required]
        public Guid SupplierId { get; set; }

        [MaxLength(50)]
        public string PurchaseOrderNumber { get; set; }

        [Required]
        public DateTime OrderDate { get; set; }

        public DateTime? ExpectedDeliveryDate { get; set; }

        [Required]
        [MaxLength(50)]
        public string Status { get; set; } = "Draft";

        [Required]
        [MaxLength(20)]
        public string SourceType { get; set; } = "Manual";

        [MaxLength(500)]
        public string? SourceDocumentPath { get; set; }

        public decimal SubTotalAmount { get; set; }

        public decimal TaxAmount { get; set; }

        public decimal TotalAmount { get; set; }

        [MaxLength(3000)]
        public string? Note { get; set; }

        public Supplier? Supplier { get; set; }

        public List<PurchaseOrderItem> PurchaseOrderItems { get; set; } = new List<PurchaseOrderItem>();
    }
}
