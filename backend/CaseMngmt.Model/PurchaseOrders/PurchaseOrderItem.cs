using CaseMngmt.Models.Products;
using System.ComponentModel.DataAnnotations;

namespace CaseMngmt.Models.PurchaseOrders
{
    public class PurchaseOrderItem : BaseModel
    {
        [Required]
        public Guid PurchaseOrderId { get; set; }

        public Guid? ProductId { get; set; }

        [Required]
        [MaxLength(256)]
        public string ProductNameRaw { get; set; }

        [Required]
        public decimal Quantity { get; set; }

        [Required]
        public decimal UnitPrice { get; set; }

        [Required]
        public decimal LineAmount { get; set; }

        [Required]
        public decimal ReceivedQuantity { get; set; } = 0;

        [MaxLength(500)]
        public string? Note { get; set; }

        public PurchaseOrder? PurchaseOrder { get; set; }

        public Product? Product { get; set; }
    }
}
