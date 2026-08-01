using CaseMngmt.Service.ReorderSuggestions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CaseMngmt.Server.Controllers
{
    [Authorize(AuthenticationSchemes = "Bearer")]
    [ApiController]
    [Route("api/[controller]")]
    public class ReorderSuggestionController : ControllerBase
    {
        private readonly ILogger<ReorderSuggestionController> _logger;
        private readonly IAiReorderSuggestionService _service;

        public ReorderSuggestionController(ILogger<ReorderSuggestionController> logger, IAiReorderSuggestionService service)
        {
            _logger = logger;
            _service = service;
        }

        [HttpGet]
        public async Task<IActionResult> Get(bool includeReasoning = false)
        {
            try
            {
                var currentCompanyId = User?.FindFirst("CompanyId")?.Value;
                if (string.IsNullOrEmpty(currentCompanyId))
                {
                    return BadRequest();
                }

                var result = await _service.GetSuggestionsAsync(Guid.Parse(currentCompanyId), includeReasoning);
                return Ok(result);
            }
            catch (Exception e)
            {
                _logger.LogError(e.Message, nameof(ReorderSuggestionController), true, e);
                return BadRequest();
            }
        }

        [HttpGet, Route("{productId}/reasoning")]
        public async Task<IActionResult> GetReasoning(Guid productId)
        {
            if (productId == Guid.Empty)
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

                var result = await _service.GetReasoningForProductAsync(Guid.Parse(currentCompanyId), productId);
                return result == null ? NotFound() : Ok(new { reasoning = result });
            }
            catch (Exception e)
            {
                _logger.LogError(e.Message, nameof(ReorderSuggestionController), true, e);
                return BadRequest();
            }
        }
    }
}
