using CaseMngmt.Models.Database;
using CaseMngmt.Models.PurchaseOrders;
using Microsoft.EntityFrameworkCore;

namespace CaseMngmt.Repository.PurchaseOrders
{
    public class PurchaseOrderIssuanceRepository : IPurchaseOrderIssuanceRepository
    {
        private ApplicationDbContext _context;

        public PurchaseOrderIssuanceRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<int> AddAsync(PurchaseOrderIssuance issuance)
        {
            try
            {
                await _context.PurchaseOrderIssuance.AddAsync(issuance);
                return await _context.SaveChangesAsync();
            }
            catch (Exception)
            {
                return 0;
            }
        }

        public async Task<List<PurchaseOrderIssuance>> GetByPurchaseOrderIdAsync(Guid purchaseOrderId)
        {
            try
            {
                return await _context.PurchaseOrderIssuance
                    .Where(x => !x.Deleted && x.PurchaseOrderId == purchaseOrderId)
                    .OrderByDescending(x => x.IssuedDate)
                    .AsNoTracking()
                    .ToListAsync();
            }
            catch (Exception)
            {
                return new List<PurchaseOrderIssuance>();
            }
        }
    }
}
