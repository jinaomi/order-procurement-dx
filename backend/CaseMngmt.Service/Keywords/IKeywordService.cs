using CaseMngmt.Models.Keywords;

namespace CaseMngmt.Service.Keywords
{
    public interface IKeywordService
    {
        Task<int> AddAsync(KeywordRequest request);
        Task<IEnumerable<KeywordViewModel>?> GetAllAsync(int pageSize, int pageNumber);
        Task<KeywordViewModel?> GetByIdAsync(Guid id);
        Task<int> DeleteAsync(Guid id);
        Task<int> UpdateAsync(Guid Id, KeywordRequest request);
        Task<List<KeywordViewModel>?> GetByTemplateIdForBuilderAsync(Guid templateId);
        Task<int> SoftDeleteAsync(Guid id);
        Task<int> ReorderAsync(List<KeywordReorderRequest> items);
        Task<Dictionary<Guid, string>> GetModuleTypesByKeywordIdsAsync(List<Guid> keywordIds);
    }
}
