using CaseMngmt.Models.EntityKeywords;
using CaseMngmt.Repository.EntityKeywords;

namespace CaseMngmt.Service.EntityKeywords
{
    public class EntityKeywordService : IEntityKeywordService
    {
        private readonly IEntityKeywordRepository _repository;

        public EntityKeywordService(IEntityKeywordRepository repository)
        {
            _repository = repository;
        }

        public async Task<List<EntityKeywordValue>> GetByEntityAsync(string entityType, Guid entityId)
        {
            try
            {
                return await _repository.GetByEntityAsync(entityType, entityId);
            }
            catch (Exception)
            {
                return new List<EntityKeywordValue>();
            }
        }

        public async Task<int> ReplaceValuesAsync(string entityType, Guid entityId, List<EntityKeywordValueRequest> values, Guid currentUserId)
        {
            try
            {
                return await _repository.ReplaceValuesAsync(entityType, entityId, values ?? new List<EntityKeywordValueRequest>(), currentUserId);
            }
            catch (Exception)
            {
                return 0;
            }
        }
    }
}
