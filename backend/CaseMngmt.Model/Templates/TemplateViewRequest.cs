using CaseMngmt.Models.Keywords;
using System.ComponentModel.DataAnnotations;

namespace CaseMngmt.Models.Templates
{
    public class TemplateRequest
    {
        public string? Name { get; set; }
        public string? ModuleType { get; set; }
        public Guid CompanyId { get; set; }
        public List<KeywordRequest> KeywordRequests { get; set; } = new();
    }

    public class TemplateViewRequest
    {
        [Required]
        public Guid TemplateId { get; set; }
        [Required]
        public Guid CompanyId { get; set; }
        [Required]
        public List<KeywordRequest> KeywordRequests { get; set; }
    }
}
