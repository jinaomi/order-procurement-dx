using CaseMngmt.Models;
using CaseMngmt.Models.PurchaseOrders;
using CaseMngmt.Repository.Products;
using CaseMngmt.Repository.PurchaseInvoices;
using CaseMngmt.Repository.PurchaseOrders;
using CaseMngmt.Service.EntityKeywords;

namespace CaseMngmt.Service.PurchaseOrders
{
    public class PurchaseOrderService : IPurchaseOrderService
    {
        private readonly IPurchaseOrderRepository _repository;
        private readonly IProductRepository _productRepository;
        private readonly IPurchaseInvoiceRepository _purchaseInvoiceRepository;
        private readonly IEntityKeywordService _entityKeywordService;

        private const string EntityType = "PurchaseOrder";

        public PurchaseOrderService(
            IPurchaseOrderRepository repository,
            IProductRepository productRepository,
            IPurchaseInvoiceRepository purchaseInvoiceRepository,
            IEntityKeywordService entityKeywordService)
        {
            _repository = repository;
            _productRepository = productRepository;
            _purchaseInvoiceRepository = purchaseInvoiceRepository;
            _entityKeywordService = entityKeywordService;
        }

        public async Task<Guid?> CreatePurchaseOrderAsync(PurchaseOrderRequest request, Guid currentUserId)
        {
            try
            {
                var companyProducts = await _productRepository.GetAllAsync(request.CompanyId);

                var purchaseOrder = new PurchaseOrder
                {
                    CompanyId = request.CompanyId,
                    SupplierId = request.SupplierId,
                    OrderDate = request.OrderDate,
                    ExpectedDeliveryDate = request.ExpectedDeliveryDate,
                    SourceType = string.IsNullOrEmpty(request.SourceType) ? "Manual" : request.SourceType,
                    SourceDocumentPath = request.SourceDocumentPath,
                    Note = request.Note,
                    Status = "Confirmed",
                    CreatedBy = currentUserId,
                    UpdatedBy = currentUserId
                };

                decimal subTotal = 0;
                foreach (var itemRequest in request.PurchaseOrderItems)
                {
                    var resolvedProductId = itemRequest.ProductId;
                    if (!resolvedProductId.HasValue)
                    {
                        var matchedProduct = companyProducts.FirstOrDefault(p =>
                            p.Name.Trim().Equals(itemRequest.ProductNameRaw.Trim(), StringComparison.OrdinalIgnoreCase));
                        resolvedProductId = matchedProduct?.Id;
                    }

                    var lineAmount = itemRequest.Quantity * itemRequest.UnitPrice;
                    subTotal += lineAmount;

                    purchaseOrder.PurchaseOrderItems.Add(new PurchaseOrderItem
                    {
                        Name = itemRequest.ProductNameRaw,
                        ProductId = resolvedProductId,
                        ProductNameRaw = itemRequest.ProductNameRaw,
                        Quantity = itemRequest.Quantity,
                        UnitPrice = itemRequest.UnitPrice,
                        LineAmount = lineAmount,
                        ReceivedQuantity = 0,
                        Note = itemRequest.Note,
                        CreatedBy = currentUserId,
                        UpdatedBy = currentUserId
                    });
                }

                purchaseOrder.SubTotalAmount = subTotal;
                purchaseOrder.TaxAmount = 0;
                purchaseOrder.TotalAmount = subTotal;

                var purchaseOrderCount = await _repository.GetPurchaseOrderCountAsync(request.CompanyId, purchaseOrder.OrderDate.Year);
                purchaseOrder.PurchaseOrderNumber = $"PO-{purchaseOrder.OrderDate.Year}-{(purchaseOrderCount + 1):D5}";
                purchaseOrder.Name = purchaseOrder.PurchaseOrderNumber;

                var result = await _repository.AddAsync(purchaseOrder);
                if (result <= 0)
                {
                    return null;
                }

                await _entityKeywordService.ReplaceValuesAsync(EntityType, purchaseOrder.Id, request.CustomFieldValues, currentUserId);
                return purchaseOrder.Id;
            }
            catch (Exception)
            {
                return null;
            }
        }

        public async Task<int> DeleteAsync(Guid id, Guid companyId, Guid currentUserId)
        {
            try
            {
                return await _repository.DeleteAsync(id, companyId, currentUserId);
            }
            catch (Exception)
            {
                return 0;
            }
        }

        public async Task<PagedResult<PurchaseOrderViewModel>?> GetAllPurchaseOrdersAsync(Guid companyId, string? status, Guid? supplierId, DateTime? orderDateFrom, DateTime? orderDateTo, int pageSize, int pageNumber)
        {
            try
            {
                var purchaseOrdersFromRepository = await _repository.GetAllAsync(companyId, status, supplierId, orderDateFrom, orderDateTo, pageSize, pageNumber);
                if (purchaseOrdersFromRepository == null)
                {
                    return null;
                }

                var viewModels = purchaseOrdersFromRepository.Items.Select(MapToViewModel).ToList();

                return new PagedResult<PurchaseOrderViewModel>(
                    viewModels,
                    purchaseOrdersFromRepository.TotalCount,
                    purchaseOrdersFromRepository.CurrentPage,
                    purchaseOrdersFromRepository.PageSize);
            }
            catch (Exception)
            {
                return null;
            }
        }

        public async Task<PurchaseOrderViewModel?> GetByIdAsync(Guid id, Guid companyId)
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

        public async Task<int> UpdatePurchaseOrderAsync(Guid id, PurchaseOrderRequest request, Guid currentUserId)
        {
            try
            {
                var entity = await _repository.GetByIdAsync(id, request.CompanyId);
                if (entity == null)
                {
                    return 0;
                }

                var companyProducts = await _productRepository.GetAllAsync(request.CompanyId);

                entity.SupplierId = request.SupplierId;
                entity.OrderDate = request.OrderDate;
                entity.ExpectedDeliveryDate = request.ExpectedDeliveryDate;
                entity.Note = request.Note;
                entity.UpdatedBy = currentUserId;
                entity.UpdatedDate = DateTime.UtcNow;

                foreach (var existingItem in entity.PurchaseOrderItems)
                {
                    existingItem.Deleted = true;
                }

                decimal subTotal = 0;
                var newItems = new List<PurchaseOrderItem>();
                foreach (var itemRequest in request.PurchaseOrderItems)
                {
                    var resolvedProductId = itemRequest.ProductId;
                    if (!resolvedProductId.HasValue)
                    {
                        var matchedProduct = companyProducts.FirstOrDefault(p =>
                            p.Name.Trim().Equals(itemRequest.ProductNameRaw.Trim(), StringComparison.OrdinalIgnoreCase));
                        resolvedProductId = matchedProduct?.Id;
                    }

                    var lineAmount = itemRequest.Quantity * itemRequest.UnitPrice;
                    subTotal += lineAmount;

                    newItems.Add(new PurchaseOrderItem
                    {
                        Name = itemRequest.ProductNameRaw,
                        PurchaseOrderId = entity.Id,
                        ProductId = resolvedProductId,
                        ProductNameRaw = itemRequest.ProductNameRaw,
                        Quantity = itemRequest.Quantity,
                        UnitPrice = itemRequest.UnitPrice,
                        LineAmount = lineAmount,
                        ReceivedQuantity = 0,
                        Note = itemRequest.Note,
                        CreatedBy = currentUserId,
                        UpdatedBy = currentUserId
                    });
                }

                entity.SubTotalAmount = subTotal;
                entity.TotalAmount = subTotal + entity.TaxAmount;

                var updateResult = await _repository.UpdateAsync(entity, newItems);
                if (updateResult > 0)
                {
                    await _entityKeywordService.ReplaceValuesAsync(EntityType, entity.Id, request.CustomFieldValues, currentUserId);
                }
                return updateResult;
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
                return await _repository.UpdateStatusAsync(id, companyId, status, currentUserId);
            }
            catch (Exception)
            {
                return 0;
            }
        }

        public async Task<PurchaseOrderReconciliationViewModel?> GetReconciliationAsync(Guid id, Guid companyId)
        {
            try
            {
                var purchaseOrder = await _repository.GetByIdAsync(id, companyId);
                if (purchaseOrder == null)
                {
                    return null;
                }

                var invoices = await _purchaseInvoiceRepository.GetByPurchaseOrderIdAsync(id, companyId);

                var items = purchaseOrder.PurchaseOrderItems.Select(i => new PurchaseOrderReconciliationItem
                {
                    PurchaseOrderItemId = i.Id,
                    ProductNameRaw = i.ProductNameRaw,
                    OrderedQuantity = i.Quantity,
                    ReceivedQuantity = i.ReceivedQuantity,
                    IsOverDelivered = i.ReceivedQuantity > i.Quantity
                }).ToList();

                var isFullyReceived = purchaseOrder.PurchaseOrderItems.All(i => i.ReceivedQuantity >= i.Quantity);
                var isPartiallyReceived = !isFullyReceived && purchaseOrder.PurchaseOrderItems.Any(i => i.ReceivedQuantity > 0);

                var invoicedTotal = invoices.Sum(inv => inv.TotalAmount);
                var isInvoiceReceived = invoices.Count > 0;
                var isFullyPaid = isInvoiceReceived && invoices.All(inv => inv.Status == "Paid");

                // Only flag as a mismatch once receiving is done — while goods are still arriving in
                // partial shipments, the supplier may simply not have billed the full amount yet, which
                // isn't a discrepancy worth surfacing.
                var hasAmountMismatch = isFullyReceived && isInvoiceReceived && invoicedTotal != purchaseOrder.TotalAmount;

                return new PurchaseOrderReconciliationViewModel
                {
                    PurchaseOrderId = purchaseOrder.Id,
                    PurchaseOrderNumber = purchaseOrder.PurchaseOrderNumber,
                    Status = purchaseOrder.Status,
                    OrderedTotalAmount = purchaseOrder.TotalAmount,
                    InvoicedTotalAmount = invoicedTotal,
                    IsFullyReceived = isFullyReceived,
                    IsPartiallyReceived = isPartiallyReceived,
                    IsInvoiceReceived = isInvoiceReceived,
                    IsFullyPaid = isFullyPaid,
                    HasAmountMismatch = hasAmountMismatch,
                    Items = items,
                    Invoices = invoices.Select(inv => new PurchaseInvoiceSummary
                    {
                        Id = inv.Id,
                        PurchaseInvoiceNumber = inv.PurchaseInvoiceNumber,
                        TotalAmount = inv.TotalAmount,
                        Status = inv.Status,
                        PaidDate = inv.PaidDate
                    }).ToList()
                };
            }
            catch (Exception)
            {
                return null;
            }
        }

        private static PurchaseOrderViewModel MapToViewModel(PurchaseOrder purchaseOrder)
        {
            return new PurchaseOrderViewModel
            {
                Id = purchaseOrder.Id,
                CompanyId = purchaseOrder.CompanyId,
                SupplierId = purchaseOrder.SupplierId,
                SupplierName = purchaseOrder.Supplier?.Name,
                PurchaseOrderNumber = purchaseOrder.PurchaseOrderNumber,
                OrderDate = purchaseOrder.OrderDate,
                ExpectedDeliveryDate = purchaseOrder.ExpectedDeliveryDate,
                Status = purchaseOrder.Status,
                SourceType = purchaseOrder.SourceType,
                SourceDocumentPath = purchaseOrder.SourceDocumentPath,
                SubTotalAmount = purchaseOrder.SubTotalAmount,
                TaxAmount = purchaseOrder.TaxAmount,
                TotalAmount = purchaseOrder.TotalAmount,
                Note = purchaseOrder.Note,
                CreatedBy = purchaseOrder.CreatedBy,
                UpdatedBy = purchaseOrder.UpdatedBy,
                CreatedDate = purchaseOrder.CreatedDate,
                UpdatedDate = purchaseOrder.UpdatedDate,
                PurchaseOrderItems = purchaseOrder.PurchaseOrderItems.Select(i => new PurchaseOrderItemViewModel
                {
                    Id = i.Id,
                    PurchaseOrderId = i.PurchaseOrderId,
                    ProductId = i.ProductId,
                    ProductNameRaw = i.ProductNameRaw,
                    Quantity = i.Quantity,
                    UnitPrice = i.UnitPrice,
                    LineAmount = i.LineAmount,
                    ReceivedQuantity = i.ReceivedQuantity,
                    Note = i.Note
                }).ToList()
            };
        }
    }
}
