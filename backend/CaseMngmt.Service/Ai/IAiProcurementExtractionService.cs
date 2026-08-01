using CaseMngmt.Models.GoodsReceipts;
using CaseMngmt.Models.PurchaseOrders;

namespace CaseMngmt.Service.Ai
{
    public interface IAiProcurementExtractionService
    {
        Task<PurchaseOrderExtractionResult?> ExtractPurchaseOrderAsync(byte[] fileBytes, string mediaType, Guid companyId);
        Task<GoodsReceiptExtractionResult?> ExtractGoodsReceiptAsync(byte[] fileBytes, string mediaType, Guid companyId, Guid? purchaseOrderId);
    }
}
