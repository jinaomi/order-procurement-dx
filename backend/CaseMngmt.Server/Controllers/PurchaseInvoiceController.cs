using CaseMngmt.Models.PurchaseInvoices;
using CaseMngmt.Service.PurchaseInvoices;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace CaseMngmt.Server.Controllers
{
    [Authorize(AuthenticationSchemes = "Bearer")]
    [ApiController]
    [Route("api/[controller]")]
    public class PurchaseInvoiceController : ControllerBase
    {
        private readonly ILogger<PurchaseInvoiceController> _logger;
        private readonly IPurchaseInvoiceService _service;

        public PurchaseInvoiceController(ILogger<PurchaseInvoiceController> logger, IPurchaseInvoiceService service)
        {
            _logger = logger;
            _service = service;
        }

        [HttpGet, Route("getAll")]
        public async Task<IActionResult> GetAll(Guid? supplierId = null, string? status = null, DateTime? issueDateFrom = null, DateTime? issueDateTo = null, int? pageSize = 25, int? pageNumber = 1)
        {
            try
            {
                var currentCompanyId = User?.FindFirst("CompanyId")?.Value;
                if (string.IsNullOrEmpty(currentCompanyId))
                {
                    return BadRequest();
                }

                var result = await _service.GetAllAsync(Guid.Parse(currentCompanyId), supplierId, status, issueDateFrom, issueDateTo, pageSize ?? 25, pageNumber ?? 1);
                return result != null && result.Items.Any() ? Ok(result) : NotFound();
            }
            catch (Exception e)
            {
                _logger.LogError(e.Message, nameof(PurchaseInvoiceController), true, e);
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
                _logger.LogError(e.Message, nameof(PurchaseInvoiceController), true, e);
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
                _logger.LogError(e.Message, nameof(PurchaseInvoiceController), true, e);
                return BadRequest();
            }
        }

        [HttpPost]
        public async Task<IActionResult> Create(PurchaseInvoiceRequest request)
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

                return Ok(result.PurchaseInvoiceId);
            }
            catch (Exception e)
            {
                _logger.LogError(e.Message, nameof(PurchaseInvoiceController), true, e);
                return BadRequest();
            }
        }

        [HttpPatch, Route("{id}/pay")]
        public async Task<IActionResult> Pay(Guid id)
        {
            if (id == Guid.Empty)
            {
                return BadRequest();
            }

            try
            {
                var currentCompanyId = User?.FindFirst("CompanyId")?.Value;
                var currentUserId = User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(currentCompanyId) || string.IsNullOrEmpty(currentUserId))
                {
                    return BadRequest();
                }

                var result = await _service.MarkAsPaidAsync(id, Guid.Parse(currentCompanyId), Guid.Parse(currentUserId));
                return result > 0 ? Ok(result) : BadRequest();
            }
            catch (Exception e)
            {
                _logger.LogError(e.Message, nameof(PurchaseInvoiceController), true, e);
                return BadRequest();
            }
        }
    }
}
