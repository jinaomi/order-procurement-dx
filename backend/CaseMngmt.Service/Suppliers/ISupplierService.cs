using CaseMngmt.Models;
using CaseMngmt.Models.Suppliers;

namespace CaseMngmt.Service.Suppliers
{
    public interface ISupplierService
    {
        Task<Guid?> AddSupplierAsync(SupplierRequest supplier);
        Task<PagedResult<SupplierViewModel>?> GetAllSuppliersAsync(Guid companyId, string? name, int pageSize, int pageNumber);
        Task<List<SupplierViewModel>> GetAllSuppliersAsync(Guid companyId);
        Task<List<Supplier>> GetByIdsAsync(List<Guid> ids);
        Task<SupplierViewModel?> GetByIdAsync(Guid id);
        Task<int> UpdateSupplierAsync(Guid id, SupplierRequest supplier);
        Task<int> DeleteAsync(Guid id, Guid currentUserId);
    }
}
