using System.ComponentModel.DataAnnotations;

namespace CaseMngmt.Models.PurchaseOrders
{
    // Logs each time a 発注書 PDF is generated and (manually) sent to a Supplier — separate
    // from the internal PurchaseOrder record itself, since a PO can be re-issued/re-sent
    // multiple times (corrections, resending after a supplier reports not receiving a FAX).
    // Each row snapshots the PDF filename generated at that moment, so evidence of what was
    // actually sent survives later edits to the PurchaseOrder.
    public class PurchaseOrderIssuance : BaseModel
    {
        [Required]
        public Guid PurchaseOrderId { get; set; }

        [Required]
        public DateTime IssuedDate { get; set; }

        [Required]
        [MaxLength(20)]
        public string Channel { get; set; }

        [MaxLength(500)]
        public string? Note { get; set; }

        [Required]
        [MaxLength(260)]
        public string FileName { get; set; }

        [Required]
        public Guid IssuedBy { get; set; }

        public PurchaseOrder? PurchaseOrder { get; set; }
    }
}
