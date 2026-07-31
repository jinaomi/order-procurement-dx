using CaseMngmt.Models;
using CaseMngmt.Models.Keywords;
using CaseMngmt.Models.Templates;

namespace CaseMngmt.Repository.Templates
{
    public interface ITemplateRepository
    {
        Task<int> AddAsync(Template customer);
        Task<PagedResult<TemplateViewModel>?> GetAllAsync(Guid? companyId, int pageSize, int pageNumber);
        Task<TemplateViewModel?> GetTemplateViewModelByIdAsync(Guid templateId);
        Task<List<KeywordSearchModel>> GetCaseSearchModelByIdAsync(Guid templateId, bool isAdmin);
        Task<List<KeywordSearchModel>> GetDocumentSearchModelByIdAsync(Guid templateId);
        Task<Template?> GetByIdAsync(Guid id);
        Task<int> DeleteAsync(Guid id);
        Task<int> UpdateAsync(Template customer);
        Task<Template?> GetDefaultTemplateAsync();
        Task<Template?> GetCompanyTemplateByModuleAsync(Guid companyId, string moduleType);
    }
}
