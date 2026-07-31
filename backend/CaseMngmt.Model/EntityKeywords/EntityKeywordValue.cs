namespace CaseMngmt.Models.EntityKeywords
{
    public class EntityKeywordValue
    {
        public Guid KeywordId { get; set; }
        public string? KeywordName { get; set; }
        public string? Value { get; set; }
        public bool IsRequired { get; set; }
        public int? MaxLength { get; set; }
        public int Order { get; set; }
        public Guid TypeId { get; set; }
        public string? TypeName { get; set; }
        public string? TypeValue { get; set; }
        public List<string> Metadata { get; set; } = new();
    }
}
