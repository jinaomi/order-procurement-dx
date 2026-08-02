using CaseMngmt.Models.CaseKeywords;
using CaseMngmt.Models.EntityKeywords;
using CaseMngmt.Models.FileUploads;

namespace CaseMngmt.Repository.EntityKeywords
{
    public interface IEntityKeywordRepository
    {
        Task<List<EntityKeywordValue>> GetByEntityAsync(string entityType, Guid entityId);
        Task<int> ReplaceValuesAsync(string entityType, Guid entityId, List<EntityKeywordValueRequest> values, Guid currentUserId);
        Task<bool> HasUsageAsync(Guid keywordId);

        // File-attachment support (mirrors CaseKeywordRepository's file-Keyword pattern, see AddFileToKeywordAsync).
        Task<int> AddAsync(EntityKeyword entityKeyword);
        Task<int> DeleteAsync(Guid id);
        Task<EntityKeyword?> GetByEntityAndKeywordIdAsync(string entityType, Guid entityId, Guid keywordId);
        Task<IEnumerable<FileResponse>> GetFileKeywordsByEntityAsync(string entityType, Guid entityId);
        Task<List<CaseKeywordBaseValue>> GetDocumentFilesAsync(Guid companyId, List<string> entityTypes, Guid? fileTypeId,
            List<KeywordValue> keywordValues, List<KeywordSearchRangeValue> keywordDateValues, List<KeywordSearchRangeValue> keywordDecimalValues,
            DateTime? dateFrom, DateTime? dateTo, Guid? customerId, Guid? supplierId);
    }
}
