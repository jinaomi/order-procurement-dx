using CaseMngmt.Models;
using CaseMngmt.Models.CaseKeywords;
using CaseMngmt.Service.CaseKeywords;
using CaseMngmt.Service.EntityKeywords;
using CaseMngmt.Service.FileUploads;
using CaseMngmt.Service.Keywords;
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
        private static readonly List<string> UnifiedSearchEntityTypes = new() { "PurchaseOrder", "GoodsReceipt", "PurchaseInvoice", "Order", "Invoice" };

        private readonly ILogger<DocumentController> _logger;
        private readonly IFileUploadService _fileUploadService;
        private readonly ITemplateService _templateService;
        private readonly ICaseKeywordService _caseKeywordService;
        private readonly IEntityKeywordService _entityKeywordService;
        private readonly IKeywordService _keywordService;
        private readonly IConfiguration _configuration;

        public DocumentController(ILogger<DocumentController> logger,
            IFileUploadService fileUploadService, ITemplateService templateService, ICaseKeywordService caseKeywordService,
            IEntityKeywordService entityKeywordService, IKeywordService keywordService, IConfiguration configuration)
        {
            _logger = logger;
            _fileUploadService = fileUploadService;
            _templateService = templateService;
            _caseKeywordService = caseKeywordService;
            _entityKeywordService = entityKeywordService;
            _keywordService = keywordService;
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

                DocumentTemplateResponse? result = await _templateService.GetDocumentSearchModelByIdAsync(Guid.Parse(companyId));

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
                var caseTemplate = await _templateService.EnsureModuleTemplateAsync(Guid.Parse(companyId), "Case");
                if (caseTemplate == null)
                {
                    return BadRequest();
                }

                // Now that the search form can surface DocumentSearchable fields from Order/PurchaseOrder/
                // etc alongside Case's, a single request may carry KeywordValues/date/decimal criteria whose
                // KeywordId belongs to different modules. Each downstream query (Case's group-by-Case,
                // Entity's group-by-EntityType+EntityId) uses an ".All(...) must find a match" check, so
                // handing it a criterion for a KeywordId it can never see would wrongly zero out ALL of its
                // results. Partition by the keyword's owning module before dispatching.
                var allKeywordIds = (request.KeywordValues?.Select(x => x.KeywordId) ?? Enumerable.Empty<Guid>())
                    .Concat(request.KeywordDateValues?.Select(x => x.KeywordId) ?? Enumerable.Empty<Guid>())
                    .Concat(request.KeywordDecimalValues?.Select(x => x.KeywordId) ?? Enumerable.Empty<Guid>())
                    .Distinct().ToList();
                var moduleTypesByKeywordId = await _keywordService.GetModuleTypesByKeywordIdsAsync(allKeywordIds);

                var caseKeywordValues = request.KeywordValues?.Where(x => (moduleTypesByKeywordId.GetValueOrDefault(x.KeywordId) ?? "Case") == "Case").ToList();
                var caseKeywordDateValues = request.KeywordDateValues?.Where(x => (moduleTypesByKeywordId.GetValueOrDefault(x.KeywordId) ?? "Case") == "Case").ToList();
                var caseKeywordDecimalValues = request.KeywordDecimalValues?.Where(x => (moduleTypesByKeywordId.GetValueOrDefault(x.KeywordId) ?? "Case") == "Case").ToList();

                var entityKeywordValues = request.KeywordValues?.Where(x => moduleTypesByKeywordId.GetValueOrDefault(x.KeywordId) is string mt && mt != "Case").ToList();
                var entityKeywordDateValues = request.KeywordDateValues?.Where(x => moduleTypesByKeywordId.GetValueOrDefault(x.KeywordId) is string mt && mt != "Case").ToList();
                var entityKeywordDecimalValues = request.KeywordDecimalValues?.Where(x => moduleTypesByKeywordId.GetValueOrDefault(x.KeywordId) is string mt && mt != "Case").ToList();

                var searchRequest = new DocumentSearchRequest
                {
                    CompanyId = Guid.Parse(companyId),
                    TemplateId = caseTemplate.Id,
                    FileTypeId = request.FileTypeId,
                    PageNumber = request.PageNumber ?? 1,
                    PageSize = request.PageSize ?? 25,
                    KeywordValues = caseKeywordValues,
                    KeywordDateValues= caseKeywordDateValues,
                    KeywordDecimalValues = caseKeywordDecimalValues
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
                        Guid.Parse(companyId), UnifiedSearchEntityTypes, request.FileTypeId,
                        entityKeywordValues, entityKeywordDateValues, entityKeywordDecimalValues,
                        request.DateFrom, request.DateTo, request.CustomerId, request.SupplierId);
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
