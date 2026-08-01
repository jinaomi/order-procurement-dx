namespace CaseMngmt.Models.PurchaseOrders
{
    public class PurchaseOrderReconciliationViewModel
    {
        public Guid PurchaseOrderId { get; set; }
        public string PurchaseOrderNumber { get; set; }
        public string Status { get; set; }
        public decimal OrderedTotalAmount { get; set; }
        public decimal InvoicedTotalAmount { get; set; }

        public bool IsOrdered { get; set; } = true;
        public bool IsFullyReceived { get; set; }
        public bool IsPartiallyReceived { get; set; }
        public bool IsInvoiceReceived { get; set; }
        public bool IsFullyPaid { get; set; }

        // true when the invoiced amount doesn't match the ordered amount even though
        // receiving looks complete — a discrepancy worth a human looking at, not a hard error
        // (the supplier may simply not have billed the full PO yet).
        public bool HasAmountMismatch { get; set; }

        public List<PurchaseOrderReconciliationItem> Items { get; set; } = new();
        public List<PurchaseInvoiceSummary> Invoices { get; set; } = new();
    }

    public class PurchaseOrderReconciliationItem
    {
        public Guid PurchaseOrderItemId { get; set; }
        public string ProductNameRaw { get; set; }
        public decimal OrderedQuantity { get; set; }
        public decimal ReceivedQuantity { get; set; }
        public bool IsOverDelivered { get; set; }
    }

    public class PurchaseInvoiceSummary
    {
        public Guid Id { get; set; }
        public string PurchaseInvoiceNumber { get; set; }
        public decimal TotalAmount { get; set; }
        public string Status { get; set; }
        public DateTime? PaidDate { get; set; }
    }
}
