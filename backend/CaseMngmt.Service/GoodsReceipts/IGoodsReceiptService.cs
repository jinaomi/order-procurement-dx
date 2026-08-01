using CaseMngmt.Models;
using CaseMngmt.Models.GoodsReceipts;

namespace CaseMngmt.Service.GoodsReceipts
{
    public interface IGoodsReceiptService
    {
        Task<GoodsReceiptCreateResult> CreateAsync(GoodsReceiptRequest request, Guid currentUserId);
        Task<PagedResult<GoodsReceiptViewModel>?> GetAllAsync(Guid companyId, Guid? purchaseOrderId, Guid? supplierId, int pageSize, int pageNumber);
        Task<GoodsReceiptViewModel?> GetByIdAsync(Guid id, Guid companyId);
        Task<List<GoodsReceiptViewModel>> GetByPurchaseOrderIdAsync(Guid purchaseOrderId, Guid companyId);
    }
}
