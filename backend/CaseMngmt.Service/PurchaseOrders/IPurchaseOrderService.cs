using CaseMngmt.Models;
using CaseMngmt.Models.PurchaseOrders;

namespace CaseMngmt.Service.PurchaseOrders
{
    public interface IPurchaseOrderService
    {
        Task<Guid?> CreatePurchaseOrderAsync(PurchaseOrderRequest request, Guid currentUserId);
        Task<PagedResult<PurchaseOrderViewModel>?> GetAllPurchaseOrdersAsync(Guid companyId, string? status, Guid? supplierId, DateTime? orderDateFrom, DateTime? orderDateTo, int pageSize, int pageNumber);
        Task<PurchaseOrderViewModel?> GetByIdAsync(Guid id, Guid companyId);
        Task<int> UpdatePurchaseOrderAsync(Guid id, PurchaseOrderRequest request, Guid currentUserId);
        Task<int> UpdateStatusAsync(Guid id, Guid companyId, string status, Guid currentUserId);
        Task<int> DeleteAsync(Guid id, Guid companyId, Guid currentUserId);
        Task<PurchaseOrderReconciliationViewModel?> GetReconciliationAsync(Guid id, Guid companyId);
    }
}
