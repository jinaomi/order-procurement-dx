using CaseMngmt.Models.Suppliers;
using CaseMngmt.Service.Suppliers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace CaseMngmt.Server.Controllers
{
    [Authorize(AuthenticationSchemes = "Bearer")]
    [ApiController]
    [Route("api/[controller]")]
    public class SupplierController : ControllerBase
    {
        private readonly ILogger<SupplierController> _logger;
        private readonly ISupplierService _service;

        public SupplierController(ILogger<SupplierController> logger, ISupplierService service)
        {
            _logger = logger;
            _service = service;
        }

        [HttpGet, Route("getAll")]
        public async Task<IActionResult> GetAll(string? name = null, int? pageSize = 25, int? pageNumber = 1)
        {
            try
            {
                var currentCompanyId = User?.FindFirst("CompanyId")?.Value;
                if (string.IsNullOrEmpty(currentCompanyId))
                {
                    return BadRequest();
                }

                var result = await _service.GetAllSuppliersAsync(Guid.Parse(currentCompanyId), name, pageSize ?? 25, pageNumber ?? 1);
                return result != null && result.Items.Any() ? Ok(result) : NotFound();
            }
            catch (Exception e)
            {
                _logger.LogError(e.Message, nameof(SupplierController), true, e);
                return BadRequest();
            }
        }

        [HttpGet, Route("list")]
        public async Task<IActionResult> List()
        {
            try
            {
                var currentCompanyId = User?.FindFirst("CompanyId")?.Value;
                if (string.IsNullOrEmpty(currentCompanyId))
                {
                    return BadRequest();
                }

                var result = await _service.GetAllSuppliersAsync(Guid.Parse(currentCompanyId));
                return Ok(result);
            }
            catch (Exception e)
            {
                _logger.LogError(e.Message, nameof(SupplierController), true, e);
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
                var result = await _service.GetByIdAsync(id);
                return result == null ? NotFound() : Ok(result);
            }
            catch (Exception e)
            {
                _logger.LogError(e.Message, nameof(SupplierController), true, e);
                return BadRequest();
            }
        }

        [HttpPost]
        public async Task<IActionResult> Create(SupplierRequest supplier)
        {
            if (!ModelState.IsValid || supplier == null)
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

                supplier.CreatedBy = Guid.Parse(currentUserId);
                supplier.UpdatedBy = Guid.Parse(currentUserId);
                supplier.CompanyId = Guid.Parse(currentCompanyId);

                var result = await _service.AddSupplierAsync(supplier);
                return result != null ? Ok(result) : BadRequest();
            }
            catch (Exception e)
            {
                _logger.LogError(e.Message, nameof(SupplierController), true, e);
                return BadRequest();
            }
        }

        [HttpPut, Route("{id}")]
        public async Task<IActionResult> Update(Guid id, SupplierRequest model)
        {
            if (!ModelState.IsValid || id == Guid.Empty)
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

                model.CompanyId = Guid.Parse(currentCompanyId);
                model.UpdatedBy = Guid.Parse(currentUserId);

                var result = await _service.UpdateSupplierAsync(id, model);
                return result > 0 ? Ok(result) : BadRequest();
            }
            catch (Exception e)
            {
                _logger.LogError(e.Message, nameof(SupplierController), true, e);
                return BadRequest();
            }
        }

        [HttpDelete, Route("{id}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            if (id == Guid.Empty)
            {
                return BadRequest(ModelState);
            }

            try
            {
                var currentUserId = User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(currentUserId))
                {
                    return BadRequest();
                }

                var result = await _service.DeleteAsync(id, Guid.Parse(currentUserId));
                return result > 0 ? Ok(result) : BadRequest();
            }
            catch (Exception e)
            {
                _logger.LogError(e.Message, nameof(SupplierController), true, e);
                return BadRequest();
            }
        }
    }
}
