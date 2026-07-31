using CaseMngmt.Models;
using CaseMngmt.Models.Orders;
using CaseMngmt.Repository.AiMatching;
using CaseMngmt.Repository.Orders;
using CaseMngmt.Repository.Products;
using CaseMngmt.Service.EntityKeywords;

namespace CaseMngmt.Service.Orders
{
    public class OrderService : IOrderService
    {
        private readonly IOrderRepository _repository;
        private readonly IProductRepository _productRepository;
        private readonly IOrderRiskRepository _riskRepository;
        private readonly IEntityKeywordService _entityKeywordService;

        private const string EntityType = "Order";

        public OrderService(IOrderRepository repository, IProductRepository productRepository, IOrderRiskRepository riskRepository, IEntityKeywordService entityKeywordService)
        {
            _repository = repository;
            _productRepository = productRepository;
            _riskRepository = riskRepository;
            _entityKeywordService = entityKeywordService;
        }

        public async Task<Guid?> CreateOrderAsync(OrderRequest request, Guid currentUserId)
        {
            try
            {
                var companyProducts = await _productRepository.GetAllAsync(request.CompanyId);

                var order = new Order
                {
                    CompanyId = request.CompanyId,
                    CustomerId = request.CustomerId,
                    OrderDate = request.OrderDate,
                    RequestedDeliveryDate = request.RequestedDeliveryDate,
                    SourceType = string.IsNullOrEmpty(request.SourceType) ? "Manual" : request.SourceType,
                    SourceDocumentPath = request.SourceDocumentPath,
                    Note = request.Note,
                    Status = "Confirmed",
                    CreatedBy = currentUserId,
                    UpdatedBy = currentUserId
                };

                decimal subTotal = 0;
                foreach (var itemRequest in request.OrderItems)
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

                    order.OrderItems.Add(new OrderItem
                    {
                        Name = itemRequest.ProductNameRaw,
                        ProductId = resolvedProductId,
                        ProductNameRaw = itemRequest.ProductNameRaw,
                        Quantity = itemRequest.Quantity,
                        UnitPrice = itemRequest.UnitPrice,
                        LineAmount = lineAmount,
                        Note = itemRequest.Note,
                        CreatedBy = currentUserId,
                        UpdatedBy = currentUserId
                    });
                }

                order.SubTotalAmount = subTotal;
                order.TaxAmount = 0;
                order.TotalAmount = subTotal;

                var orderCount = await _repository.GetOrderCountAsync(request.CompanyId, order.OrderDate.Year);
                order.OrderNumber = $"ORD-{order.OrderDate.Year}-{(orderCount + 1):D5}";
                order.Name = order.OrderNumber;

                var result = await _repository.AddAsync(order);
                if (result <= 0)
                {
                    return null;
                }

                await _entityKeywordService.ReplaceValuesAsync(EntityType, order.Id, request.CustomFieldValues, currentUserId);
                return order.Id;
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

        public async Task<PagedResult<OrderViewModel>?> GetAllOrdersAsync(Guid companyId, string? status, Guid? customerId, DateTime? orderDateFrom, DateTime? orderDateTo, int pageSize, int pageNumber)
        {
            try
            {
                var ordersFromRepository = await _repository.GetAllAsync(companyId, status, customerId, orderDateFrom, orderDateTo, pageSize, pageNumber);
                if (ordersFromRepository == null)
                {
                    return null;
                }

                var viewModels = ordersFromRepository.Items.Select(MapToViewModel).ToList();

                var orderIds = viewModels.Select(v => v.Id).ToList();
                var riskLevels = await _riskRepository.GetOverallRiskLevelsByOrderIdsAsync(orderIds);
                foreach (var viewModel in viewModels)
                {
                    viewModel.RiskLevel = riskLevels.GetValueOrDefault(viewModel.Id);
                }

                return new PagedResult<OrderViewModel>(
                    viewModels,
                    ordersFromRepository.TotalCount,
                    ordersFromRepository.CurrentPage,
                    ordersFromRepository.PageSize);
            }
            catch (Exception)
            {
                return null;
            }
        }

        public async Task<OrderViewModel?> GetByIdAsync(Guid id, Guid companyId)
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

        public async Task<int> UpdateOrderAsync(Guid id, OrderRequest request, Guid currentUserId)
        {
            try
            {
                var entity = await _repository.GetByIdAsync(id, request.CompanyId);
                if (entity == null)
                {
                    return 0;
                }

                var companyProducts = await _productRepository.GetAllAsync(request.CompanyId);

                entity.CustomerId = request.CustomerId;
                entity.OrderDate = request.OrderDate;
                entity.RequestedDeliveryDate = request.RequestedDeliveryDate;
                entity.Note = request.Note;
                entity.UpdatedBy = currentUserId;
                entity.UpdatedDate = DateTime.UtcNow;

                foreach (var existingItem in entity.OrderItems)
                {
                    existingItem.Deleted = true;
                }

                decimal subTotal = 0;
                var newItems = new List<OrderItem>();
                foreach (var itemRequest in request.OrderItems)
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

                    newItems.Add(new OrderItem
                    {
                        Name = itemRequest.ProductNameRaw,
                        OrderId = entity.Id,
                        ProductId = resolvedProductId,
                        ProductNameRaw = itemRequest.ProductNameRaw,
                        Quantity = itemRequest.Quantity,
                        UnitPrice = itemRequest.UnitPrice,
                        LineAmount = lineAmount,
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

        private static OrderViewModel MapToViewModel(Order order)
        {
            return new OrderViewModel
            {
                Id = order.Id,
                CompanyId = order.CompanyId,
                CustomerId = order.CustomerId,
                CustomerName = order.Customer?.Name,
                OrderNumber = order.OrderNumber,
                OrderDate = order.OrderDate,
                RequestedDeliveryDate = order.RequestedDeliveryDate,
                Status = order.Status,
                SourceType = order.SourceType,
                SourceDocumentPath = order.SourceDocumentPath,
                SubTotalAmount = order.SubTotalAmount,
                TaxAmount = order.TaxAmount,
                TotalAmount = order.TotalAmount,
                Note = order.Note,
                CreatedBy = order.CreatedBy,
                UpdatedBy = order.UpdatedBy,
                CreatedDate = order.CreatedDate,
                UpdatedDate = order.UpdatedDate,
                OrderItems = order.OrderItems.Select(i => new OrderItemViewModel
                {
                    Id = i.Id,
                    OrderId = i.OrderId,
                    ProductId = i.ProductId,
                    ProductNameRaw = i.ProductNameRaw,
                    Quantity = i.Quantity,
                    UnitPrice = i.UnitPrice,
                    LineAmount = i.LineAmount,
                    Note = i.Note
                }).ToList()
            };
        }
    }
}
