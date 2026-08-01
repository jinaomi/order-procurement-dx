using CaseMngmt.Models;
using CaseMngmt.Models.Suppliers;

namespace CaseMngmt.Repository.Suppliers
{
    public interface ISupplierRepository
    {
        Task<int> AddAsync(Supplier supplier);
        Task<PagedResult<Supplier>?> GetAllAsync(Guid companyId, string? name, int pageSize, int pageNumber);
        Task<List<Supplier>> GetAllAsync(Guid companyId);
        Task<Supplier?> GetByIdAsync(Guid id);
        Task<List<Supplier>> GetByIdsAsync(List<Guid> ids);
        Task<int> UpdateAsync(Supplier supplier);
        Task<int> DeleteAsync(Guid id, Guid currentUserId);
    }
}
