using CaseMngmt.Models.GoodsReceipts;
using CaseMngmt.Service.Ai;
using CaseMngmt.Service.GoodsReceipts;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace CaseMngmt.Server.Controllers
{
    [Authorize(AuthenticationSchemes = "Bearer")]
    [ApiController]
    [Route("api/[controller]")]
    public class GoodsReceiptController : ControllerBase
    {
        private readonly ILogger<GoodsReceiptController> _logger;
        private readonly IGoodsReceiptService _service;
        private readonly IAiProcurementExtractionService _extractionService;

        private static readonly Dictionary<string, string> AcceptedMediaTypes = new(StringComparer.OrdinalIgnoreCase)
        {
            { ".jpg", "image/jpeg" },
            { ".jpeg", "image/jpeg" },
            { ".png", "image/png" },
            { ".pdf", "application/pdf" }
        };
        private const long MaxExtractFileSizeBytes = 15 * 1024 * 1024; // 15MB

        public GoodsReceiptController(ILogger<GoodsReceiptController> logger, IGoodsReceiptService service, IAiProcurementExtractionService extractionService)
        {
            _logger = logger;
            _service = service;
            _extractionService = extractionService;
        }

        [HttpPost, Route("extract")]
        [RequestSizeLimit(20_000_000)]
        public async Task<IActionResult> Extract(IFormFile? file, Guid? purchaseOrderId = null)
        {
            if (file == null || file.Length == 0)
            {
                return BadRequest("ファイルを選択してください。");
            }

            if (file.Length > MaxExtractFileSizeBytes)
            {
                return BadRequest("ファイルサイズが大きすぎます（上限15MB）。");
            }

            var extension = Path.GetExtension(file.FileName);
            if (string.IsNullOrEmpty(extension) || !AcceptedMediaTypes.TryGetValue(extension, out var mediaType))
            {
                return BadRequest("対応していないファイル形式です。JPEG・PNG・PDFのみアップロードできます。");
            }

            try
            {
                var currentCompanyId = User?.FindFirst("CompanyId")?.Value;
                if (string.IsNullOrEmpty(currentCompanyId))
                {
                    return BadRequest();
                }

                using var memoryStream = new MemoryStream();
                await file.CopyToAsync(memoryStream);
                var fileBytes = memoryStream.ToArray();

                var result = await _extractionService.ExtractGoodsReceiptAsync(fileBytes, mediaType, Guid.Parse(currentCompanyId), purchaseOrderId);
                return result == null
                    ? BadRequest("画像からの情報抽出に失敗しました。もう一度お試しいただくか、手動で入力してください。")
                    : Ok(result);
            }
            catch (Exception e)
            {
                _logger.LogError(e.Message, nameof(GoodsReceiptController), true, e);
                return BadRequest();
            }
        }

        [HttpGet, Route("getAll")]
        public async Task<IActionResult> GetAll(Guid? purchaseOrderId = null, Guid? supplierId = null, int? pageSize = 25, int? pageNumber = 1)
        {
            try
            {
                var currentCompanyId = User?.FindFirst("CompanyId")?.Value;
                if (string.IsNullOrEmpty(currentCompanyId))
                {
                    return BadRequest();
                }

                var result = await _service.GetAllAsync(Guid.Parse(currentCompanyId), purchaseOrderId, supplierId, pageSize ?? 25, pageNumber ?? 1);
                return result != null && result.Items.Any() ? Ok(result) : NotFound();
            }
            catch (Exception e)
            {
                _logger.LogError(e.Message, nameof(GoodsReceiptController), true, e);
                return BadRequest();
            }
        }

        [HttpGet]
        public async Task<IActionResult> Details(Guid id)
        {
            if (id == Guid.Empty)
            {
                return BadRequest(ModelState);
            }

            try
            {
                var currentCompanyId = User?.FindFirst("CompanyId")?.Value;
                if (string.IsNullOrEmpty(currentCompanyId))
                {
                    return BadRequest();
                }

                var result = await _service.GetByIdAsync(id, Guid.Parse(currentCompanyId));
                return result == null ? NotFound() : Ok(result);
            }
            catch (Exception e)
            {
                _logger.LogError(e.Message, nameof(GoodsReceiptController), true, e);
                return BadRequest();
            }
        }

        [HttpGet, Route("by-purchase-order/{purchaseOrderId}")]
        public async Task<IActionResult> GetByPurchaseOrder(Guid purchaseOrderId)
        {
            if (purchaseOrderId == Guid.Empty)
            {
                return BadRequest();
            }

            try
            {
                var currentCompanyId = User?.FindFirst("CompanyId")?.Value;
                if (string.IsNullOrEmpty(currentCompanyId))
                {
                    return BadRequest();
                }

                var result = await _service.GetByPurchaseOrderIdAsync(purchaseOrderId, Guid.Parse(currentCompanyId));
                return Ok(result);
            }
            catch (Exception e)
            {
                _logger.LogError(e.Message, nameof(GoodsReceiptController), true, e);
                return BadRequest();
            }
        }

        [HttpPost]
        public async Task<IActionResult> Create(GoodsReceiptRequest request)
        {
            if (!ModelState.IsValid || request == null)
            {
                return BadRequest(ModelState);
            }

            try
            {
                var currentCompanyId = User?.FindFirst("CompanyId")?.Value;
                var currentUserId = User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(currentCompanyId) || string.IsNullOrEmpty(currentUserId))
                {
                    return BadRequest();
                }

                request.CompanyId = Guid.Parse(currentCompanyId);

                var result = await _service.CreateAsync(request, Guid.Parse(currentUserId));
                if (result.StatusCode <= 0)
                {
                    return BadRequest(result.Message);
                }

                return Ok(result);
            }
            catch (Exception e)
            {
                _logger.LogError(e.Message, nameof(GoodsReceiptController), true, e);
                return BadRequest();
            }
        }
    }
}
