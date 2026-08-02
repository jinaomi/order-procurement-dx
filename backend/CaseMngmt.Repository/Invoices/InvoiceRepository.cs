using CaseMngmt.Models;
using CaseMngmt.Models.Database;
using CaseMngmt.Models.Invoices;
using Microsoft.EntityFrameworkCore;

namespace CaseMngmt.Repository.Invoices
{
    public class InvoiceRepository : IInvoiceRepository
    {
        private ApplicationDbContext _context;

        public InvoiceRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<int> AddAsync(Invoice invoice)
        {
            try
            {
                await _context.Invoice.AddAsync(invoice);
                return await _context.SaveChangesAsync();
            }
            catch (Exception)
            {
                return 0;
            }
        }

        public async Task<PagedResult<Invoice>?> GetAllAsync(Guid companyId, Guid? customerId, string? status, string? orderNumber, DateTime? issueDateFrom, DateTime? issueDateTo, int pageSize, int pageNumber)
        {
            try
            {
                var queryable = _context.Invoice
                    .Include(x => x.Order)
                    .Include(x => x.Customer)
                    .Where(x => !x.Deleted && x.CompanyId == companyId);

                if (customerId.HasValue)
                {
                    queryable = queryable.Where(x => x.CustomerId == customerId.Value);
                }

                if (!string.IsNullOrEmpty(status))
                {
                    queryable = queryable.Where(x => x.Status == status);
                }

                if (!string.IsNullOrEmpty(orderNumber))
                {
                    queryable = queryable.Where(x => x.Order != null && x.Order.OrderNumber.Contains(orderNumber));
                }

                if (issueDateFrom.HasValue)
                {
                    queryable = queryable.Where(x => x.IssueDate >= issueDateFrom.Value.Date);
                }

                if (issueDateTo.HasValue)
                {
                    queryable = queryable.Where(x => x.IssueDate < issueDateTo.Value.Date.AddDays(1));
                }

                queryable = queryable.OrderByDescending(x => x.IssueDate);

                return await PagedResult<Invoice>.CreateAsync(queryable.AsNoTracking(), pageNumber, pageSize);
            }
            catch (Exception)
            {
                return null;
            }
        }

        public async Task<Invoice?> GetByIdAsync(Guid id, Guid companyId)
        {
            try
            {
                return await _context.Invoice
                    .Include(x => x.Order).ThenInclude(o => o!.OrderItems.Where(i => !i.Deleted))
                    .Include(x => x.Customer)
                    .FirstOrDefaultAsync(x => x.Id == id && x.CompanyId == companyId && !x.Deleted);
            }
            catch (Exception)
            {
                return null;
            }
        }

        public async Task<Invoice?> GetByOrderIdAsync(Guid orderId, Guid companyId)
        {
            try
            {
                return await _context.Invoice
                    .FirstOrDefaultAsync(x => x.OrderId == orderId && x.CompanyId == companyId && !x.Deleted);
            }
            catch (Exception)
            {
                return null;
            }
        }

        public async Task<int> GetInvoiceCountAsync(Guid companyId, int year)
        {
            try
            {
                return await _context.Invoice.CountAsync(x => x.CompanyId == companyId && x.IssueDate.Year == year);
            }
            catch (Exception)
            {
                return 0;
            }
        }

        public async Task<int> UpdateStatusAsync(Guid id, Guid companyId, string status, Guid currentUserId)
        {
            try
            {
                var invoice = await _context.Invoice.FirstOrDefaultAsync(x => x.Id == id && x.CompanyId == companyId && !x.Deleted);
                if (invoice == null)
                {
                    return 0;
                }

                invoice.Status = status;
                invoice.UpdatedBy = currentUserId;
                invoice.UpdatedDate = DateTime.UtcNow;
                await _context.SaveChangesAsync();
                return 1;
            }
            catch (Exception)
            {
                return 0;
            }
        }

        public async Task<int> UpdatePdfPathAsync(Guid id, Guid companyId, string pdfPath)
        {
            try
            {
                var invoice = await _context.Invoice.FirstOrDefaultAsync(x => x.Id == id && x.CompanyId == companyId && !x.Deleted);
                if (invoice == null)
                {
                    return 0;
                }

                invoice.PdfPath = pdfPath;
                await _context.SaveChangesAsync();
                return 1;
            }
            catch (Exception)
            {
                return 0;
            }
        }

        public async Task<List<Invoice>> GetAllForDashboardAsync(Guid companyId)
        {
            try
            {
                return await _context.Invoice
                    .Where(x => !x.Deleted && x.CompanyId == companyId)
                    .AsNoTracking()
                    .ToListAsync();
            }
            catch (Exception)
            {
                return new List<Invoice>();
            }
        }
    }
}
