using CaseMngmt.Models.PurchaseOrders;

namespace CaseMngmt.Repository.PurchaseOrders
{
    public interface IPurchaseOrderIssuanceRepository
    {
        Task<int> AddAsync(PurchaseOrderIssuance issuance);
        Task<List<PurchaseOrderIssuance>> GetByPurchaseOrderIdAsync(Guid purchaseOrderId);
    }
}
