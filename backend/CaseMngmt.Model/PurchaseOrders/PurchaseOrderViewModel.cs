using CaseMngmt.Models.EntityKeywords;

namespace CaseMngmt.Models.PurchaseOrders
{
    public class PurchaseOrderViewModel
    {
        public Guid Id { get; set; }
        public Guid CompanyId { get; set; }
        public Guid SupplierId { get; set; }
        public string? SupplierName { get; set; }
        public string PurchaseOrderNumber { get; set; }
        public DateTime OrderDate { get; set; }
        public DateTime? ExpectedDeliveryDate { get; set; }
        public string Status { get; set; }
        public string SourceType { get; set; }
        public string? SourceDocumentPath { get; set; }
        public decimal SubTotalAmount { get; set; }
        public decimal TaxAmount { get; set; }
        public decimal TotalAmount { get; set; }
        public string? Note { get; set; }
        public Guid CreatedBy { get; set; }
        public Guid UpdatedBy { get; set; }
        public DateTime CreatedDate { get; set; }
        public DateTime UpdatedDate { get; set; }
        public List<PurchaseOrderItemViewModel> PurchaseOrderItems { get; set; } = new List<PurchaseOrderItemViewModel>();
        public List<EntityKeywordValue> CustomFieldValues { get; set; } = new();
    }
}
