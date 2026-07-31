using CaseMngmt.Models.EntityKeywords;

namespace CaseMngmt.Repository.EntityKeywords
{
    public interface IEntityKeywordRepository
    {
        Task<List<EntityKeywordValue>> GetByEntityAsync(string entityType, Guid entityId);
        Task<int> ReplaceValuesAsync(string entityType, Guid entityId, List<EntityKeywordValueRequest> values, Guid currentUserId);
        Task<bool> HasUsageAsync(Guid keywordId);
    }
}
