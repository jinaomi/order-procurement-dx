using CaseMngmt.Models.EntityKeywords;
using System.ComponentModel.DataAnnotations;

namespace CaseMngmt.Models.Orders
{
    public class OrderRequest : UpdateByModel
    {
        [Required]
        public Guid CustomerId { get; set; }

        [Required]
        public DateTime OrderDate { get; set; }

        public DateTime? RequestedDeliveryDate { get; set; }

        [MaxLength(20)]
        public string SourceType { get; set; } = "Manual";

        [MaxLength(500)]
        public string? SourceDocumentPath { get; set; }

        [MaxLength(3000)]
        public string? Note { get; set; }

        [Required]
        public Guid CompanyId { get; set; }

        [Required]
        [MinLength(1, ErrorMessage = "Order must have at least one item.")]
        public List<OrderItemRequest> OrderItems { get; set; } = new List<OrderItemRequest>();

        public List<EntityKeywordValueRequest> CustomFieldValues { get; set; } = new();
    }
}
