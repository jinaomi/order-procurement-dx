using CaseMngmt.Models.EntityKeywords;
using System.ComponentModel.DataAnnotations;

namespace CaseMngmt.Models.PurchaseOrders
{
    public class PurchaseOrderRequest : UpdateByModel
    {
        [Required]
        public Guid SupplierId { get; set; }

        [Required]
        public DateTime OrderDate { get; set; }

        public DateTime? ExpectedDeliveryDate { get; set; }

        [MaxLength(20)]
        public string SourceType { get; set; } = "Manual";

        [MaxLength(500)]
        public string? SourceDocumentPath { get; set; }

        [MaxLength(3000)]
        public string? Note { get; set; }

        [Required]
        public Guid CompanyId { get; set; }

        [Required]
        [MinLength(1, ErrorMessage = "Purchase order must have at least one item.")]
        public List<PurchaseOrderItemRequest> PurchaseOrderItems { get; set; } = new List<PurchaseOrderItemRequest>();

        public List<EntityKeywordValueRequest> CustomFieldValues { get; set; } = new();
    }
}
