using CaseMngmt.Models;
using CaseMngmt.Models.PurchaseInvoices;
using CaseMngmt.Repository.PurchaseInvoices;
using CaseMngmt.Repository.PurchaseOrders;
using CaseMngmt.Repository.Suppliers;
using CaseMngmt.Service.EntityKeywords;

namespace CaseMngmt.Service.PurchaseInvoices
{
    public class PurchaseInvoiceService : IPurchaseInvoiceService
    {
        private readonly IPurchaseInvoiceRepository _repository;
        private readonly IPurchaseOrderRepository _purchaseOrderRepository;
        private readonly ISupplierRepository _supplierRepository;
        private readonly IEntityKeywordService _entityKeywordService;

        private const int DefaultPaymentCycleMonths = 1;
        private const int DefaultPaymentDay = 99;
        private const int EndOfMonthSentinel = 99;
        private const string EntityType = "PurchaseInvoice";

        public PurchaseInvoiceService(IPurchaseInvoiceRepository repository, IPurchaseOrderRepository purchaseOrderRepository,
            ISupplierRepository supplierRepository, IEntityKeywordService entityKeywordService)
        {
            _repository = repository;
            _purchaseOrderRepository = purchaseOrderRepository;
            _supplierRepository = supplierRepository;
            _entityKeywordService = entityKeywordService;
        }

        public async Task<PurchaseInvoiceCreateResult> CreateAsync(PurchaseInvoiceRequest request, Guid currentUserId)
        {
            try
            {
                var purchaseOrder = await _purchaseOrderRepository.GetByIdAsync(request.PurchaseOrderId, request.CompanyId);
                if (purchaseOrder == null)
                {
                    return new PurchaseInvoiceCreateResult { StatusCode = 0, Message = "発注が見つかりません。" };
                }

                var supplier = await _supplierRepository.GetByIdAsync(purchaseOrder.SupplierId);

                var purchaseInvoiceCount = await _repository.GetPurchaseInvoiceCountAsync(request.CompanyId, request.IssueDate.Year);
                var purchaseInvoiceNumber = $"PINV-{request.IssueDate.Year}-{(purchaseInvoiceCount + 1):D5}";

                var purchaseInvoice = new PurchaseInvoice
                {
                    Name = purchaseInvoiceNumber,
                    CompanyId = request.CompanyId,
                    SupplierId = purchaseOrder.SupplierId,
                    PurchaseOrderId = purchaseOrder.Id,
                    GoodsReceiptId = request.GoodsReceiptId,
                    PurchaseInvoiceNumber = purchaseInvoiceNumber,
                    SupplierInvoiceNumber = request.SupplierInvoiceNumber,
                    IssueDate = request.IssueDate.Date,
                    DueDate = ComputeDueDate(
                        request.IssueDate.Date,
                        supplier?.PaymentCycleMonths ?? DefaultPaymentCycleMonths,
                        supplier?.PaymentDay ?? DefaultPaymentDay),
                    SubTotalAmount = purchaseOrder.SubTotalAmount,
                    TaxAmount = purchaseOrder.TaxAmount,
                    TotalAmount = purchaseOrder.TotalAmount,
                    Status = "Recorded",
                    Note = request.Note,
                    CreatedBy = currentUserId,
                    UpdatedBy = currentUserId
                };

                var result = await _repository.AddAsync(purchaseInvoice);
                if (result <= 0)
                {
                    return new PurchaseInvoiceCreateResult { StatusCode = 0, Message = "仕入請求書の作成に失敗しました。" };
                }

                await _entityKeywordService.ReplaceValuesAsync(EntityType, purchaseInvoice.Id, request.CustomFieldValues, currentUserId);
                return new PurchaseInvoiceCreateResult { StatusCode = result, PurchaseInvoiceId = purchaseInvoice.Id };
            }
            catch (Exception)
            {
                return new PurchaseInvoiceCreateResult { StatusCode = 0, Message = "仕入請求書の作成に失敗しました。" };
            }
        }

        // 締め日は今回の簡易実装では未使用 — IssueDate（供給元請求書の発行日）を起点に
        // 支払サイト（月数）と支払日をそのまま適用する。締め日をまたぐカットオフ判定は
        // 行わない簡略化（plan §1.1 で明記済みの既知の制約）。
        private static DateTime ComputeDueDate(DateTime issueDate, int paymentCycleMonths, int paymentDay)
        {
            var targetMonth = issueDate.AddMonths(paymentCycleMonths);
            var daysInTargetMonth = DateTime.DaysInMonth(targetMonth.Year, targetMonth.Month);
            var day = paymentDay == EndOfMonthSentinel
                ? daysInTargetMonth
                : Math.Min(paymentDay, daysInTargetMonth);

            return new DateTime(targetMonth.Year, targetMonth.Month, day);
        }

        public async Task<PagedResult<PurchaseInvoiceViewModel>?> GetAllAsync(Guid companyId, Guid? supplierId, string? status, string? purchaseInvoiceNumber, DateTime? issueDateFrom, DateTime? issueDateTo, int pageSize, int pageNumber)
        {
            try
            {
                var purchaseInvoicesFromRepository = await _repository.GetAllAsync(companyId, supplierId, status, purchaseInvoiceNumber, issueDateFrom, issueDateTo, pageSize, pageNumber);
                if (purchaseInvoicesFromRepository == null)
                {
                    return null;
                }

                return new PagedResult<PurchaseInvoiceViewModel>(
                    purchaseInvoicesFromRepository.Items.Select(MapToViewModel),
                    purchaseInvoicesFromRepository.TotalCount,
                    purchaseInvoicesFromRepository.CurrentPage,
                    purchaseInvoicesFromRepository.PageSize);
            }
            catch (Exception)
            {
                return null;
            }
        }

        public async Task<PurchaseInvoiceViewModel?> GetByIdAsync(Guid id, Guid companyId)
        {
            try
            {
                var entity = await _repository.GetByIdAsync(id, companyId);
                if (entity == null)
                {
                    return null;
                }

                var result = MapToViewModel(entity);
                result.CustomFieldValues = await _entityKeywordService.GetByEntityAsync(EntityType, id);
                return result;
            }
            catch (Exception)
            {
                return null;
            }
        }

        public async Task<List<PurchaseInvoiceViewModel>> GetByPurchaseOrderIdAsync(Guid purchaseOrderId, Guid companyId)
        {
            try
            {
                var entities = await _repository.GetByPurchaseOrderIdAsync(purchaseOrderId, companyId);
                return entities.Select(MapToViewModel).ToList();
            }
            catch (Exception)
            {
                return new List<PurchaseInvoiceViewModel>();
            }
        }

        public async Task<int> MarkAsPaidAsync(Guid id, Guid companyId, Guid currentUserId)
        {
            try
            {
                return await _repository.UpdateStatusAsync(id, companyId, "Paid", DateTime.UtcNow.Date, currentUserId);
            }
            catch (Exception)
            {
                return 0;
            }
        }

        private static PurchaseInvoiceViewModel MapToViewModel(PurchaseInvoice purchaseInvoice)
        {
            return new PurchaseInvoiceViewModel
            {
                Id = purchaseInvoice.Id,
                CompanyId = purchaseInvoice.CompanyId,
                SupplierId = purchaseInvoice.SupplierId,
                SupplierName = purchaseInvoice.Supplier?.Name,
                PurchaseOrderId = purchaseInvoice.PurchaseOrderId,
                PurchaseOrderNumber = purchaseInvoice.PurchaseOrder?.PurchaseOrderNumber,
                GoodsReceiptId = purchaseInvoice.GoodsReceiptId,
                PurchaseInvoiceNumber = purchaseInvoice.PurchaseInvoiceNumber,
                SupplierInvoiceNumber = purchaseInvoice.SupplierInvoiceNumber,
                IssueDate = purchaseInvoice.IssueDate,
                DueDate = purchaseInvoice.DueDate,
                SubTotalAmount = purchaseInvoice.SubTotalAmount,
                TaxAmount = purchaseInvoice.TaxAmount,
                TotalAmount = purchaseInvoice.TotalAmount,
                Status = purchaseInvoice.Status,
                PaidDate = purchaseInvoice.PaidDate,
                Note = purchaseInvoice.Note,
                CreatedDate = purchaseInvoice.CreatedDate
            };
        }
    }
}
