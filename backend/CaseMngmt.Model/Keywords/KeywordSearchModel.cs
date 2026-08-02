using System.ComponentModel.DataAnnotations;

namespace CaseMngmt.Models.Keywords
{
    public class KeywordSearchModel
    {
        public Guid KeywordId { get; set; }
        [MaxLength(256)]
        public string? KeywordName { get; set; }
        // "Case" for 案件管理 fields (the only source before 2026-08); set to the owning Template's
        // ModuleType ("Order"/"PurchaseOrder"/...) for fields gathered from other modules so the
        // 書類管理 search form can group/label them and target EntityType when building EntityKeyword filters.
        public string EntityType { get; set; } = "Case";
        public int? MaxLength { get; set; }
        public List<string> Metadata { get; set; }
        public int Order { get; set; }
        public Guid TypeId { get; set; }
        public string? TypeName { get; set; }
        public string? TypeValue { get; set; }
        public string Value { get; set; } = string.Empty;
        public string? FromValue { get; set; } = string.Empty;
        public string? ToValue { get; set; } = string.Empty;
        public bool? FromTo { get; set; } = false;
    }
}
