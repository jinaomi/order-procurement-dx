using CaseMngmt.Models;
using CaseMngmt.Models.PurchaseInvoices;

namespace CaseMngmt.Repository.PurchaseInvoices
{
    public interface IPurchaseInvoiceRepository
    {
        Task<int> AddAsync(PurchaseInvoice purchaseInvoice);
        Task<PagedResult<PurchaseInvoice>?> GetAllAsync(Guid companyId, Guid? supplierId, string? status, string? purchaseInvoiceNumber, DateTime? issueDateFrom, DateTime? issueDateTo, int pageSize, int pageNumber);
        Task<PurchaseInvoice?> GetByIdAsync(Guid id, Guid companyId);
        Task<List<PurchaseInvoice>> GetByPurchaseOrderIdAsync(Guid purchaseOrderId, Guid companyId);
        Task<int> UpdateStatusAsync(Guid id, Guid companyId, string status, DateTime? paidDate, Guid currentUserId);
        Task<int> GetPurchaseInvoiceCountAsync(Guid companyId, int year);
    }
}
