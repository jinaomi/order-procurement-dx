using CaseMngmt.Models.Customers;
using CaseMngmt.Models.Keywords;

namespace CaseMngmt.Models.Templates
{
    public class TemplateViewModel
    {
        public Guid Id { get; set; }
        public string Name { get; set; }
        public string ModuleType { get; set; } = "Case";
        public Guid CreatedBy { get; set; }
        public Guid UpdatedBy { get; set; }
        public DateTime CreatedDate { get; set; }
        public DateTime UpdatedDate { get; set; }
        public List<KeywordViewModel> Keywords { get; set; }
        public List<Customer> Customers { get; set; } = new List<Customer>();
    }
}
