using CaseMngmt.Models.Products;
using CaseMngmt.Models.PurchaseOrders;
using System.ComponentModel.DataAnnotations;

namespace CaseMngmt.Models.GoodsReceipts
{
    public class GoodsReceiptItem : BaseModel
    {
        [Required]
        public Guid GoodsReceiptId { get; set; }

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

        public GoodsReceipt? GoodsReceipt { get; set; }

        public PurchaseOrderItem? PurchaseOrderItem { get; set; }

        public Product? Product { get; set; }
    }
}
