using CaseMngmt.Models;
using CaseMngmt.Models.Database;
using CaseMngmt.Models.PurchaseOrders;
using Microsoft.EntityFrameworkCore;

namespace CaseMngmt.Repository.PurchaseOrders
{
    public class PurchaseOrderRepository : IPurchaseOrderRepository
    {
        private ApplicationDbContext _context;

        public PurchaseOrderRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<int> AddAsync(PurchaseOrder purchaseOrder)
        {
            try
            {
                await _context.PurchaseOrder.AddAsync(purchaseOrder);
                var result = await _context.SaveChangesAsync();
                return result;
            }
            catch (Exception)
            {
                return 0;
            }
        }

        public async Task<int> DeleteAsync(Guid id, Guid companyId, Guid currentUserId)
        {
            try
            {
                var purchaseOrder = await _context.PurchaseOrder
                    .Include(x => x.PurchaseOrderItems)
                    .FirstOrDefaultAsync(x => x.Id == id && x.CompanyId == companyId && !x.Deleted);

                if (purchaseOrder == null)
                {
                    return 0;
                }

                purchaseOrder.Deleted = true;
                purchaseOrder.UpdatedBy = currentUserId;
                purchaseOrder.UpdatedDate = DateTime.UtcNow;
                foreach (var item in purchaseOrder.PurchaseOrderItems)
                {
                    item.Deleted = true;
                }

                await _context.SaveChangesAsync();
                return 1;
            }
            catch (Exception)
            {
                return 0;
            }
        }

        public async Task<PagedResult<PurchaseOrder>?> GetAllAsync(Guid companyId, string? status, Guid? supplierId, DateTime? orderDateFrom, DateTime? orderDateTo, int pageSize, int pageNumber)
        {
            try
            {
                var queryablePurchaseOrder = _context.PurchaseOrder
                    .Include(x => x.Supplier)
                    .Include(x => x.PurchaseOrderItems.Where(i => !i.Deleted))
                    .Where(x => !x.Deleted && x.CompanyId == companyId);

                if (!string.IsNullOrEmpty(status))
                {
                    queryablePurchaseOrder = queryablePurchaseOrder.Where(x => x.Status == status);
                }

                if (supplierId.HasValue)
                {
                    queryablePurchaseOrder = queryablePurchaseOrder.Where(x => x.SupplierId == supplierId.Value);
                }

                if (orderDateFrom.HasValue)
                {
                    queryablePurchaseOrder = queryablePurchaseOrder.Where(x => x.OrderDate >= orderDateFrom.Value.Date);
                }

                if (orderDateTo.HasValue)
                {
                    queryablePurchaseOrder = queryablePurchaseOrder.Where(x => x.OrderDate < orderDateTo.Value.Date.AddDays(1));
                }

                queryablePurchaseOrder = queryablePurchaseOrder.OrderByDescending(x => x.OrderDate);
                var result = await PagedResult<PurchaseOrder>.CreateAsync(queryablePurchaseOrder.AsNoTracking(), pageNumber, pageSize);
                return result;
            }
            catch (Exception)
            {
                return null;
            }
        }

        public async Task<PurchaseOrder?> GetByIdAsync(Guid id, Guid companyId)
        {
            try
            {
                return await _context.PurchaseOrder
                    .Include(x => x.Supplier)
                    .Include(x => x.PurchaseOrderItems.Where(i => !i.Deleted))
                    .FirstOrDefaultAsync(x => x.Id == id && x.CompanyId == companyId && !x.Deleted);
            }
            catch (Exception)
            {
                return null;
            }
        }

        public async Task<List<PurchaseOrder>> GetAllForCompanyAsync(Guid companyId)
        {
            try
            {
                return await _context.PurchaseOrder
                    .Include(x => x.Supplier)
                    .Include(x => x.PurchaseOrderItems.Where(i => !i.Deleted))
                    .Where(x => !x.Deleted && x.CompanyId == companyId)
                    .AsNoTracking()
                    .ToListAsync();
            }
            catch (Exception)
            {
                return new List<PurchaseOrder>();
            }
        }

        public async Task<int> GetPurchaseOrderCountAsync(Guid companyId, int year)
        {
            try
            {
                return await _context.PurchaseOrder.CountAsync(x => x.CompanyId == companyId && x.OrderDate.Year == year);
            }
            catch (Exception)
            {
                return 0;
            }
        }

        public async Task<int> UpdateAsync(PurchaseOrder purchaseOrder, List<PurchaseOrderItem> newItems)
        {
            try
            {
                foreach (var item in newItems)
                {
                    _context.PurchaseOrderItem.Add(item);
                }

                await _context.SaveChangesAsync();
                return 1;
            }
            catch (Exception)
            {
                return 0;
            }
        }

        public async Task<int> UpdateStatusAsync(Guid purchaseOrderId, Guid companyId, string status, Guid currentUserId)
        {
            try
            {
                var purchaseOrder = await _context.PurchaseOrder.FirstOrDefaultAsync(x => x.Id == purchaseOrderId && x.CompanyId == companyId && !x.Deleted);
                if (purchaseOrder == null)
                {
                    return 0;
                }

                purchaseOrder.Status = status;
                purchaseOrder.UpdatedBy = currentUserId;
                purchaseOrder.UpdatedDate = DateTime.UtcNow;
                await _context.SaveChangesAsync();
                return 1;
            }
            catch (Exception)
            {
                return 0;
            }
        }
    }
}
