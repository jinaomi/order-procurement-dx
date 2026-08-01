using CaseMngmt.Models;
using CaseMngmt.Models.Database;
using CaseMngmt.Models.PurchaseInvoices;
using Microsoft.EntityFrameworkCore;

namespace CaseMngmt.Repository.PurchaseInvoices
{
    public class PurchaseInvoiceRepository : IPurchaseInvoiceRepository
    {
        private ApplicationDbContext _context;

        public PurchaseInvoiceRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<int> AddAsync(PurchaseInvoice purchaseInvoice)
        {
            try
            {
                await _context.PurchaseInvoice.AddAsync(purchaseInvoice);
                var result = await _context.SaveChangesAsync();
                return result;
            }
            catch (Exception)
            {
                return 0;
            }
        }

        public async Task<PagedResult<PurchaseInvoice>?> GetAllAsync(Guid companyId, Guid? supplierId, string? status, DateTime? issueDateFrom, DateTime? issueDateTo, int pageSize, int pageNumber)
        {
            try
            {
                var queryablePurchaseInvoice = _context.PurchaseInvoice
                    .Include(x => x.Supplier)
                    .Include(x => x.PurchaseOrder)
                    .Where(x => !x.Deleted && x.CompanyId == companyId);

                if (supplierId.HasValue)
                {
                    queryablePurchaseInvoice = queryablePurchaseInvoice.Where(x => x.SupplierId == supplierId.Value);
                }

                if (!string.IsNullOrEmpty(status))
                {
                    queryablePurchaseInvoice = queryablePurchaseInvoice.Where(x => x.Status == status);
                }

                if (issueDateFrom.HasValue)
                {
                    queryablePurchaseInvoice = queryablePurchaseInvoice.Where(x => x.IssueDate >= issueDateFrom.Value.Date);
                }

                if (issueDateTo.HasValue)
                {
                    queryablePurchaseInvoice = queryablePurchaseInvoice.Where(x => x.IssueDate < issueDateTo.Value.Date.AddDays(1));
                }

                queryablePurchaseInvoice = queryablePurchaseInvoice.OrderByDescending(x => x.IssueDate);
                var result = await PagedResult<PurchaseInvoice>.CreateAsync(queryablePurchaseInvoice.AsNoTracking(), pageNumber, pageSize);
                return result;
            }
            catch (Exception)
            {
                return null;
            }
        }

        public async Task<PurchaseInvoice?> GetByIdAsync(Guid id, Guid companyId)
        {
            try
            {
                return await _context.PurchaseInvoice
                    .Include(x => x.Supplier)
                    .Include(x => x.PurchaseOrder)
                    .FirstOrDefaultAsync(x => x.Id == id && x.CompanyId == companyId && !x.Deleted);
            }
            catch (Exception)
            {
                return null;
            }
        }

        public async Task<List<PurchaseInvoice>> GetByPurchaseOrderIdAsync(Guid purchaseOrderId, Guid companyId)
        {
            try
            {
                return await _context.PurchaseInvoice
                    .Where(x => !x.Deleted && x.CompanyId == companyId && x.PurchaseOrderId == purchaseOrderId)
                    .OrderBy(x => x.IssueDate)
                    .AsNoTracking()
                    .ToListAsync();
            }
            catch (Exception)
            {
                return new List<PurchaseInvoice>();
            }
        }

        public async Task<int> UpdateStatusAsync(Guid id, Guid companyId, string status, DateTime? paidDate, Guid currentUserId)
        {
            try
            {
                var purchaseInvoice = await _context.PurchaseInvoice.FirstOrDefaultAsync(x => x.Id == id && x.CompanyId == companyId && !x.Deleted);
                if (purchaseInvoice == null)
                {
                    return 0;
                }

                purchaseInvoice.Status = status;
                purchaseInvoice.PaidDate = paidDate;
                purchaseInvoice.UpdatedBy = currentUserId;
                purchaseInvoice.UpdatedDate = DateTime.UtcNow;
                await _context.SaveChangesAsync();
                return 1;
            }
            catch (Exception)
            {
                return 0;
            }
        }

        public async Task<int> GetPurchaseInvoiceCountAsync(Guid companyId, int year)
        {
            try
            {
                return await _context.PurchaseInvoice.CountAsync(x => x.CompanyId == companyId && x.IssueDate.Year == year);
            }
            catch (Exception)
            {
                return 0;
            }
        }
    }
}
