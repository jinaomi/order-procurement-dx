using CaseMngmt.Models;
using CaseMngmt.Models.GoodsReceipts;

namespace CaseMngmt.Repository.GoodsReceipts
{
    public interface IGoodsReceiptRepository
    {
        Task<int> AddAsync(GoodsReceipt goodsReceipt);
        Task<PagedResult<GoodsReceipt>?> GetAllAsync(Guid companyId, Guid? purchaseOrderId, Guid? supplierId, int pageSize, int pageNumber);
        Task<GoodsReceipt?> GetByIdAsync(Guid id, Guid companyId);
        Task<List<GoodsReceipt>> GetByPurchaseOrderIdAsync(Guid purchaseOrderId, Guid companyId);
        Task<int> GetGoodsReceiptCountAsync(Guid companyId, int year);
        Task<List<GoodsReceipt>> GetAllForCompanyAsync(Guid companyId);
    }
}
