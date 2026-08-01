using CaseMngmt.Models.ReorderSuggestions;

namespace CaseMngmt.Service.ReorderSuggestions
{
    public interface IAiReorderSuggestionService
    {
        Task<List<ReorderSuggestionViewModel>> GetSuggestionsAsync(Guid companyId, bool includeAiReasoning = false);
        Task<string?> GetReasoningForProductAsync(Guid companyId, Guid productId);
    }
}
