using System.ComponentModel.DataAnnotations;

namespace CaseMngmt.Models.PurchaseOrders
{
    public class PurchaseOrderItemRequest
    {
        public Guid? Id { get; set; }

        public Guid? ProductId { get; set; }

        [Required]
        [MaxLength(256)]
        public string ProductNameRaw { get; set; }

        [Required]
        public decimal Quantity { get; set; }

        [Required]
        public decimal UnitPrice { get; set; }

        [MaxLength(500)]
        public string? Note { get; set; }
    }
}
