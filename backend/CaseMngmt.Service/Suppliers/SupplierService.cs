using AutoMapper;
using CaseMngmt.Models;
using CaseMngmt.Models.Suppliers;
using CaseMngmt.Repository.Suppliers;
using CaseMngmt.Service.EntityKeywords;

namespace CaseMngmt.Service.Suppliers
{
    public class SupplierService : ISupplierService
    {
        private ISupplierRepository _repository;
        private readonly IEntityKeywordService _entityKeywordService;
        private readonly IMapper _mapper;

        private const string EntityType = "Supplier";

        public SupplierService(ISupplierRepository repository, IEntityKeywordService entityKeywordService, IMapper mapper)
        {
            _repository = repository;
            _entityKeywordService = entityKeywordService;
            _mapper = mapper;
        }

        public async Task<Guid?> AddSupplierAsync(SupplierRequest supplier)
        {
            try
            {
                var entity = _mapper.Map<Supplier>(supplier);
                entity.CompanyId = supplier.CompanyId;
                entity.CreatedBy = supplier.CreatedBy ?? Guid.Empty;
                entity.UpdatedBy = supplier.UpdatedBy ?? Guid.Empty;
                var result = await _repository.AddAsync(entity);

                if (result > 0)
                {
                    await _entityKeywordService.ReplaceValuesAsync(EntityType, entity.Id, supplier.CustomFieldValues, entity.CreatedBy);
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

        public async Task<PagedResult<SupplierViewModel>?> GetAllSuppliersAsync(Guid companyId, string? name, int pageSize, int pageNumber)
        {
            try
            {
                var suppliersFromRepository = await _repository.GetAllAsync(companyId, name, pageSize, pageNumber);
                var result = _mapper.Map<PagedResult<SupplierViewModel>>(suppliersFromRepository);
                return result;
            }
            catch (Exception)
            {
                return null;
            }
        }

        public async Task<List<SupplierViewModel>> GetAllSuppliersAsync(Guid companyId)
        {
            try
            {
                var suppliersFromRepository = await _repository.GetAllAsync(companyId);
                return _mapper.Map<List<SupplierViewModel>>(suppliersFromRepository);
            }
            catch (Exception)
            {
                return new List<SupplierViewModel>();
            }
        }

        public async Task<List<Supplier>> GetByIdsAsync(List<Guid> ids)
        {
            try
            {
                return await _repository.GetByIdsAsync(ids);
            }
            catch (Exception)
            {
                return new List<Supplier>();
            }
        }

        public async Task<SupplierViewModel?> GetByIdAsync(Guid id)
        {
            try
            {
                var entity = await _repository.GetByIdAsync(id);
                if (entity == null)
                {
                    return null;
                }

                var result = _mapper.Map<SupplierViewModel>(entity);
                result.CustomFieldValues = await _entityKeywordService.GetByEntityAsync(EntityType, id);
                return result;
            }
            catch (Exception)
            {
                return null;
            }
        }

        public async Task<int> UpdateSupplierAsync(Guid id, SupplierRequest supplier)
        {
            try
            {
                var entity = await _repository.GetByIdAsync(id);
                if (entity == null)
                {
                    return 0;
                }

                entity.Name = supplier.Name;
                entity.ContactName = supplier.ContactName;
                entity.PhoneNumber = supplier.PhoneNumber;
                entity.PostCode1 = supplier.PostCode1;
                entity.PostCode2 = supplier.PostCode2;
                entity.StateProvince = supplier.StateProvince;
                entity.City = supplier.City;
                entity.Street = supplier.Street;
                entity.BuildingName = supplier.BuildingName;
                entity.RoomNumber = supplier.RoomNumber;
                entity.ClosingDay = supplier.ClosingDay;
                entity.PaymentCycleMonths = supplier.PaymentCycleMonths;
                entity.PaymentDay = supplier.PaymentDay;
                entity.Note = supplier.Note;
                entity.CompanyId = supplier.CompanyId;
                entity.UpdatedBy = supplier.UpdatedBy ?? Guid.Empty;
                entity.UpdatedDate = DateTime.UtcNow;

                await _repository.UpdateAsync(entity);
                await _entityKeywordService.ReplaceValuesAsync(EntityType, entity.Id, supplier.CustomFieldValues, entity.UpdatedBy);
                return 1;
            }
            catch (Exception)
            {
                return 0;
            }
        }
    }
}
