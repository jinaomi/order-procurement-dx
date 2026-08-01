using CaseMngmt.Models;
using CaseMngmt.Models.PurchaseOrders;

namespace CaseMngmt.Repository.PurchaseOrders
{
    public interface IPurchaseOrderRepository
    {
        Task<int> AddAsync(PurchaseOrder purchaseOrder);
        Task<PagedResult<PurchaseOrder>?> GetAllAsync(Guid companyId, string? status, Guid? supplierId, DateTime? orderDateFrom, DateTime? orderDateTo, int pageSize, int pageNumber);
        Task<PurchaseOrder?> GetByIdAsync(Guid id, Guid companyId);
        Task<int> UpdateAsync(PurchaseOrder purchaseOrder, List<PurchaseOrderItem> newItems);
        Task<int> UpdateStatusAsync(Guid purchaseOrderId, Guid companyId, string status, Guid currentUserId);
        Task<int> DeleteAsync(Guid id, Guid companyId, Guid currentUserId);
        Task<int> GetPurchaseOrderCountAsync(Guid companyId, int year);
        Task<List<PurchaseOrder>> GetAllForCompanyAsync(Guid companyId);
    }
}
