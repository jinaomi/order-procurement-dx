using CaseMngmt.Models.Ai;
using CaseMngmt.Models.GoodsReceipts;
using CaseMngmt.Models.Orders;
using CaseMngmt.Models.Products;
using CaseMngmt.Models.PurchaseOrders;
using CaseMngmt.Models.ReorderSuggestions;
using CaseMngmt.Repository.GoodsReceipts;
using CaseMngmt.Repository.Orders;
using CaseMngmt.Repository.Products;
using CaseMngmt.Repository.PurchaseOrders;
using CaseMngmt.Service.Ai;
using Microsoft.Extensions.Logging;
using System.Text.Json;

namespace CaseMngmt.Service.ReorderSuggestions
{
    public class AiReorderSuggestionService : IAiReorderSuggestionService
    {
        private readonly IOrderRepository _orderRepository;
        private readonly IPurchaseOrderRepository _purchaseOrderRepository;
        private readonly IGoodsReceiptRepository _goodsReceiptRepository;
        private readonly IProductRepository _productRepository;
        private readonly AnthropicClient _anthropicClient;
        private readonly ILogger<AiReorderSuggestionService> _logger;

        private const string ModelId = "claude-opus-4-8";
        private const int ConsumptionWindowDays = 90;
        private const int DefaultLeadTimeDays = 14;
        private const int SafetyBufferDays = 30;
        private const decimal MinSeasonalMultiplier = 0.3m;
        private const decimal MaxSeasonalMultiplier = 3.0m;

        private const string FlagUrgentReorder = "UrgentReorder";
        private const string FlagPlanAhead = "PlanAhead";
        private const string FlagOnTrack = "OnTrack";
        private const string FlagNoHistory = "NoHistory";

        public AiReorderSuggestionService(
            IOrderRepository orderRepository,
            IPurchaseOrderRepository purchaseOrderRepository,
            IGoodsReceiptRepository goodsReceiptRepository,
            IProductRepository productRepository,
            AnthropicClient anthropicClient,
            ILogger<AiReorderSuggestionService> logger)
        {
            _orderRepository = orderRepository;
            _purchaseOrderRepository = purchaseOrderRepository;
            _goodsReceiptRepository = goodsReceiptRepository;
            _productRepository = productRepository;
            _anthropicClient = anthropicClient;
            _logger = logger;
        }

        public async Task<List<ReorderSuggestionViewModel>> GetSuggestionsAsync(Guid companyId, bool includeAiReasoning = false)
        {
            var today = DateTime.UtcNow.Date;
            var products = await _productRepository.GetAllAsync(companyId);
            var orders = await _orderRepository.GetAllForDashboardAsync(companyId);
            var purchaseOrders = await _purchaseOrderRepository.GetAllForCompanyAsync(companyId);
            var goodsReceipts = await _goodsReceiptRepository.GetAllForCompanyAsync(companyId);

            var suggestions = new List<ReorderSuggestionViewModel>();
            foreach (var product in products)
            {
                var suggestion = BuildDeterministicSuggestion(product, today, orders, purchaseOrders, goodsReceipts);
                if (suggestion != null)
                {
                    suggestions.Add(suggestion);
                }
            }

            // AI reasoning is opt-in (see includeAiReasoning) — the deterministic numbers above are
            // free and useful on their own, so opening this screen must not silently cost an Anthropic
            // call every time. Callers that want real AI-generated reasoning ask for it explicitly.
            if (includeAiReasoning)
            {
                await EnrichWithAiReasoningAsync(suggestions);
            }
            else
            {
                foreach (var suggestion in suggestions)
                {
                    suggestion.Reasoning = GetFallbackReasoning(suggestion.Flag);
                }
            }

            return suggestions;
        }

        public async Task<string?> GetReasoningForProductAsync(Guid companyId, Guid productId)
        {
            var suggestions = await GetSuggestionsAsync(companyId, includeAiReasoning: false);
            var target = suggestions.FirstOrDefault(s => s.ProductId == productId);
            if (target == null)
            {
                return null;
            }

            // Passing a single-item list means EnrichWithAiReasoningAsync (unchanged) calls Claude for
            // just this one product — or, if it isn't actionable, applies the fallback with no API call
            // at all, exactly like the batch path already does.
            await EnrichWithAiReasoningAsync(new List<ReorderSuggestionViewModel> { target });
            return target.Reasoning;
        }

        private static ReorderSuggestionViewModel? BuildDeterministicSuggestion(
            Product product,
            DateTime today,
            List<Order> orders,
            List<PurchaseOrder> purchaseOrders,
            List<GoodsReceipt> goodsReceipts)
        {
            var windowStart = today.AddDays(-ConsumptionWindowDays);
            var recentQuantitySold = orders
                .Where(o => o.OrderDate >= windowStart && o.OrderDate <= today)
                .SelectMany(o => o.OrderItems)
                .Where(i => i.ProductId == product.Id)
                .Sum(i => i.Quantity);

            var dailyConsumptionRate = recentQuantitySold / ConsumptionWindowDays;

            // Products with no recent sales are only worth surfacing when stock is already at/below
            // zero — otherwise there is no actionable signal, and listing every idle product would
            // bury the ones that actually need attention.
            if (dailyConsumptionRate <= 0)
            {
                if (product.StockQuantity > 0)
                {
                    return null;
                }

                return new ReorderSuggestionViewModel
                {
                    ProductId = product.Id,
                    ProductName = product.Name,
                    CurrentStock = product.StockQuantity,
                    Flag = FlagNoHistory,
                    HasSeasonalData = false,
                    Reasoning = string.Empty
                };
            }

            var (seasonalMultiplier, hasSeasonalData) = ComputeSeasonalMultiplier(product.Id, today, orders);
            var effectiveDailyRate = dailyConsumptionRate * seasonalMultiplier;

            var daysUntilStockout = (double)(product.StockQuantity / effectiveDailyRate);
            var projectedStockoutDate = today.AddDays(daysUntilStockout);

            var (supplierId, supplierName, leadTimeDays) = ResolveSupplierAndLeadTime(product.Id, purchaseOrders, goodsReceipts);
            var suggestedOrderByDate = projectedStockoutDate.AddDays(-leadTimeDays);

            var openPurchaseOrderItems = purchaseOrders
                .Where(po => po.Status == "Confirmed" || po.Status == "PartiallyReceived")
                .SelectMany(po => po.PurchaseOrderItems.Select(i => new { po.ExpectedDeliveryDate, Item = i }))
                .Where(x => x.Item.ProductId == product.Id)
                .ToList();

            var openOutstandingQuantity = openPurchaseOrderItems.Sum(x => x.Item.Quantity - x.Item.ReceivedQuantity);
            var earliestExpectedDelivery = openPurchaseOrderItems
                .Where(x => x.ExpectedDeliveryDate.HasValue)
                .Select(x => x.ExpectedDeliveryDate!.Value)
                .OrderBy(d => d)
                .FirstOrDefault();

            var suggestedQuantity = Math.Max(0, effectiveDailyRate * (leadTimeDays + SafetyBufferDays) - openOutstandingQuantity);

            string flag;
            if (openOutstandingQuantity > 0 && earliestExpectedDelivery != default && earliestExpectedDelivery <= projectedStockoutDate)
            {
                flag = FlagOnTrack;
            }
            else if (suggestedOrderByDate <= today)
            {
                flag = FlagUrgentReorder;
            }
            else
            {
                flag = FlagPlanAhead;
            }

            return new ReorderSuggestionViewModel
            {
                ProductId = product.Id,
                ProductName = product.Name,
                CurrentStock = product.StockQuantity,
                Flag = flag,
                ProjectedStockoutDate = projectedStockoutDate,
                SuggestedSupplierId = supplierId,
                SuggestedSupplierName = supplierName,
                SuggestedQuantity = Math.Round(suggestedQuantity, 0),
                SuggestedOrderByDate = suggestedOrderByDate,
                HasSeasonalData = hasSeasonalData,
                DailyConsumptionRate = Math.Round(dailyConsumptionRate, 2),
                LeadTimeDays = leadTimeDays,
                Reasoning = string.Empty
            };
        }

        private static (decimal multiplier, bool hasData) ComputeSeasonalMultiplier(Guid productId, DateTime today, List<Order> orders)
        {
            var earliestOrderDate = orders.Select(o => o.OrderDate).DefaultIfEmpty(today).Min();
            if (earliestOrderDate > today.AddYears(-1))
            {
                // Less than a year of history — comparing "next month" to last year isn't meaningful yet.
                return (1m, false);
            }

            var nextMonth = today.AddMonths(1).Month;
            var lastYearWindowStart = today.AddYears(-1).AddDays(-ConsumptionWindowDays);
            var lastYearWindowEnd = today.AddYears(-1);

            var lastYearItems = orders
                .Where(o => o.OrderDate >= lastYearWindowStart && o.OrderDate <= lastYearWindowEnd)
                .SelectMany(o => o.OrderItems.Select(i => new { o.OrderDate, i.Quantity, i.ProductId }))
                .Where(x => x.ProductId == productId)
                .ToList();

            var lastYearAverageDaily = lastYearItems.Sum(x => x.Quantity) / ConsumptionWindowDays;
            if (lastYearAverageDaily <= 0)
            {
                return (1m, false);
            }

            var lastYearSameMonthQuantity = orders
                .Where(o => o.OrderDate.Month == nextMonth && o.OrderDate.Year == today.AddYears(-1).Year)
                .SelectMany(o => o.OrderItems)
                .Where(i => i.ProductId == productId)
                .Sum(i => i.Quantity);

            var daysInMonth = DateTime.DaysInMonth(today.AddYears(-1).Year, nextMonth);
            var sameMonthAverageDaily = lastYearSameMonthQuantity / daysInMonth;

            var multiplier = sameMonthAverageDaily / lastYearAverageDaily;
            multiplier = Math.Max(MinSeasonalMultiplier, Math.Min(MaxSeasonalMultiplier, multiplier));

            return (multiplier, true);
        }

        private static (Guid? supplierId, string? supplierName, int leadTimeDays) ResolveSupplierAndLeadTime(
            Guid productId,
            List<PurchaseOrder> purchaseOrders,
            List<GoodsReceipt> goodsReceipts)
        {
            // Lead time: average days between a PurchaseOrder's OrderDate and the ReceivedDate of the
            // GoodsReceipt(s) that fulfilled it, for lines matching this product.
            var leadTimes = new List<int>();
            foreach (var goodsReceipt in goodsReceipts)
            {
                if (goodsReceipt.PurchaseOrder == null)
                {
                    continue;
                }

                foreach (var item in goodsReceipt.GoodsReceiptItems.Where(i => i.ProductId == productId))
                {
                    var days = (goodsReceipt.ReceivedDate.Date - goodsReceipt.PurchaseOrder.OrderDate.Date).Days;
                    if (days >= 0)
                    {
                        leadTimes.Add(days);
                    }
                }
            }

            var leadTimeDays = leadTimes.Count > 0 ? (int)Math.Round(leadTimes.Average()) : DefaultLeadTimeDays;

            // Suggested supplier: whoever most recently supplied this product, inferred from
            // PurchaseOrderItem history — no separate Product↔Supplier link table needed.
            var mostRecentPurchase = purchaseOrders
                .Where(po => po.PurchaseOrderItems.Any(i => i.ProductId == productId))
                .OrderByDescending(po => po.OrderDate)
                .FirstOrDefault();

            return (mostRecentPurchase?.SupplierId, mostRecentPurchase?.Supplier?.Name, leadTimeDays);
        }

        private async Task EnrichWithAiReasoningAsync(List<ReorderSuggestionViewModel> suggestions)
        {
            var actionable = suggestions.Where(s => s.Flag == FlagUrgentReorder || s.Flag == FlagPlanAhead).ToList();
            if (actionable.Count == 0)
            {
                foreach (var suggestion in suggestions)
                {
                    suggestion.Reasoning = GetFallbackReasoning(suggestion.Flag);
                }
                return;
            }

            var today = DateTime.UtcNow.Date;

            // Pre-compute relative day counts in C# rather than asking the model to do date math —
            // LLMs are unreliable at exact date arithmetic, and these numbers are exactly what makes
            // the generated reasoning feel concrete instead of a re-statement of the raw dates.
            var payloadItems = actionable.Select(s => new
            {
                product_id = s.ProductId.ToString(),
                product_name = s.ProductName,
                current_stock = s.CurrentStock,
                flag = s.Flag,
                projected_stockout_date = s.ProjectedStockoutDate?.ToString("yyyy-MM-dd"),
                days_until_stockout = s.ProjectedStockoutDate.HasValue ? (int?)(s.ProjectedStockoutDate.Value.Date - today).Days : null,
                suggested_order_by_date = s.SuggestedOrderByDate?.ToString("yyyy-MM-dd"),
                days_until_order_deadline = s.SuggestedOrderByDate.HasValue ? (int?)(s.SuggestedOrderByDate.Value.Date - today).Days : null,
                suggested_quantity = s.SuggestedQuantity,
                suggested_supplier_name = s.SuggestedSupplierName,
                daily_consumption_rate = s.DailyConsumptionRate,
                lead_time_days = s.LeadTimeDays,
                has_seasonal_data = s.HasSeasonalData
            }).ToList();

            var userContent = JsonSerializer.Serialize(new { items = payloadItems });

            var request = new AnthropicRequest
            {
                Model = ModelId,
                MaxTokens = 1500,
                System = "あなたは卸売・流通業向け仕入れ管理システムのAIアシスタントです。各商品について、在庫切れ予測日・発注期限・平均販売ペース・仕入先の標準リードタイムなど、算出済みのデータをもとに、現場の仕入れ担当者が読んですぐ納得できる理由を日本語で説明してください。" +
                    "単に入力された数値を読み上げるのではなく、「なぜ今このタイミングで発注する必要があるのか」「このまま放置するとどうなるか」を担当者の立場で伝えてください。days_until_order_deadline が0以下の場合は、すでに発注のタイミングを過ぎている旨を明確に伝えてください。" +
                    "has_seasonal_data が true の場合は季節的な需要変動（例年この時期は需要が高まる傾向がある、など）にも触れてください。false の場合は季節変動には触れないでください。" +
                    "daily_consumption_rate（1日あたりの平均販売数）、lead_time_days（発注から納品までの標準日数）、days_until_stockout（在庫切れまでの残り日数）のうち少なくとも1つは具体的な数値として文中に引用し、2〜3文で構成してください。数値そのものは変更せず、説明文の生成のみ行ってください。",
                Messages = new List<AnthropicMessage>
                {
                    new AnthropicMessage { Role = "user", Content = userContent }
                },
                Tools = new List<AnthropicTool>
                {
                    new AnthropicTool
                    {
                        Name = "provide_reorder_reasoning",
                        Description = "各商品の発注提案に対する理由説明を日本語で提供する",
                        InputSchema = new
                        {
                            type = "object",
                            properties = new
                            {
                                items = new
                                {
                                    type = "array",
                                    items = new
                                    {
                                        type = "object",
                                        properties = new
                                        {
                                            product_id = new { type = "string" },
                                            reasoning = new { type = "string", description = "発注提案の理由（日本語、2〜3文、具体的な数値を最低1つ根拠として引用すること）" }
                                        },
                                        required = new[] { "product_id", "reasoning" }
                                    }
                                }
                            },
                            required = new[] { "items" }
                        }
                    }
                },
                ToolChoice = new AnthropicToolChoice { Type = "tool", Name = "provide_reorder_reasoning" }
            };

            AnthropicResponse? response = null;
            try
            {
                response = await _anthropicClient.CreateMessageAsync(request);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "発注提案: Anthropic API call threw an exception");
            }

            var toolUseBlock = response?.Content.FirstOrDefault(c => c.Type == "tool_use");
            if (toolUseBlock != null && toolUseBlock.Input.TryGetProperty("items", out var itemsElement))
            {
                foreach (var itemElement in itemsElement.EnumerateArray())
                {
                    if (!itemElement.TryGetProperty("product_id", out var idProp) ||
                        !Guid.TryParse(idProp.GetString(), out var productId))
                    {
                        continue;
                    }

                    var suggestion = actionable.FirstOrDefault(s => s.ProductId == productId);
                    if (suggestion == null)
                    {
                        continue;
                    }

                    var reasoning = itemElement.TryGetProperty("reasoning", out var reasoningProp)
                        ? reasoningProp.GetString() ?? string.Empty
                        : string.Empty;

                    suggestion.Reasoning = string.IsNullOrWhiteSpace(reasoning) ? GetFallbackReasoning(suggestion.Flag) : reasoning;
                }
            }

            foreach (var suggestion in suggestions.Where(s => string.IsNullOrEmpty(s.Reasoning)))
            {
                suggestion.Reasoning = GetFallbackReasoning(suggestion.Flag);
            }
        }

        private static string GetFallbackReasoning(string flag)
        {
            return flag switch
            {
                FlagUrgentReorder => "在庫切れ予測日までに発注が間に合わない可能性があります。至急発注をご検討ください。",
                FlagPlanAhead => "現時点では在庫に余裕がありますが、計画的な発注をお勧めします。",
                FlagOnTrack => "すでに発注済みで、入荷予定日は在庫切れ予測日より前です。",
                FlagNoHistory => "販売実績が少ないため、発注提案を算出できませんでした。",
                _ => ""
            };
        }
    }
}
