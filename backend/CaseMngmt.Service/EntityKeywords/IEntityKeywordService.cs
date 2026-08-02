using CaseMngmt.Models.CaseKeywords;
using CaseMngmt.Models.EntityKeywords;
using CaseMngmt.Models.FileUploads;

namespace CaseMngmt.Service.EntityKeywords
{
    public interface IEntityKeywordService
    {
        Task<List<EntityKeywordValue>> GetByEntityAsync(string entityType, Guid entityId);
        Task<int> ReplaceValuesAsync(string entityType, Guid entityId, List<EntityKeywordValueRequest> values, Guid currentUserId);

        // File-attachment support (mirrors ICaseKeywordService's AddFileToKeywordAsync/GetFileKeywordsByCaseIdAsync/DeleteFileKeywordAsync).
        Task<Guid?> AddFileToEntityKeywordAsync(string entityType, Guid entityId, Guid fileTypeId, FileUploadResponse fileResponse, Guid templateId, Guid currentUserId);
        Task<IEnumerable<FileResponse>> GetFileKeywordsByEntityAsync(string entityType, Guid entityId);
        Task<int> DeleteFileEntityKeywordAsync(string entityType, Guid entityId, Guid keywordId);
        Task<List<CaseKeywordBaseValue>> GetDocumentFilesAsync(Guid companyId, List<string> entityTypes, Guid? fileTypeId,
            List<KeywordValue> keywordValues, List<KeywordSearchRangeValue> keywordDateValues, List<KeywordSearchRangeValue> keywordDecimalValues,
            DateTime? dateFrom, DateTime? dateTo, Guid? customerId, Guid? supplierId);
    }
}
