using System.ComponentModel.DataAnnotations;
using CaseMngmt.Models.EntityKeywords;

namespace CaseMngmt.Models.GoodsReceipts
{
    public class GoodsReceiptRequest : UpdateByModel
    {
        [Required]
        public Guid PurchaseOrderId { get; set; }

        [Required]
        public DateTime ReceivedDate { get; set; }

        [MaxLength(20)]
        public string SourceType { get; set; } = "Manual";

        [MaxLength(500)]
        public string? SourceDocumentPath { get; set; }

        [MaxLength(3000)]
        public string? Note { get; set; }

        [Required]
        public Guid CompanyId { get; set; }

        [Required]
        [MinLength(1, ErrorMessage = "Goods receipt must have at least one item.")]
        public List<GoodsReceiptItemRequest> GoodsReceiptItems { get; set; } = new List<GoodsReceiptItemRequest>();

        public List<EntityKeywordValueRequest> CustomFieldValues { get; set; } = new();
    }
}
