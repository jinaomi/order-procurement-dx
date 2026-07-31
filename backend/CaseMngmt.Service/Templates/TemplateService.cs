using AutoMapper;
using CaseMngmt.Models.Templates;
using CaseMngmt.Repository.Keywords;
using CaseMngmt.Repository.Templates;
using CaseMngmt.Models.Keywords;
using CaseMngmt.Repository.Types;
using CaseMngmt.Models.CaseKeywords;
using CaseMngmt.Models.FileTypes;
using CaseMngmt.Repository.Customers;
using CaseMngmt.Repository.CompanyTemplates;
using CaseMngmt.Models.CompanyTemplates;

namespace CaseMngmt.Service.Templates
{
    public class TemplateService : ITemplateService
    {
        private ITemplateRepository _repository;
        private ICustomerRepository _customerRepository;
        private IKeywordRepository _keywordRepository;
        private ITypeRepository _typeRepository;
        private ICompanyTemplateRepository _companyTemplateRepository;
        private readonly IMapper _mapper;
        public TemplateService(ITemplateRepository repository, ICustomerRepository customerRepository, IKeywordRepository keywordRepository, ITypeRepository typeRepository, ICompanyTemplateRepository companyTemplateRepository, IMapper mapper)
        {
            _repository = repository;
            _customerRepository = customerRepository;
            _keywordRepository = keywordRepository;
            _typeRepository = typeRepository;
            _companyTemplateRepository = companyTemplateRepository;
            _mapper = mapper;
        }

        public async Task<Guid?> AddAsync(TemplateRequest request)
        {
            try
            {
                var template = new Template
                {
                    Name = !string.IsNullOrWhiteSpace(request.Name) ? request.Name : $"Template {DateTime.Today}",
                    ModuleType = string.IsNullOrWhiteSpace(request.ModuleType) ? "Case" : request.ModuleType
                };

                var response = await _repository.AddAsync(template);
                if (response <= 0) return null;

                if (request.KeywordRequests != null && request.KeywordRequests.Any())
                {
                    var typeList = (await _typeRepository.GetAllAsync())?.FirstOrDefault(x => x.IsDefaultType && x.Value == "list");
                    if (typeList == null) return null;

                    var typeListEntities = new List<Models.Types.Type>();
                    var keywordEntities = new List<Keyword>();

                    var typeListRequest = request.KeywordRequests.Where(x => x.TypeId == typeList.Id);
                    if (typeListRequest != null && typeListRequest.Any())
                    {
                        typeListEntities = typeListRequest.Select(x => new Models.Types.Type()
                        {
                            Name = $"{x.Name} - List Metadata",
                            Source = x.Source,
                            Metadata = x.Metadata,
                            Value = "list",
                            IsDefaultType = false
                        }).ToList();
                        await _typeRepository.AddMultiAsync(typeListEntities);
                    }

                    for (var i = 0; i < request.KeywordRequests.Count; i++)
                    {
                        var item = request.KeywordRequests[i];
                        var newListId = typeListEntities.FirstOrDefault(z => z.Name == $"{item.Name} - List Metadata")?.Id ?? Guid.Empty;
                        keywordEntities.Add(new Keyword()
                        {
                            Name = item.Name,
                            TypeId = item.TypeId == typeList.Id ? newListId : item.TypeId,
                            TemplateId = template.Id,
                            IsRequired = item.IsRequired,
                            MaxLength = item.MaxLength,
                            Order = item.Order,
                            CaseSearchable = item.CaseSearchable,
                            DocumentSearchable = item.DocumentSearchable,
                            IsShowOnCaseList = item.IsShowOnCaseList,
                            IsShowOnTemplate = true
                        });
                    }

                    await _keywordRepository.AddMultiAsync(keywordEntities);
                }

                if (request.CompanyId != Guid.Empty)
                {
                    await _companyTemplateRepository.AddAsync(new CompanyTemplate
                    {
                        CompanyId = request.CompanyId,
                        TemplateId = template.Id
                    });
                }

                return template.Id;
            }
            catch (Exception ex)
            {
                return null;
            }
        }

        public async Task<int> UpdateAsync(TemplateViewRequest request)
        {
            try
            {
                var entity = await _repository.GetByIdAsync(request.TemplateId);
                if (entity == null)
                {
                    return 0;
                }

                var currentKeywords = await _keywordRepository.GetByTemplateIdAsync(request.TemplateId);
                if (currentKeywords != null && currentKeywords.Any())
                {
                    await _keywordRepository.DeleteMultiByTemplateIdAsync(request.TemplateId);
                }

                // Check new Type LIST
                var typeList = (await _typeRepository.GetAllAsync())?.FirstOrDefault(x => x.IsDefaultType && x.Value == "list");
                if (typeList == null)
                {
                    return 0;
                }

                var typeListEntities = new List<Models.Types.Type>();
                var keywordEntities = new List<Keyword>();

                var typeListRequest = request.KeywordRequests.Where(x => x.TypeId == typeList.Id);
                if (typeListRequest != null && typeListRequest.Any())
                {
                    typeListEntities = typeListRequest.Select(x => new Models.Types.Type()
                    {
                        Name = $"{x.Name} - List Metadata",
                        Source = x.Source,
                        Metadata = x.Metadata,
                        Value = "list",
                        IsDefaultType = false
                    }).ToList();
                    await _typeRepository.AddMultiAsync(typeListEntities);
                }

                for (var i = 0; i < request.KeywordRequests.Count; i++)
                {
                    var item = request.KeywordRequests[i];
                    var newListId = typeListEntities.FirstOrDefault(z => z.Name == $"{item.Name} - List Metadata")?.Id ?? Guid.Empty;
                    keywordEntities.Add(new Keyword()
                    {
                        Name = item.Name,
                        TypeId = item.TypeId == typeList.Id ? newListId : item.TypeId,
                        TemplateId = request.TemplateId,
                        IsRequired = item.IsRequired,
                        MaxLength = item.MaxLength,
                        Order = item.Order,
                        CaseSearchable = item.CaseSearchable,
                        DocumentSearchable = item.DocumentSearchable,
                        IsShowOnCaseList = item.IsShowOnCaseList,
                        IsShowOnTemplate = true
                    });
                }

                await _keywordRepository.AddMultiAsync(keywordEntities);

                return 1;
            }
            catch (Exception ex)
            {
                return 0;
            }
        }

        public async Task<int> DeleteAsync(Guid templateId)
        {
            try
            {
                var currentTemplate = await _repository.GetByIdAsync(templateId);
                if (currentTemplate == null)
                {
                    return 0;
                }

                var currentKeywords = await _keywordRepository.GetByTemplateIdAsync(templateId);
                if (currentKeywords != null && currentKeywords.Any())
                {
                    await _keywordRepository.DeleteMultiByTemplateIdAsync(templateId);
                }

                await _repository.DeleteAsync(templateId);

                return 1;
            }
            catch (Exception ex)
            {
                return 0;
            }
        }

        public async Task<Models.PagedResult<TemplateViewModel>?> GetAllAsync(Guid? companyId, int pageSize, int pageNumber)
        {
            try
            {
                var result = await _repository.GetAllAsync(companyId, pageSize, pageNumber);

                return result;
            }
            catch (Exception ex)
            {
                return null;
            }
        }

        public async Task<TemplateViewModel?> GetByIdAsync(Guid id, bool isGetCustomer = false)
        {
            try
            {
                var result = await _repository.GetTemplateViewModelByIdAsync(id);
                if (isGetCustomer && result != null)
                {
                    var customers = await _customerRepository.GetAllAsync();
                    result.Customers = customers;
                }

                return result;
            }
            catch (Exception ex)
            {
                return null;
            }
        }

        public async Task<CaseTemplate?> GetCaseSearchModelByIdAsync(Guid templateId, bool isAdmin, Guid companyId)
        {
            try
            {

                var caseKeywordValues = await _repository.GetCaseSearchModelByIdAsync(templateId, isAdmin);
                var customers = await _customerRepository.GetAllAsync(companyId);
                var result = new CaseTemplate
                {
                    CaseKeywordValues = caseKeywordValues,
                    Customers = customers
                };
                return result;
            }
            catch (Exception ex)
            {
                return null;
            }
        }

        public async Task<DocumentTemplateResponse?> GetDocumentSearchModelByIdAsync(Guid templateId, Guid companyId)
        {
            try
            {

                var resultFromRepo = await _repository.GetDocumentSearchModelByIdAsync(templateId);
                var fileTypes = await _typeRepository.GetAllFileTypeAsync();
                var customers = await _customerRepository.GetAllAsync(companyId);
                DocumentTemplateResponse result = new DocumentTemplateResponse
                {
                    Keywords = resultFromRepo,
                    Customers = customers,
                    FileType = new FileTypeSearchModel
                    {
                        Name = "File Type",
                        FileTypes = _mapper.Map<List<FileTypeModel>>(fileTypes)
                    }
                };

                return result;
            }
            catch (Exception ex)
            {
                return null;
            }
        }

        public async Task<Template?> GetDefaultTemplateAsync()
        {
            try
            {
                return await _repository.GetDefaultTemplateAsync();
            }
            catch (Exception ex)
            {
                return null;
            }
        }

        public async Task<TemplateViewModel?> GetModuleTemplateAsync(Guid companyId, string moduleType, bool isAdmin)
        {
            try
            {
                var template = await EnsureModuleTemplateAsync(companyId, moduleType);
                if (template == null)
                {
                    return null;
                }

                var result = await _repository.GetTemplateViewModelByIdAsync(template.Id);
                if (result != null && !isAdmin && result.Keywords != null)
                {
                    result.Keywords = result.Keywords.Where(k => !k.IsHiddenForUser && !k.IsHidden).ToList();
                }

                return result;
            }
            catch (Exception ex)
            {
                return null;
            }
        }

        public async Task<Template?> EnsureModuleTemplateAsync(Guid companyId, string moduleType)
        {
            try
            {
                var existing = await _repository.GetCompanyTemplateByModuleAsync(companyId, moduleType);
                if (existing != null)
                {
                    return existing;
                }

                var template = new Template
                {
                    Name = $"{moduleType} Template",
                    ModuleType = moduleType,
                    IsDefault = false
                };

                var addResult = await _repository.AddAsync(template);
                if (addResult <= 0) return null;

                await _companyTemplateRepository.AddAsync(new CompanyTemplate
                {
                    CompanyId = companyId,
                    TemplateId = template.Id
                });

                return template;
            }
            catch (Exception ex)
            {
                return null;
            }
        }

        public async Task<int> CloneToCompanyAsync(Guid sourceTemplateId, Guid targetCompanyId)
        {
            try
            {
                var source = await _repository.GetByIdAsync(sourceTemplateId);
                if (source == null) return 0;

                var clonedTemplate = new Template
                {
                    Name = source.Name,
                    IsDefault = false
                };
                var addResult = await _repository.AddAsync(clonedTemplate);
                if (addResult <= 0) return 0;

                var sourceKeywords = await _keywordRepository.GetByTemplateIdAsync(sourceTemplateId);
                if (sourceKeywords != null && sourceKeywords.Any())
                {
                    var clonedKeywords = sourceKeywords.Select(k => new Keyword
                    {
                        Name = k.Name,
                        TypeId = k.TypeId,
                        TemplateId = clonedTemplate.Id,
                        MaxLength = k.MaxLength,
                        IsRequired = k.IsRequired,
                        CaseSearchable = k.CaseSearchable,
                        DocumentSearchable = k.DocumentSearchable,
                        IsShowOnTemplate = k.IsShowOnTemplate,
                        IsShowOnCaseList = k.IsShowOnCaseList,
                        Order = k.Order,
                        OptionsList = k.OptionsList
                    }).ToList();
                    await _keywordRepository.AddMultiAsync(clonedKeywords);
                }

                return await _companyTemplateRepository.AddAsync(new CompanyTemplate
                {
                    CompanyId = targetCompanyId,
                    TemplateId = clonedTemplate.Id
                });
            }
            catch (Exception ex)
            {
                return 0;
            }
        }
    }
}
