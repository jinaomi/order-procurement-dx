using AutoMapper;
using CaseMngmt.Models;
using CaseMngmt.Models.Products;
using CaseMngmt.Repository.Products;
using CaseMngmt.Service.EntityKeywords;

namespace CaseMngmt.Service.Products
{
    public class ProductService : IProductService
    {
        private IProductRepository _repository;
        private readonly IEntityKeywordService _entityKeywordService;
        private readonly IMapper _mapper;

        private const string EntityType = "Product";

        public ProductService(IProductRepository repository, IEntityKeywordService entityKeywordService, IMapper mapper)
        {
            _repository = repository;
            _entityKeywordService = entityKeywordService;
            _mapper = mapper;
        }

        public async Task<Guid?> AddProductAsync(ProductRequest product)
        {
            try
            {
                var entity = _mapper.Map<Product>(product);
                entity.CompanyId = product.CompanyId;
                entity.CreatedBy = product.CreatedBy ?? Guid.Empty;
                entity.UpdatedBy = product.UpdatedBy ?? Guid.Empty;
                var result = await _repository.AddAsync(entity);

                if (result > 0)
                {
                    await _entityKeywordService.ReplaceValuesAsync(EntityType, entity.Id, product.CustomFieldValues, entity.CreatedBy);
                    return entity.Id;
                }
                return null;
            }
            catch (Exception)
            {
                return null;
            }
        }

        public async Task<int> DeleteAsync(Guid id, Guid currentUserId)
        {
            try
            {
                return await _repository.DeleteAsync(id, currentUserId);
            }
            catch (Exception)
            {
                return 0;
            }
        }

        public async Task<PagedResult<ProductViewModel>?> GetAllProductsAsync(Guid companyId, string? name, int pageSize, int pageNumber)
        {
            try
            {
                var productsFromRepository = await _repository.GetAllAsync(companyId, name, pageSize, pageNumber);
                var result = _mapper.Map<PagedResult<ProductViewModel>>(productsFromRepository);
                return result;
            }
            catch (Exception)
            {
                return null;
            }
        }

        public async Task<List<ProductViewModel>> GetAllProductsAsync(Guid companyId)
        {
            try
            {
                var productsFromRepository = await _repository.GetAllAsync(companyId);
                return _mapper.Map<List<ProductViewModel>>(productsFromRepository);
            }
            catch (Exception)
            {
                return new List<ProductViewModel>();
            }
        }

        public async Task<List<Product>> GetByIdsAsync(List<Guid> ids)
        {
            try
            {
                return await _repository.GetByIdsAsync(ids);
            }
            catch (Exception)
            {
                return new List<Product>();
            }
        }

        public async Task<ProductViewModel?> GetByIdAsync(Guid id)
        {
            try
            {
                var entity = await _repository.GetByIdAsync(id);
                if (entity == null)
                {
                    return null;
                }

                var result = _mapper.Map<ProductViewModel>(entity);
                result.CustomFieldValues = await _entityKeywordService.GetByEntityAsync(EntityType, id);
                return result;
            }
            catch (Exception)
            {
                return null;
            }
        }

        public async Task<int> UpdateProductAsync(Guid id, ProductRequest product)
        {
            try
            {
                var entity = await _repository.GetByIdAsync(id);
                if (entity == null)
                {
                    return 0;
                }

                entity.Name = product.Name;
                entity.ProductCode = product.ProductCode;
                entity.StockQuantity = product.StockQuantity;
                entity.UnitOfMeasure = product.UnitOfMeasure;
                entity.ProductionCapacityPerDay = product.ProductionCapacityPerDay;
                entity.UnitPrice = product.UnitPrice;
                entity.Note = product.Note;
                entity.CompanyId = product.CompanyId;
                entity.UpdatedBy = product.UpdatedBy ?? Guid.Empty;
                entity.UpdatedDate = DateTime.UtcNow;

                await _repository.UpdateAsync(entity);
                await _entityKeywordService.ReplaceValuesAsync(EntityType, entity.Id, product.CustomFieldValues, entity.UpdatedBy);
                return 1;
            }
            catch (Exception)
            {
                return 0;
            }
        }
    }
}
