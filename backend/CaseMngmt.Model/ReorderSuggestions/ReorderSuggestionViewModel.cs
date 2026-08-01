namespace CaseMngmt.Models.ReorderSuggestions
{
    public class ReorderSuggestionViewModel
    {
        public Guid ProductId { get; set; }
        public string ProductName { get; set; }
        public decimal CurrentStock { get; set; }

        // "UrgentReorder" | "PlanAhead" | "OnTrack" | "NoHistory"
        public string Flag { get; set; }

        public DateTime? ProjectedStockoutDate { get; set; }
        public Guid? SuggestedSupplierId { get; set; }
        public string? SuggestedSupplierName { get; set; }
        public decimal? SuggestedQuantity { get; set; }
        public DateTime? SuggestedOrderByDate { get; set; }
        public bool HasSeasonalData { get; set; }
        public decimal DailyConsumptionRate { get; set; }
        public int LeadTimeDays { get; set; }
        public string Reasoning { get; set; }
    }
}
