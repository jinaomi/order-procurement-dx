using CaseMngmt.Models.CaseKeywords;
using CaseMngmt.Models.Templates;

namespace CaseMngmt.Service.Templates
{
    public interface ITemplateService
    {
        Task<Guid?> AddAsync(TemplateRequest template);
        Task<Models.PagedResult<TemplateViewModel>?> GetAllAsync(Guid? companyId, int pageSize, int pageNumber);
        Task<TemplateViewModel?> GetByIdAsync(Guid id, bool isGetCustomer = false);
        Task<CaseTemplate?> GetCaseSearchModelByIdAsync(Guid templateId, bool isAdmin, Guid companyId);
        Task<DocumentTemplateResponse?> GetDocumentSearchModelByIdAsync(Guid companyId);
        Task<int> DeleteAsync(Guid id);
        Task<int> UpdateAsync(TemplateViewRequest template);
        Task<Template?> GetDefaultTemplateAsync();
        Task<int> CloneToCompanyAsync(Guid sourceTemplateId, Guid targetCompanyId);
        Task<TemplateViewModel?> GetModuleTemplateAsync(Guid companyId, string moduleType, bool isAdmin);
        Task<Template?> EnsureModuleTemplateAsync(Guid companyId, string moduleType);
    }
}
