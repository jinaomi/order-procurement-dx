using CaseMngmt.Models;
using CaseMngmt.Models.GoodsReceipts;
using CaseMngmt.Repository.GoodsReceipts;
using CaseMngmt.Repository.Products;
using CaseMngmt.Repository.PurchaseOrders;

namespace CaseMngmt.Service.GoodsReceipts
{
    public class GoodsReceiptService : IGoodsReceiptService
    {
        private readonly IGoodsReceiptRepository _repository;
        private readonly IPurchaseOrderRepository _purchaseOrderRepository;
        private readonly IProductRepository _productRepository;

        public GoodsReceiptService(IGoodsReceiptRepository repository, IPurchaseOrderRepository purchaseOrderRepository, IProductRepository productRepository)
        {
            _repository = repository;
            _purchaseOrderRepository = purchaseOrderRepository;
            _productRepository = productRepository;
        }

        public async Task<GoodsReceiptCreateResult> CreateAsync(GoodsReceiptRequest request, Guid currentUserId)
        {
            try
            {
                var purchaseOrder = await _purchaseOrderRepository.GetByIdAsync(request.PurchaseOrderId, request.CompanyId);
                if (purchaseOrder == null)
                {
                    return new GoodsReceiptCreateResult { StatusCode = 0, Message = "発注が見つかりません。" };
                }

                var goodsReceipt = new GoodsReceipt
                {
                    CompanyId = request.CompanyId,
                    PurchaseOrderId = purchaseOrder.Id,
                    SupplierId = purchaseOrder.SupplierId,
                    ReceivedDate = request.ReceivedDate,
                    SourceType = string.IsNullOrEmpty(request.SourceType) ? "Manual" : request.SourceType,
                    SourceDocumentPath = request.SourceDocumentPath,
                    Note = request.Note,
                    CreatedBy = currentUserId,
                    UpdatedBy = currentUserId
                };

                var warnings = new List<string>();

                foreach (var itemRequest in request.GoodsReceiptItems)
                {
                    var purchaseOrderItem = purchaseOrder.PurchaseOrderItems.FirstOrDefault(i => i.Id == itemRequest.PurchaseOrderItemId);
                    if (purchaseOrderItem == null)
                    {
                        return new GoodsReceiptCreateResult { StatusCode = 0, Message = "発注明細が見つかりません。" };
                    }

                    var resolvedProductId = itemRequest.ProductId ?? purchaseOrderItem.ProductId;

                    goodsReceipt.GoodsReceiptItems.Add(new GoodsReceiptItem
                    {
                        Name = itemRequest.ProductNameRaw,
                        PurchaseOrderItemId = purchaseOrderItem.Id,
                        ProductId = resolvedProductId,
                        ProductNameRaw = itemRequest.ProductNameRaw,
                        ReceivedQuantity = itemRequest.ReceivedQuantity,
                        Note = itemRequest.Note,
                        CreatedBy = currentUserId,
                        UpdatedBy = currentUserId
                    });

                    // purchaseOrderItem was loaded through the same DbContext as _repository below,
                    // so mutating it here and saving once at the end (via _repository.AddAsync) persists
                    // both the new GoodsReceipt and this cumulative-quantity update atomically.
                    purchaseOrderItem.ReceivedQuantity += itemRequest.ReceivedQuantity;

                    if (purchaseOrderItem.ReceivedQuantity > purchaseOrderItem.Quantity)
                    {
                        warnings.Add($"{purchaseOrderItem.ProductNameRaw}：発注数量（{purchaseOrderItem.Quantity}）を超えて入荷登録されています（累計{purchaseOrderItem.ReceivedQuantity}）。");
                    }
                }

                var allReceived = purchaseOrder.PurchaseOrderItems.All(i => i.ReceivedQuantity >= i.Quantity);
                var anyReceived = purchaseOrder.PurchaseOrderItems.Any(i => i.ReceivedQuantity > 0);
                purchaseOrder.Status = allReceived ? "Received" : anyReceived ? "PartiallyReceived" : purchaseOrder.Status;
                purchaseOrder.UpdatedBy = currentUserId;
                purchaseOrder.UpdatedDate = DateTime.UtcNow;

                // Physical stock is incremented once goods are actually received — symmetric to how
                // InvoiceService decrements stock only at invoice/shipment time, not at order confirmation.
                var receivedProductIds = goodsReceipt.GoodsReceiptItems
                    .Where(i => i.ProductId.HasValue)
                    .Select(i => i.ProductId!.Value)
                    .Distinct()
                    .ToList();

                if (receivedProductIds.Count > 0)
                {
                    var products = await _productRepository.GetByIdsAsync(receivedProductIds);
                    foreach (var item in goodsReceipt.GoodsReceiptItems.Where(i => i.ProductId.HasValue))
                    {
                        var product = products.FirstOrDefault(p => p.Id == item.ProductId!.Value);
                        if (product != null)
                        {
                            product.StockQuantity += item.ReceivedQuantity;
                        }
                    }
                }

                var goodsReceiptCount = await _repository.GetGoodsReceiptCountAsync(request.CompanyId, goodsReceipt.ReceivedDate.Year);
                goodsReceipt.GoodsReceiptNumber = $"GR-{goodsReceipt.ReceivedDate.Year}-{(goodsReceiptCount + 1):D5}";
                goodsReceipt.Name = goodsReceipt.GoodsReceiptNumber;

                var result = await _repository.AddAsync(goodsReceipt);
                if (result <= 0)
                {
                    return new GoodsReceiptCreateResult { StatusCode = 0, Message = "入荷登録に失敗しました。" };
                }

                return new GoodsReceiptCreateResult { StatusCode = result, GoodsReceiptId = goodsReceipt.Id, OverDeliveryWarnings = warnings };
            }
            catch (Exception)
            {
                return new GoodsReceiptCreateResult { StatusCode = 0, Message = "入荷登録に失敗しました。" };
            }
        }

        public async Task<PagedResult<GoodsReceiptViewModel>?> GetAllAsync(Guid companyId, Guid? purchaseOrderId, Guid? supplierId, int pageSize, int pageNumber)
        {
            try
            {
                var goodsReceiptsFromRepository = await _repository.GetAllAsync(companyId, purchaseOrderId, supplierId, pageSize, pageNumber);
                if (goodsReceiptsFromRepository == null)
                {
                    return null;
                }

                return new PagedResult<GoodsReceiptViewModel>(
                    goodsReceiptsFromRepository.Items.Select(MapToViewModel),
                    goodsReceiptsFromRepository.TotalCount,
                    goodsReceiptsFromRepository.CurrentPage,
                    goodsReceiptsFromRepository.PageSize);
            }
            catch (Exception)
            {
                return null;
            }
        }

        public async Task<GoodsReceiptViewModel?> GetByIdAsync(Guid id, Guid companyId)
        {
            try
            {
                var entity = await _repository.GetByIdAsync(id, companyId);
                return entity == null ? null : MapToViewModel(entity);
            }
            catch (Exception)
            {
                return null;
            }
        }

        public async Task<List<GoodsReceiptViewModel>> GetByPurchaseOrderIdAsync(Guid purchaseOrderId, Guid companyId)
        {
            try
            {
                var entities = await _repository.GetByPurchaseOrderIdAsync(purchaseOrderId, companyId);
                return entities.Select(MapToViewModel).ToList();
            }
            catch (Exception)
            {
                return new List<GoodsReceiptViewModel>();
            }
        }

        private static GoodsReceiptViewModel MapToViewModel(GoodsReceipt goodsReceipt)
        {
            return new GoodsReceiptViewModel
            {
                Id = goodsReceipt.Id,
                CompanyId = goodsReceipt.CompanyId,
                PurchaseOrderId = goodsReceipt.PurchaseOrderId,
                PurchaseOrderNumber = goodsReceipt.PurchaseOrder?.PurchaseOrderNumber,
                SupplierId = goodsReceipt.SupplierId,
                SupplierName = goodsReceipt.Supplier?.Name,
                GoodsReceiptNumber = goodsReceipt.GoodsReceiptNumber,
                ReceivedDate = goodsReceipt.ReceivedDate,
                SourceType = goodsReceipt.SourceType,
                SourceDocumentPath = goodsReceipt.SourceDocumentPath,
                Note = goodsReceipt.Note,
                CreatedBy = goodsReceipt.CreatedBy,
                UpdatedBy = goodsReceipt.UpdatedBy,
                CreatedDate = goodsReceipt.CreatedDate,
                UpdatedDate = goodsReceipt.UpdatedDate,
                GoodsReceiptItems = goodsReceipt.GoodsReceiptItems.Select(i => new GoodsReceiptItemViewModel
                {
                    Id = i.Id,
                    GoodsReceiptId = i.GoodsReceiptId,
                    PurchaseOrderItemId = i.PurchaseOrderItemId,
                    ProductId = i.ProductId,
                    ProductNameRaw = i.ProductNameRaw,
                    ReceivedQuantity = i.ReceivedQuantity,
                    Note = i.Note
                }).ToList()
            };
        }
    }
}
