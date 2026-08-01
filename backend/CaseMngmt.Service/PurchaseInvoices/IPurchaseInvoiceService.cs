using CaseMngmt.Models;
using CaseMngmt.Models.PurchaseInvoices;

namespace CaseMngmt.Service.PurchaseInvoices
{
    public interface IPurchaseInvoiceService
    {
        Task<PurchaseInvoiceCreateResult> CreateAsync(PurchaseInvoiceRequest request, Guid currentUserId);
        Task<PagedResult<PurchaseInvoiceViewModel>?> GetAllAsync(Guid companyId, Guid? supplierId, string? status, DateTime? issueDateFrom, DateTime? issueDateTo, int pageSize, int pageNumber);
        Task<PurchaseInvoiceViewModel?> GetByIdAsync(Guid id, Guid companyId);
        Task<List<PurchaseInvoiceViewModel>> GetByPurchaseOrderIdAsync(Guid purchaseOrderId, Guid companyId);
        Task<int> MarkAsPaidAsync(Guid id, Guid companyId, Guid currentUserId);
    }
}
