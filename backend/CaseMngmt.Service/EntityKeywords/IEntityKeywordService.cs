using CaseMngmt.Models.EntityKeywords;

namespace CaseMngmt.Service.EntityKeywords
{
    public interface IEntityKeywordService
    {
        Task<List<EntityKeywordValue>> GetByEntityAsync(string entityType, Guid entityId);
        Task<int> ReplaceValuesAsync(string entityType, Guid entityId, List<EntityKeywordValueRequest> values, Guid currentUserId);
    }
}
