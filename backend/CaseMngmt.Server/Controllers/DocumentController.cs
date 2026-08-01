using CaseMngmt.Models;
using CaseMngmt.Models.CaseKeywords;
using CaseMngmt.Service.CaseKeywords;
using CaseMngmt.Service.CompanyTemplates;
using CaseMngmt.Service.EntityKeywords;
using CaseMngmt.Service.FileUploads;
using CaseMngmt.Service.Templates;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace CaseMngmt.Server.Controllers
{
    [Authorize(AuthenticationSchemes = "Bearer")]
    [ApiController]
    [Route("api/[controller]")]
    public class DocumentController : ControllerBase
    {
        // Entity types (outside 案件管理) whose attachments should also surface in 書類管理 search.
        // Not paginated at the DB level like Case documents (see Search) — acceptable for the low
        // per-company volume these two modules produce; only fetched on page 1 to avoid duplicating
        // the same rows on every page of the Case-paginated result.
        private static readonly List<string> UnifiedSearchEntityTypes = new() { "PurchaseOrder", "GoodsReceipt" };

        private readonly ILogger<DocumentController> _logger;
        private readonly IFileUploadService _fileUploadService;
        private readonly ITemplateService _templateService;
        private readonly ICaseKeywordService _caseKeywordService;
        private readonly ICompanyTemplateService _companyTemplateService;
        private readonly IEntityKeywordService _entityKeywordService;
        private readonly IConfiguration _configuration;

        public DocumentController(ILogger<DocumentController> logger,
            IFileUploadService fileUploadService, ITemplateService templateService, ICaseKeywordService caseKeywordService,
            ICompanyTemplateService companyTemplateService, IEntityKeywordService entityKeywordService, IConfiguration configuration)
        {
            _logger = logger;
            _fileUploadService = fileUploadService;
            _templateService = templateService;
            _caseKeywordService = caseKeywordService;
            _companyTemplateService = companyTemplateService;
            _entityKeywordService = entityKeywordService;
            _configuration = configuration;
        }

        [HttpGet("template")]
        public async Task<IActionResult> GetTemplate()
        {
            try
            {
                var companyId = User?.FindFirst("CompanyId")?.Value;
                if (string.IsNullOrEmpty(companyId))
                {
                    return BadRequest();
                }
                var companyTemplate = await _companyTemplateService.GetTemplateByCompanyIdAsync(Guid.Parse(companyId));
                var templateId = companyTemplate.FirstOrDefault()?.TemplateId;
                if (templateId == null || templateId == Guid.Empty)
                {
                    return BadRequest();
                }

                DocumentTemplateResponse? result = await _templateService.GetDocumentSearchModelByIdAsync(templateId.Value, Guid.Parse(companyId));

                if (result == null)
                {
                    return BadRequest();
                }

                return Ok(result);
            }
            catch (Exception e)
            {
                _logger.LogError(e.Message, nameof(DocumentController), true, e);
                return BadRequest();
            }
        }

        [HttpPost, Route("Search")]
        public async Task<IActionResult> GetAll(DocumentSearch request)
        {
            if (!ModelState.IsValid || request == null)
            {
                return BadRequest(ModelState);
            }

            try
            {
                if (!request.IsValid())
                {
                    return BadRequest("Invalid currency request");
                }

                // Get Template to check role of user
                var currentUserRole = User?.FindAll(ClaimTypes.Role)?.Select(x => x.Value)?.ToList();
                if (currentUserRole == null || currentUserRole.Count < 1)
                {
                    return BadRequest("Wrong Claim");
                }

                var companyId = User?.FindFirst("CompanyId")?.Value;
                if (string.IsNullOrEmpty(companyId))
                {
                    return BadRequest();
                }
                var companyTemplate = await _companyTemplateService.GetTemplateByCompanyIdAsync(Guid.Parse(companyId));
                var templateId = companyTemplate.FirstOrDefault()?.TemplateId;
                if (templateId == null || templateId == Guid.Empty)
                {
                    return BadRequest();
                }

                var searchRequest = new DocumentSearchRequest
                {
                    CompanyId = Guid.Parse(companyId),
                    TemplateId = templateId.Value,
                    FileTypeId = request.FileTypeId,
                    PageNumber = request.PageNumber ?? 1,
                    PageSize = request.PageSize ?? 25,
                    KeywordValues = request.KeywordValues,
                    KeywordDateValues= request.KeywordDateValues,
                    KeywordDecimalValues = request.KeywordDecimalValues
                };

                var result = await _caseKeywordService.GetDocumentsAsync(searchRequest);
                if (result == null)
                {
                    return BadRequest();
                }

                foreach (var item in result.Items)
                {
                    item.EntityType = "Case";
                    item.EntityId = item.CaseId;
                }

                if (searchRequest.PageNumber <= 1)
                {
                    var entityDocs = await _entityKeywordService.GetDocumentFilesAsync(
                        Guid.Parse(companyId), UnifiedSearchEntityTypes, request.FileTypeId);
                    if (entityDocs.Count > 0)
                    {
                        result.Items = entityDocs.Concat(result.Items);
                        result.TotalCount += entityDocs.Count;
                    }
                }

                return Ok(result);
            }
            catch (Exception e)
            {
                _logger.LogError(e.Message, nameof(DocumentController), true, e);
                return BadRequest();
            }
        }
    }
}
