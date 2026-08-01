using CaseMngmt.Models;
using CaseMngmt.Models.Database;
using CaseMngmt.Models.GoodsReceipts;
using Microsoft.EntityFrameworkCore;

namespace CaseMngmt.Repository.GoodsReceipts
{
    public class GoodsReceiptRepository : IGoodsReceiptRepository
    {
        private ApplicationDbContext _context;

        public GoodsReceiptRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<int> AddAsync(GoodsReceipt goodsReceipt)
        {
            try
            {
                await _context.GoodsReceipt.AddAsync(goodsReceipt);
                var result = await _context.SaveChangesAsync();
                return result;
            }
            catch (Exception)
            {
                return 0;
            }
        }

        public async Task<PagedResult<GoodsReceipt>?> GetAllAsync(Guid companyId, Guid? purchaseOrderId, Guid? supplierId, int pageSize, int pageNumber)
        {
            try
            {
                var queryableGoodsReceipt = _context.GoodsReceipt
                    .Include(x => x.Supplier)
                    .Include(x => x.PurchaseOrder)
                    .Include(x => x.GoodsReceiptItems.Where(i => !i.Deleted))
                    .Where(x => !x.Deleted && x.CompanyId == companyId);

                if (purchaseOrderId.HasValue)
                {
                    queryableGoodsReceipt = queryableGoodsReceipt.Where(x => x.PurchaseOrderId == purchaseOrderId.Value);
                }

                if (supplierId.HasValue)
                {
                    queryableGoodsReceipt = queryableGoodsReceipt.Where(x => x.SupplierId == supplierId.Value);
                }

                queryableGoodsReceipt = queryableGoodsReceipt.OrderByDescending(x => x.ReceivedDate);
                var result = await PagedResult<GoodsReceipt>.CreateAsync(queryableGoodsReceipt.AsNoTracking(), pageNumber, pageSize);
                return result;
            }
            catch (Exception)
            {
                return null;
            }
        }

        public async Task<GoodsReceipt?> GetByIdAsync(Guid id, Guid companyId)
        {
            try
            {
                return await _context.GoodsReceipt
                    .Include(x => x.Supplier)
                    .Include(x => x.PurchaseOrder)
                    .Include(x => x.GoodsReceiptItems.Where(i => !i.Deleted))
                    .FirstOrDefaultAsync(x => x.Id == id && x.CompanyId == companyId && !x.Deleted);
            }
            catch (Exception)
            {
                return null;
            }
        }

        public async Task<List<GoodsReceipt>> GetByPurchaseOrderIdAsync(Guid purchaseOrderId, Guid companyId)
        {
            try
            {
                return await _context.GoodsReceipt
                    .Include(x => x.GoodsReceiptItems.Where(i => !i.Deleted))
                    .Where(x => !x.Deleted && x.CompanyId == companyId && x.PurchaseOrderId == purchaseOrderId)
                    .OrderBy(x => x.ReceivedDate)
                    .AsNoTracking()
                    .ToListAsync();
            }
            catch (Exception)
            {
                return new List<GoodsReceipt>();
            }
        }

        public async Task<List<GoodsReceipt>> GetAllForCompanyAsync(Guid companyId)
        {
            try
            {
                return await _context.GoodsReceipt
                    .Include(x => x.PurchaseOrder)
                    .Include(x => x.GoodsReceiptItems.Where(i => !i.Deleted))
                    .Where(x => !x.Deleted && x.CompanyId == companyId)
                    .AsNoTracking()
                    .ToListAsync();
            }
            catch (Exception)
            {
                return new List<GoodsReceipt>();
            }
        }

        public async Task<int> GetGoodsReceiptCountAsync(Guid companyId, int year)
        {
            try
            {
                return await _context.GoodsReceipt.CountAsync(x => x.CompanyId == companyId && x.ReceivedDate.Year == year);
            }
            catch (Exception)
            {
                return 0;
            }
        }
    }
}
