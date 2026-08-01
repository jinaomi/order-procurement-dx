using System.ComponentModel.DataAnnotations;

namespace CaseMngmt.Models.GoodsReceipts
{
    public class GoodsReceiptItemRequest
    {
        [Required]
        public Guid PurchaseOrderItemId { get; set; }

        public Guid? ProductId { get; set; }

        [Required]
        [MaxLength(256)]
        public string ProductNameRaw { get; set; }

        [Required]
        public decimal ReceivedQuantity { get; set; }

        [MaxLength(500)]
        public string? Note { get; set; }
    }
}
