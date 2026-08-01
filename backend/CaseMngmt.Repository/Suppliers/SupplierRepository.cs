using CaseMngmt.Models;
using CaseMngmt.Models.Database;
using CaseMngmt.Models.Suppliers;
using Microsoft.EntityFrameworkCore;

namespace CaseMngmt.Repository.Suppliers
{
    public class SupplierRepository : ISupplierRepository
    {
        private ApplicationDbContext _context;

        public SupplierRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<int> AddAsync(Supplier supplier)
        {
            try
            {
                await _context.Supplier.AddAsync(supplier);
                var result = await _context.SaveChangesAsync();
                return result;
            }
            catch (Exception)
            {
                return 0;
            }
        }

        public async Task<int> DeleteAsync(Guid id, Guid currentUserId)
        {
            try
            {
                Supplier? supplier = await _context.Supplier.FindAsync(id);
                if (supplier != null)
                {
                    supplier.UpdatedBy = currentUserId;
                    supplier.UpdatedDate = DateTime.UtcNow;
                    supplier.Deleted = true;
                    await _context.SaveChangesAsync();
                    return 1;
                }
                return 0;
            }
            catch (Exception)
            {
                return 0;
            }
        }

        public async Task<PagedResult<Supplier>?> GetAllAsync(Guid companyId, string? name, int pageSize, int pageNumber)
        {
            try
            {
                var queryableSupplier = _context.Supplier.Where(x => !x.Deleted && x.CompanyId == companyId);

                if (!string.IsNullOrEmpty(name))
                {
                    queryableSupplier = queryableSupplier.Where(m => m.Name.Contains(name.Trim()));
                }

                queryableSupplier = queryableSupplier.OrderBy(m => m.Name);
                var result = await PagedResult<Supplier>.CreateAsync(queryableSupplier.AsNoTracking(), pageNumber, pageSize);
                return result;
            }
            catch (Exception)
            {
                return null;
            }
        }

        public async Task<List<Supplier>> GetAllAsync(Guid companyId)
        {
            try
            {
                return await _context.Supplier
                    .Where(x => !x.Deleted && x.CompanyId == companyId)
                    .OrderBy(m => m.Name)
                    .ToListAsync();
            }
            catch (Exception)
            {
                return new List<Supplier>();
            }
        }

        public async Task<Supplier?> GetByIdAsync(Guid id)
        {
            try
            {
                return await _context.Supplier.FindAsync(id);
            }
            catch (Exception)
            {
                return null;
            }
        }

        public async Task<List<Supplier>> GetByIdsAsync(List<Guid> ids)
        {
            try
            {
                return await _context.Supplier.Where(x => !x.Deleted && ids.Contains(x.Id)).ToListAsync();
            }
            catch (Exception)
            {
                return new List<Supplier>();
            }
        }

        public async Task<int> UpdateAsync(Supplier supplier)
        {
            try
            {
                if (supplier != null)
                {
                    _context.Supplier.Update(supplier);
                    await _context.SaveChangesAsync();
                    return 1;
                }
                return 0;
            }
            catch (Exception)
            {
                return 0;
            }
        }
    }
}
