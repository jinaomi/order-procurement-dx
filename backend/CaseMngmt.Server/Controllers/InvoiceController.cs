using CaseMngmt.Service.Invoices;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace CaseMngmt.Server.Controllers
{
    [Authorize(AuthenticationSchemes = "Bearer")]
    [ApiController]
    [Route("api/[controller]")]
    public class InvoiceController : ControllerBase
    {
        private readonly ILogger<InvoiceController> _logger;
        private readonly IInvoiceService _service;

        public InvoiceController(ILogger<InvoiceController> logger, IInvoiceService service)
        {
            _logger = logger;
            _service = service;
        }

        [HttpGet, Route("getAll")]
        public async Task<IActionResult> GetAll(Guid? customerId = null, string? status = null, string? orderNumber = null, DateTime? issueDateFrom = null, DateTime? issueDateTo = null, int? pageSize = 25, int? pageNumber = 1)
        {
            try
            {
                var currentCompanyId = User?.FindFirst("CompanyId")?.Value;
                if (string.IsNullOrEmpty(currentCompanyId))
                {
                    return BadRequest();
                }

                var result = await _service.GetAllInvoicesAsync(Guid.Parse(currentCompanyId), customerId, status, orderNumber, issueDateFrom, issueDateTo, pageSize ?? 25, pageNumber ?? 1);
                return result != null && result.Items.Any() ? Ok(result) : NotFound();
            }
            catch (Exception e)
            {
                _logger.LogError(e.Message, nameof(InvoiceController), true, e);
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
                _logger.LogError(e.Message, nameof(InvoiceController), true, e);
                return BadRequest();
            }
        }

        [HttpGet, Route("by-order/{orderId}")]
        public async Task<IActionResult> GetByOrder(Guid orderId)
        {
            if (orderId == Guid.Empty)
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

                var result = await _service.GetByOrderIdAsync(orderId, Guid.Parse(currentCompanyId));
                return result == null ? NotFound() : Ok(result);
            }
            catch (Exception e)
            {
                _logger.LogError(e.Message, nameof(InvoiceController), true, e);
                return BadRequest();
            }
        }

        [HttpPost, Route("from-order/{orderId}")]
        public async Task<IActionResult> CreateFromOrder(Guid orderId)
        {
            if (orderId == Guid.Empty)
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

                var result = await _service.CreateFromOrderAsync(orderId, Guid.Parse(currentCompanyId), Guid.Parse(currentUserId));

                if (result.StatusCode == -1)
                {
                    return Conflict(result.Message);
                }
                if (result.StatusCode <= 0)
                {
                    return BadRequest(result.Message);
                }

                return Ok(result.InvoiceId);
            }
            catch (Exception e)
            {
                _logger.LogError(e.Message, nameof(InvoiceController), true, e);
                return BadRequest();
            }
        }

        [HttpGet, Route("{id}/download")]
        public async Task<IActionResult> Download(Guid id)
        {
            if (id == Guid.Empty)
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

                var companyId = Guid.Parse(currentCompanyId);
                var pdfBytes = await _service.GetOrGeneratePdfAsync(id, companyId);
                if (pdfBytes == null)
                {
                    return NotFound();
                }

                var fileName = await _service.GetInvoiceFileNameAsync(id, companyId) ?? "invoice.pdf";
                return File(pdfBytes, "application/pdf", fileName);
            }
            catch (Exception e)
            {
                _logger.LogError(e.Message, nameof(InvoiceController), true, e);
                return BadRequest();
            }
        }

        [HttpPut, Route("status")]
        public async Task<IActionResult> UpdateStatus(Guid id, string status)
        {
            if (id == Guid.Empty || string.IsNullOrEmpty(status))
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

                var result = await _service.UpdateStatusAsync(id, Guid.Parse(currentCompanyId), status, Guid.Parse(currentUserId));
                return result > 0 ? Ok(result) : BadRequest();
            }
            catch (Exception e)
            {
                _logger.LogError(e.Message, nameof(InvoiceController), true, e);
                return BadRequest();
            }
        }
    }
}
