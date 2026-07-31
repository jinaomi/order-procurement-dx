using CaseMngmt.Models.Keywords;

namespace CaseMngmt.Repository.Keywords
{
    public interface IKeywordRepository
    {
        Task<int> AddAsync(Keyword keyword);
        Task<int> AddMultiAsync(List<Keyword> keywords);
        Task<List<KeywordViewModel>?> GetAllAsync(int pageSize, int pageNumber);
        Task<Keyword?> GetByIdAsync(Guid id);
        Task<List<Keyword>?> GetByTemplateIdAsync(Guid templateId);
        Task<int> DeleteAsync(Guid id);
        Task<int> DeleteMultiByTemplateIdAsync(Guid templateId);
        Task<int> UpdateAsync(Keyword keyword);
        Task<int> UpdateMultiAsync(Guid templateId, List<Keyword> keywords);
        Task<List<KeywordViewModel>?> GetByTemplateIdForBuilderAsync(Guid templateId);
        Task<bool> HasCaseKeywordsAsync(Guid keywordId);
        Task<string?> GetModuleTypeByKeywordIdAsync(Guid keywordId);
        Task<int> SoftHideAsync(Guid id);
        Task<int> ReorderAsync(List<KeywordReorderRequest> items);
    }
}
