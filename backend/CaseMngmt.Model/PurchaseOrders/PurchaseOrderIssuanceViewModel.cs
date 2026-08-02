using System.ComponentModel.DataAnnotations;

namespace CaseMngmt.Models.PurchaseOrders
{
    public class PurchaseOrderIssuanceViewModel
    {
        public Guid Id { get; set; }
        public Guid PurchaseOrderId { get; set; }
        public DateTime IssuedDate { get; set; }
        public string Channel { get; set; }
        public string? Note { get; set; }
        public string FileName { get; set; }
        public Guid IssuedBy { get; set; }
    }

    public class PurchaseOrderIssueRequest
    {
        [Required]
        [MaxLength(20)]
        public string Channel { get; set; }

        [MaxLength(500)]
        public string? Note { get; set; }
    }
}
