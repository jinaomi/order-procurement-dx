using CaseMngmt.Models.CompanyTemplates;
using CaseMngmt.Models.Keywords;
using System.ComponentModel.DataAnnotations;

namespace CaseMngmt.Models.Templates
{
    public class Template : BaseModel
    {
        public bool IsDefault { get; set; } = false;

        [MaxLength(30)]
        public string ModuleType { get; set; } = "Case";
        public virtual ICollection<Keyword> Keywords { get; set; }
        public virtual ICollection<CompanyTemplate> CompanyTemplate { get; set; }
    }
}
