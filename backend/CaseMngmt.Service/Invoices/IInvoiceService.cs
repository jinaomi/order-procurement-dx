using CaseMngmt.Models;
using CaseMngmt.Models.Invoices;

namespace CaseMngmt.Service.Invoices
{
    public interface IInvoiceService
    {
        Task<InvoiceCreateResult> CreateFromOrderAsync(Guid orderId, Guid companyId, Guid currentUserId);
        Task<PagedResult<InvoiceViewModel>?> GetAllInvoicesAsync(Guid companyId, Guid? customerId, string? status, string? orderNumber, DateTime? issueDateFrom, DateTime? issueDateTo, int pageSize, int pageNumber);
        Task<InvoiceViewModel?> GetByIdAsync(Guid id, Guid companyId);
        Task<InvoiceViewModel?> GetByOrderIdAsync(Guid orderId, Guid companyId);
        Task<int> UpdateStatusAsync(Guid id, Guid companyId, string status, Guid currentUserId);
        Task<byte[]?> GeneratePdfAsync(Guid id, Guid companyId);
        Task<string?> GetInvoiceFileNameAsync(Guid id, Guid companyId);
        Task<byte[]?> GetOrGeneratePdfAsync(Guid id, Guid companyId);
    }
}
