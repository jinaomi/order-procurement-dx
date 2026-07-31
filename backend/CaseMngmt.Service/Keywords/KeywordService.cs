using AutoMapper;
using CaseMngmt.Models.Keywords;
using CaseMngmt.Repository.Keywords;
using CaseMngmt.Repository.EntityKeywords;

namespace CaseMngmt.Service.Keywords
{
    public class KeywordService : IKeywordService
    {
        private IKeywordRepository _repository;
        private readonly IEntityKeywordRepository _entityKeywordRepository;
        private readonly IMapper _mapper;
        public KeywordService(IKeywordRepository repository, IEntityKeywordRepository entityKeywordRepository, IMapper mapper)
        {
            _repository = repository;
            _entityKeywordRepository = entityKeywordRepository;
            _mapper = mapper;
        }

        public async Task<int> AddAsync(KeywordRequest request)
        {
            try
            {
                var entity = _mapper.Map<Keyword>(request);
                return await _repository.AddAsync(entity);
            }
            catch (Exception ex)
            {
                return 0;
            }
        }

        public async Task<int> DeleteAsync(Guid id)
        {
            try
            {
                return await _repository.DeleteAsync(id);
            }
            catch (Exception ex)
            {
                return 0;
            }
        }

        public async Task<IEnumerable<KeywordViewModel>?> GetAllAsync(int pageSize, int pageNumber)
        {
            try
            {
                var result = await _repository.GetAllAsync(pageSize, pageNumber);
                return result;
            }
            catch (Exception ex)
            {
                return null;
            }
        }

        public async Task<KeywordViewModel?> GetByIdAsync(Guid id)
        {
            try
            {
                var entity = await _repository.GetByIdAsync(id);
                var result = _mapper.Map<KeywordViewModel>(entity);
                return result;
            }
            catch (Exception ex)
            {
                return null;
            }
        }

        public async Task<int> UpdateAsync(Guid Id, KeywordRequest request)
        {
            try
            {
                var entity = await _repository.GetByIdAsync(Id);
                if (entity == null)
                {
                    return 0;
                }

                entity.Name = request.Name;
                entity.MaxLength = request.MaxLength;
                entity.IsRequired = request.IsRequired;
                entity.Order = request.Order;
                entity.CaseSearchable = request.CaseSearchable;
                entity.DocumentSearchable = request.DocumentSearchable;
                entity.IsShowOnCaseList = request.IsShowOnCaseList;
                entity.IsShowOnTemplate = request.IsShowOnTemplate;
                entity.OptionsList = request.OptionsList;
                entity.IsHidden = request.IsHidden;
                entity.IsHiddenForUser = request.IsHiddenForUser;
                entity.UpdatedDate = DateTime.UtcNow;
                await _repository.UpdateAsync(entity);
                return 1;
            }
            catch (Exception ex)
            {
                return 0;
            }
        }

        public async Task<List<KeywordViewModel>?> GetByTemplateIdForBuilderAsync(Guid templateId)
        {
            try
            {
                return await _repository.GetByTemplateIdForBuilderAsync(templateId);
            }
            catch (Exception ex)
            {
                return null;
            }
        }

        public async Task<int> SoftDeleteAsync(Guid id)
        {
            try
            {
                var moduleType = await _repository.GetModuleTypeByKeywordIdAsync(id);
                var inUse = moduleType == "Case"
                    ? await _repository.HasCaseKeywordsAsync(id)
                    : await _entityKeywordRepository.HasUsageAsync(id);
                if (inUse)
                {
                    return -1;
                }
                return await _repository.SoftHideAsync(id);
            }
            catch (Exception ex)
            {
                return 0;
            }
        }

        public async Task<int> ReorderAsync(List<KeywordReorderRequest> items)
        {
            try
            {
                return await _repository.ReorderAsync(items);
            }
            catch (Exception ex)
            {
                return 0;
            }
        }
    }
}
