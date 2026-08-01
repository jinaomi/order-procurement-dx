namespace CaseMngmt.Models.PurchaseInvoices
{
    public class PurchaseInvoiceCreateResult
    {
        // > 0 success, 0 = purchase order not found / save failed, -1 = business rule violation
        public int StatusCode { get; set; }
        public Guid? PurchaseInvoiceId { get; set; }
        public string? Message { get; set; }
    }
}
