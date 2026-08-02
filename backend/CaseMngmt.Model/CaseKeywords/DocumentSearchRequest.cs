namespace CaseMngmt.Models.CaseKeywords
{
    public class DocumentSearch
    {
        public Guid? FileTypeId { get; set; }
        public List<KeywordValue> KeywordValues { get; set; }
        public List<KeywordSearchRangeValue> KeywordDateValues { get; set; }
        public List<KeywordSearchRangeValue> KeywordDecimalValues { get; set; }
        public DateTime? DateFrom { get; set; }
        public DateTime? DateTo { get; set; }
        public Guid? CustomerId { get; set; }
        public Guid? SupplierId { get; set; }
        public int? PageSize { get; set; }
        public int? PageNumber { get; set; }

        public bool IsValid()
        {
            try
            {
                if (KeywordDateValues != null && KeywordDateValues.Any())
                {
                    foreach (var item in KeywordDateValues)
                    {
                        if (!string.IsNullOrEmpty(item.FromValue) && string.IsNullOrEmpty(item.ToValue))
                        {
                            DateTime.TryParse(item.FromValue, out _);
                        }
                        else if (string.IsNullOrEmpty(item.FromValue) && !string.IsNullOrEmpty(item.ToValue))
                        {
                            DateTime.TryParse(item.ToValue, out _);
                        }
                        else
                        {
                            DateTime.TryParse(item.FromValue, out _);
                            DateTime.TryParse(item.ToValue, out _);
                        }
                    }
                }

                if (KeywordDecimalValues != null && KeywordDecimalValues.Any())
                {
                    foreach (var item in KeywordDecimalValues)
                    {
                        if (!string.IsNullOrEmpty(item.FromValue) && string.IsNullOrEmpty(item.ToValue))
                        {
                            decimal.TryParse(item.FromValue, out _);
                        }
                        else if (string.IsNullOrEmpty(item.FromValue) && !string.IsNullOrEmpty(item.ToValue))
                        {
                            decimal.TryParse(item.ToValue, out _);
                        }
                        else
                        {
                            decimal.TryParse(item.FromValue, out _);
                            decimal.TryParse(item.ToValue, out _);
                        }
                    }
                }
                return true;
            }
            catch (Exception)
            {
                return false;
            }
        }
    }

    public class DocumentSearchRequest : DocumentSearch
    {
        public Guid TemplateId { get; set; }
        public Guid CompanyId { get; set; }
    }
}
