using CaseMngmt.Models.Ai;
using CaseMngmt.Models.GoodsReceipts;
using CaseMngmt.Models.Products;
using CaseMngmt.Models.PurchaseOrders;
using CaseMngmt.Models.Suppliers;
using CaseMngmt.Repository.Products;
using CaseMngmt.Repository.PurchaseOrders;
using CaseMngmt.Repository.Suppliers;
using Microsoft.Extensions.Logging;

namespace CaseMngmt.Service.Ai
{
    public class AiProcurementExtractionService : IAiProcurementExtractionService
    {
        private readonly AnthropicClient _anthropicClient;
        private readonly ISupplierRepository _supplierRepository;
        private readonly IProductRepository _productRepository;
        private readonly IPurchaseOrderRepository _purchaseOrderRepository;
        private readonly ILogger<AiProcurementExtractionService> _logger;

        private const string ModelId = "claude-opus-4-8";

        public AiProcurementExtractionService(
            AnthropicClient anthropicClient,
            ISupplierRepository supplierRepository,
            IProductRepository productRepository,
            IPurchaseOrderRepository purchaseOrderRepository,
            ILogger<AiProcurementExtractionService> logger)
        {
            _anthropicClient = anthropicClient;
            _supplierRepository = supplierRepository;
            _productRepository = productRepository;
            _purchaseOrderRepository = purchaseOrderRepository;
            _logger = logger;
        }

        public async Task<PurchaseOrderExtractionResult?> ExtractPurchaseOrderAsync(byte[] fileBytes, string mediaType, Guid companyId)
        {
            var request = BuildRequest(
                fileBytes,
                mediaType,
                system: "あなたは卸売・流通業向け仕入れ管理システムのAIアシスタントです。アップロードされた見積書の画像またはPDFから、仕入先名・見積日・納品予定日・品目明細（品名・数量・単価）を読み取り、指定されたツールを使って構造化データとして返してください。数値は半角数字に変換してください。" +
                    "重要：該当箇所に本当に何も記載がない場合のみ空文字または0にしてください。文字が書かれているが手書きで不鮮明・崩し字・略称（例：「株式会社」を「（株）」と略しているなど）で確信が持てない場合は、絶対に空文字にせず、実際に書かれている通りの文字列をそのまま転記した上で、confidenceを低く設定してください。仕入先名（supplier_name）も品目と同様に、読み取れる限り必ず転記し、supplier_name_confidenceで確信度を表現してください。",
                userText: "この見積書から情報を抽出してください。",
                toolName: "extract_purchase_order",
                toolDescription: "見積書の画像またはPDFから発注情報を抽出する",
                nameField: "supplier_name",
                nameFieldDescription: "仕入先名。手書きが不鮮明・崩し字・略称（「（株）」等）でも、実際に書かれている通りの文字列をそのまま転記すること（推測で正式名称に変換したり、確信が持てないからと省略しないこと）。本当に何も記載がない場合のみ空文字",
                nameConfidenceField: "supplier_name_confidence",
                dateField: "order_date",
                dateFieldDescription: "見積日（YYYY-MM-DD形式）。読み取れない場合は空文字",
                secondDateField: "expected_delivery_date",
                secondDateFieldDescription: "納品予定日（YYYY-MM-DD形式）。読み取れない場合は空文字",
                includeUnitPrice: true);

            AnthropicResponse? response;
            try
            {
                response = await _anthropicClient.CreateMessageAsync(request);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "仕入れデータ化（見積書）: Anthropic API call threw an exception");
                return null;
            }

            var toolUseBlock = response?.Content.FirstOrDefault(c => c.Type == "tool_use");
            if (toolUseBlock == null)
            {
                _logger.LogError("仕入れデータ化（見積書）: Anthropic response did not contain a tool_use block");
                return null;
            }

            var input = toolUseBlock.Input;
            var result = new PurchaseOrderExtractionResult();

            if (input.TryGetProperty("supplier_name", out var supplierNameEl))
            {
                var name = supplierNameEl.GetString();
                result.SupplierNameGuess = string.IsNullOrWhiteSpace(name) ? null : name;
            }

            result.SupplierNameConfidence = input.TryGetProperty("supplier_name_confidence", out var supplierConfEl)
                ? supplierConfEl.GetDouble()
                : 0.5;

            if (input.TryGetProperty("order_date", out var orderDateEl) &&
                DateTime.TryParse(orderDateEl.GetString(), out var orderDate))
            {
                result.OrderDateGuess = orderDate;
            }

            if (input.TryGetProperty("expected_delivery_date", out var deliveryDateEl) &&
                DateTime.TryParse(deliveryDateEl.GetString(), out var deliveryDate))
            {
                result.ExpectedDeliveryDateGuess = deliveryDate;
            }

            var companySuppliers = await _supplierRepository.GetAllAsync(companyId);
            if (!string.IsNullOrEmpty(result.SupplierNameGuess))
            {
                var normalizedGuess = NormalizeCompanyName(result.SupplierNameGuess);
                var matchedSupplier = companySuppliers.FirstOrDefault(s =>
                    NormalizeCompanyName(s.Name).Equals(normalizedGuess, StringComparison.OrdinalIgnoreCase));
                result.SupplierIdMatch = matchedSupplier?.Id;
            }

            var companyProducts = await _productRepository.GetAllAsync(companyId);
            if (input.TryGetProperty("items", out var itemsEl))
            {
                foreach (var itemEl in itemsEl.EnumerateArray())
                {
                    var productName = itemEl.TryGetProperty("product_name", out var nameEl) ? nameEl.GetString() ?? string.Empty : string.Empty;
                    var quantity = itemEl.TryGetProperty("quantity", out var qtyEl) ? qtyEl.GetDecimal() : 0;
                    var unitPrice = itemEl.TryGetProperty("unit_price", out var priceEl) ? priceEl.GetDecimal() : 0;
                    var confidence = itemEl.TryGetProperty("confidence", out var confEl) ? confEl.GetDouble() : 0.5;

                    var matchedProduct = MatchProduct(companyProducts, productName);

                    result.Items.Add(new PurchaseOrderExtractionItem
                    {
                        ProductNameRaw = productName,
                        ProductIdMatch = matchedProduct?.Id,
                        Quantity = quantity,
                        UnitPrice = matchedProduct?.UnitPrice ?? unitPrice,
                        Confidence = confidence
                    });
                }
            }

            return result;
        }

        public async Task<GoodsReceiptExtractionResult?> ExtractGoodsReceiptAsync(byte[] fileBytes, string mediaType, Guid companyId, Guid? purchaseOrderId)
        {
            var request = BuildRequest(
                fileBytes,
                mediaType,
                system: "あなたは卸売・流通業向け仕入れ管理システムのAIアシスタントです。アップロードされた納品書の画像またはPDFから、納品日・品目明細（品名・数量）を読み取り、指定されたツールを使って構造化データとして返してください。数値は半角数字に変換してください。" +
                    "重要：該当箇所に本当に何も記載がない場合のみ空文字または0にしてください。文字が書かれているが手書きで不鮮明・崩し字で確信が持てない場合は、絶対に空文字にせず、実際に書かれている通りの文字列をそのまま転記した上で、confidenceを低く設定してください。",
                userText: "この納品書から情報を抽出してください。",
                toolName: "extract_goods_receipt",
                toolDescription: "納品書の画像またはPDFから入荷情報を抽出する",
                nameField: null,
                nameFieldDescription: null,
                nameConfidenceField: null,
                dateField: "received_date",
                dateFieldDescription: "納品日（YYYY-MM-DD形式）。読み取れない場合は空文字",
                secondDateField: null,
                secondDateFieldDescription: null,
                includeUnitPrice: false);

            AnthropicResponse? response;
            try
            {
                response = await _anthropicClient.CreateMessageAsync(request);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "仕入れデータ化（納品書）: Anthropic API call threw an exception");
                return null;
            }

            var toolUseBlock = response?.Content.FirstOrDefault(c => c.Type == "tool_use");
            if (toolUseBlock == null)
            {
                _logger.LogError("仕入れデータ化（納品書）: Anthropic response did not contain a tool_use block");
                return null;
            }

            var input = toolUseBlock.Input;
            var result = new GoodsReceiptExtractionResult();

            if (input.TryGetProperty("received_date", out var receivedDateEl) &&
                DateTime.TryParse(receivedDateEl.GetString(), out var receivedDate))
            {
                result.ReceivedDateGuess = receivedDate;
            }

            var companyProducts = await _productRepository.GetAllAsync(companyId);

            // A delivery note is always received against a known PO, so preload it to bias/validate
            // product matching — 納品書 line items are often terser than 見積書 ones.
            var purchaseOrder = purchaseOrderId.HasValue
                ? await _purchaseOrderRepository.GetByIdAsync(purchaseOrderId.Value, companyId)
                : null;

            if (input.TryGetProperty("items", out var itemsEl))
            {
                foreach (var itemEl in itemsEl.EnumerateArray())
                {
                    var productName = itemEl.TryGetProperty("product_name", out var nameEl) ? nameEl.GetString() ?? string.Empty : string.Empty;
                    var quantity = itemEl.TryGetProperty("quantity", out var qtyEl) ? qtyEl.GetDecimal() : 0;
                    var confidence = itemEl.TryGetProperty("confidence", out var confEl) ? confEl.GetDouble() : 0.5;

                    var matchedProduct = MatchProduct(companyProducts, productName);

                    Guid? matchedPurchaseOrderItemId = null;
                    if (purchaseOrder != null)
                    {
                        var poItem = matchedProduct != null
                            ? purchaseOrder.PurchaseOrderItems.FirstOrDefault(i => i.ProductId == matchedProduct.Id)
                            : null;

                        poItem ??= purchaseOrder.PurchaseOrderItems.FirstOrDefault(i =>
                            NormalizeProductName(i.ProductNameRaw).Equals(NormalizeProductName(productName), StringComparison.OrdinalIgnoreCase));

                        matchedPurchaseOrderItemId = poItem?.Id;
                    }

                    result.Items.Add(new GoodsReceiptExtractionItem
                    {
                        ProductNameRaw = productName,
                        ProductIdMatch = matchedProduct?.Id,
                        PurchaseOrderItemIdMatch = matchedPurchaseOrderItemId,
                        ReceivedQuantity = quantity,
                        Confidence = confidence
                    });
                }
            }

            return result;
        }

        private static AnthropicRequest BuildRequest(
            byte[] fileBytes,
            string mediaType,
            string system,
            string userText,
            string toolName,
            string toolDescription,
            string? nameField,
            string? nameFieldDescription,
            string? nameConfidenceField,
            string? dateField,
            string? dateFieldDescription,
            string? secondDateField,
            string? secondDateFieldDescription,
            bool includeUnitPrice)
        {
            var base64Data = Convert.ToBase64String(fileBytes);
            var isPdf = mediaType == "application/pdf";

            object documentBlock = isPdf
                ? new { type = "document", source = new { type = "base64", media_type = mediaType, data = base64Data } }
                : new { type = "image", source = new { type = "base64", media_type = mediaType, data = base64Data } };

            var itemProperties = new Dictionary<string, object>
            {
                ["product_name"] = new { type = "string", description = "品名" },
                ["quantity"] = new { type = "number", description = "数量" },
                ["confidence"] = new { type = "number", description = "この行の抽出結果に対する信頼度（0.0〜1.0）" }
            };
            var itemRequired = new List<string> { "product_name", "quantity", "confidence" };
            if (includeUnitPrice)
            {
                itemProperties["unit_price"] = new { type = "number", description = "単価。読み取れない場合は0" };
            }

            var topProperties = new Dictionary<string, object>
            {
                ["items"] = new
                {
                    type = "array",
                    items = new
                    {
                        type = "object",
                        properties = itemProperties,
                        required = itemRequired.ToArray()
                    }
                }
            };
            var topRequired = new List<string> { "items" };

            if (nameField != null)
            {
                topProperties[nameField] = new { type = "string", description = nameFieldDescription };
                topProperties[nameConfidenceField!] = new { type = "number", description = $"{nameField}の読み取りに対する信頼度（0.0〜1.0）。手書きが不鮮明・略称・崩し字などで確信が持てない場合は低い値を設定" };
                topRequired.Add(nameField);
                topRequired.Add(nameConfidenceField!);
            }
            if (dateField != null)
            {
                topProperties[dateField] = new { type = "string", description = dateFieldDescription };
            }
            if (secondDateField != null)
            {
                topProperties[secondDateField] = new { type = "string", description = secondDateFieldDescription };
            }

            return new AnthropicRequest
            {
                Model = ModelId,
                MaxTokens = 2000,
                System = system,
                Messages = new List<AnthropicMessage>
                {
                    new AnthropicMessage
                    {
                        Role = "user",
                        Content = new List<object> { documentBlock, new { type = "text", text = userText } }
                    }
                },
                Tools = new List<AnthropicTool>
                {
                    new AnthropicTool
                    {
                        Name = toolName,
                        Description = toolDescription,
                        InputSchema = new
                        {
                            type = "object",
                            properties = topProperties,
                            required = topRequired.ToArray()
                        }
                    }
                },
                ToolChoice = new AnthropicToolChoice { Type = "tool", Name = toolName }
            };
        }

        private static readonly string[] CompanySuffixVariants =
        {
            "株式会社", "（株）", "(株)", "㈱",
            "有限会社", "（有）", "(有)", "㈲"
        };

        private static string NormalizeCompanyName(string name)
        {
            var normalized = name.Trim();
            foreach (var suffix in CompanySuffixVariants)
            {
                normalized = normalized.Replace(suffix, string.Empty);
            }
            return normalized.Trim();
        }

        private static string NormalizeProductName(string name)
        {
            return name.Trim().Replace(" ", string.Empty).Replace("　", string.Empty);
        }

        private static Product? MatchProduct(List<Product> companyProducts, string productName)
        {
            var normalizedGuess = NormalizeProductName(productName);
            if (string.IsNullOrEmpty(normalizedGuess))
            {
                return null;
            }

            var exactMatch = companyProducts.FirstOrDefault(p =>
                NormalizeProductName(p.Name).Equals(normalizedGuess, StringComparison.OrdinalIgnoreCase));
            if (exactMatch != null)
            {
                return exactMatch;
            }

            var fuzzyCandidates = companyProducts.Where(p =>
            {
                var normalizedProduct = NormalizeProductName(p.Name);
                return normalizedProduct.Contains(normalizedGuess, StringComparison.OrdinalIgnoreCase) ||
                    normalizedGuess.Contains(normalizedProduct, StringComparison.OrdinalIgnoreCase);
            }).ToList();

            return fuzzyCandidates.Count == 1 ? fuzzyCandidates[0] : null;
        }
    }
}
