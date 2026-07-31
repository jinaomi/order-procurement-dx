using CaseMngmt.Models.EntityKeywords;

namespace CaseMngmt.Models.Orders
{
    public class OrderViewModel
    {
        public Guid Id { get; set; }
        public Guid CompanyId { get; set; }
        public Guid CustomerId { get; set; }
        public string? CustomerName { get; set; }
        public string OrderNumber { get; set; }
        public DateTime OrderDate { get; set; }
        public DateTime? RequestedDeliveryDate { get; set; }
        public string Status { get; set; }
        public string? RiskLevel { get; set; }
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
        public List<OrderItemViewModel> OrderItems { get; set; } = new List<OrderItemViewModel>();
        public List<EntityKeywordValue> CustomFieldValues { get; set; } = new();
    }
}
