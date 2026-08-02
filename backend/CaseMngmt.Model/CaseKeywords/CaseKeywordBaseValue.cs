using CaseMngmt.Models.GenericValidation;
using System.ComponentModel.DataAnnotations;

namespace CaseMngmt.Models.CaseKeywords
{
    public class CaseKeywordBaseValue
    {
        public Guid? CaseId { get; set; }
        // Populated for unified 書類管理 search results coming from EntityKeyword (PurchaseOrder/GoodsReceipt
        // attachments etc.) so the frontend can tell which detail screen to open. Case-sourced rows default
        // to "Case"/CaseId (set by DocumentController after calling the existing Case query, not here, to
        // avoid touching CaseKeywordRepository.GetDocumentsAsync's already-working projection).
        public string EntityType { get; set; } = "Case";
        public Guid? EntityId { get; set; }
        // Human-readable identifier of the source record (Case.Name / Order.OrderNumber /
        // PurchaseOrder.PurchaseOrderNumber / etc — every entity's BaseModel.Name is set to its
        // generated document number at creation time), so 書類管理 results can show which record a
        // file belongs to without opening 詳細表示.
        public string? EntityDisplayName { get; set; }
        [Required]
        public Guid KeywordId { get; set; }
        [MaxLength(256)]
        public string KeywordName { get; set; }
        public string Value { get; set; }
        public Guid TypeId { get; set; }
        public string? TypeName { get; set; }
        public string TypeValue { get; set; }
        public bool IsRequired { get; set; }
        public int? MaxLength { get; set; }
        public bool Searchable { get; set; }
        public bool DocumentSearchable { get; set; }
        public bool IsShowOnTemplate { get; set; }
        public bool IsShowOnCaseList { get; set; }
        public int Order { get; set; }
        public IEnumerable<string>? Metadata { get; set; }
        public bool? IsImage { get; set; }
    }

    public class CaseKeywordValue
    {
        [Required]
        public Guid KeywordId { get; set; }
        public string Value { get; set; }
        public string TypeValue { get; set; }
        public bool IsRequired { get; set; }
        public int? MaxLength { get; set; }
        public bool IsValidModel()
        {
            try
            {
                if (IsRequired && string.IsNullOrEmpty(Value))
                {
                    return false;
                }

                if (!IsRequired && string.IsNullOrEmpty(Value))
                {
                    return true;
                }
                
                Type? type;
                if (DataTypeDictionary.DataTypeAlias.TryGetValue(TypeValue.ToLower(), value: out type))
                {
                    if (type == null)
                    {
                        return false;
                    }

                    var genericValidator = new GenericValidator();
                    return genericValidator.IsValid(type, Value, MaxLength);
                }

                return false;
            }
            catch (Exception ex)
            {
                return false;
            }
        }
    }
}
