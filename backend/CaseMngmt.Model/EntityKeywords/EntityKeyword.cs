using CaseMngmt.Models.Keywords;
using System.ComponentModel.DataAnnotations;

namespace CaseMngmt.Models.EntityKeywords
{
    public class EntityKeyword : BaseModel
    {
        [Required]
        public Guid EntityId { get; set; }

        [Required]
        [MaxLength(30)]
        public string EntityType { get; set; }

        [Required]
        public Guid KeywordId { get; set; }

        public string? Value { get; set; }

        public Keyword? Keyword { get; set; }
    }
}
