using CaseMngmt.Models.CaseKeywords;
using CaseMngmt.Models.Database;
using CaseMngmt.Models.EntityKeywords;
using CaseMngmt.Models.FileUploads;
using Microsoft.EntityFrameworkCore;

namespace CaseMngmt.Repository.EntityKeywords
{
    public class EntityKeywordRepository : IEntityKeywordRepository
    {
        private ApplicationDbContext _context;

        public EntityKeywordRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<List<EntityKeywordValue>> GetByEntityAsync(string entityType, Guid entityId)
        {
            try
            {
                var query = from entityKeyword in _context.EntityKeyword
                            join keyword in _context.Keyword on entityKeyword.KeywordId equals keyword.Id
                            join type in _context.Type on keyword.TypeId equals type.Id
                            where !entityKeyword.Deleted
                                && !keyword.Deleted
                                && !keyword.IsHidden
                                && entityKeyword.EntityType == entityType
                                && entityKeyword.EntityId == entityId
                            select new EntityKeywordValue
                            {
                                KeywordId = keyword.Id,
                                KeywordName = keyword.Name,
                                Value = entityKeyword.Value,
                                IsRequired = keyword.IsRequired,
                                MaxLength = keyword.MaxLength,
                                Order = keyword.Order,
                                TypeId = type.Id,
                                TypeName = type.Name,
                                TypeValue = type.Value,
                                Metadata = !string.IsNullOrEmpty(type.Metadata)
                                    ? type.Metadata.Split(',', StringSplitOptions.None).ToList()
                                    : new List<string>()
                            };
                var result = await query.OrderBy(x => x.Order).ToListAsync();
                return result;
            }
            catch (Exception)
            {
                return new List<EntityKeywordValue>();
            }
        }

        public async Task<int> ReplaceValuesAsync(string entityType, Guid entityId, List<EntityKeywordValueRequest> values, Guid currentUserId)
        {
            try
            {
                // Only replace rows backing a real form field (Keyword.IsShowOnTemplate == true). File
                // attachments (see AddAsync/GetDocumentFilesAsync) share this same table but are stored
                // with IsShowOnTemplate == false precisely so a custom-field form submit never wipes them
                // out — mirrors the identical guard in CaseKeywordRepository.UpdateMultiAsync.
                var existingIds = await (from entityKeyword in _context.EntityKeyword
                                          join keyword in _context.Keyword on entityKeyword.KeywordId equals keyword.Id
                                          where !entityKeyword.Deleted
                                              && entityKeyword.EntityType == entityType
                                              && entityKeyword.EntityId == entityId
                                              && keyword.IsShowOnTemplate
                                          select entityKeyword.Id).ToListAsync();
                var existing = await _context.EntityKeyword.Where(x => existingIds.Contains(x.Id)).ToListAsync();
                _context.EntityKeyword.RemoveRange(existing);
                await _context.SaveChangesAsync();

                if (values != null && values.Any())
                {
                    var newRows = values
                        .Where(v => v.KeywordId != Guid.Empty)
                        .Select(v => new Models.EntityKeywords.EntityKeyword
                        {
                            EntityType = entityType,
                            EntityId = entityId,
                            KeywordId = v.KeywordId,
                            Value = v.Value,
                            CreatedBy = currentUserId,
                            UpdatedBy = currentUserId
                        }).ToList();

                    if (newRows.Any())
                    {
                        await _context.EntityKeyword.AddRangeAsync(newRows);
                        await _context.SaveChangesAsync();
                    }
                }

                return 1;
            }
            catch (Exception)
            {
                return 0;
            }
        }

        public async Task<bool> HasUsageAsync(Guid keywordId)
        {
            try
            {
                return await _context.EntityKeyword.AnyAsync(x => x.KeywordId == keywordId && !x.Deleted);
            }
            catch (Exception)
            {
                return false;
            }
        }

        public async Task<int> AddAsync(EntityKeyword entityKeyword)
        {
            try
            {
                await _context.EntityKeyword.AddAsync(entityKeyword);
                return await _context.SaveChangesAsync();
            }
            catch (Exception)
            {
                return 0;
            }
        }

        public async Task<int> DeleteAsync(Guid id)
        {
            try
            {
                var model = await _context.EntityKeyword.FindAsync(id);
                if (model == null)
                {
                    return 0;
                }

                model.Deleted = true;
                await _context.SaveChangesAsync();
                return 1;
            }
            catch (Exception)
            {
                return 0;
            }
        }

        public async Task<EntityKeyword?> GetByEntityAndKeywordIdAsync(string entityType, Guid entityId, Guid keywordId)
        {
            try
            {
                return await _context.EntityKeyword.FirstOrDefaultAsync(x =>
                    !x.Deleted && x.EntityType == entityType && x.EntityId == entityId && x.KeywordId == keywordId);
            }
            catch (Exception)
            {
                return null;
            }
        }

        public async Task<IEnumerable<FileResponse>> GetFileKeywordsByEntityAsync(string entityType, Guid entityId)
        {
            try
            {
                var query = from entityKeyword in _context.EntityKeyword
                            join keyword in _context.Keyword on entityKeyword.KeywordId equals keyword.Id
                            where !entityKeyword.Deleted
                                && !keyword.Deleted
                                && entityKeyword.EntityType == entityType
                                && entityKeyword.EntityId == entityId
                                && !keyword.IsShowOnTemplate
                            select new FileResponse
                            {
                                KeywordId = entityKeyword.KeywordId,
                                FileName = keyword.Name,
                                FilePath = entityKeyword.Value
                            };
                var result = await query.OrderBy(x => x.FileName).ToListAsync();
                return result;
            }
            catch (Exception)
            {
                return new List<FileResponse>();
            }
        }

        private static readonly HashSet<string> SalesEntityTypes = new() { "Order", "Invoice" };
        private static readonly HashSet<string> ProcurementEntityTypes = new() { "PurchaseOrder", "PurchaseInvoice", "GoodsReceipt" };

        // Computes which entity ids satisfy the fixed-column filters (DateFrom/DateTo/CustomerId/SupplierId).
        // These columns live on the real Order/Invoice/PurchaseOrder/PurchaseInvoice/GoodsReceipt tables, not
        // in EntityKeyword, so they can't be expressed as a Keyword match — this mirrors that fixed/dynamic
        // field split (see CLAUDE.md decision #6) by resolving allowed ids up front and intersecting below.
        // Group-exclusion rule: a supplierId-only filter has no meaning for 受注 (Order/Invoice have no
        // SupplierId), so that whole group is excluded rather than silently ignoring the filter; symmetric
        // for customerId-only on 仕入れ (PurchaseOrder/PurchaseInvoice/GoodsReceipt).
        private async Task<HashSet<Guid>> GetAllowedEntityIdsAsync(Guid companyId, List<string> entityTypes,
            DateTime? dateFrom, DateTime? dateTo, Guid? customerId, Guid? supplierId)
        {
            var allowedIds = new HashSet<Guid>();

            var includeSales = entityTypes.Any(SalesEntityTypes.Contains) && !(supplierId.HasValue && !customerId.HasValue);
            if (includeSales)
            {
                if (entityTypes.Contains("Order"))
                {
                    var ids = await _context.Order.Where(o => !o.Deleted && o.CompanyId == companyId
                            && (!customerId.HasValue || o.CustomerId == customerId.Value)
                            && (!dateFrom.HasValue || o.OrderDate.Date >= dateFrom.Value.Date)
                            && (!dateTo.HasValue || o.OrderDate.Date <= dateTo.Value.Date))
                        .Select(o => o.Id).ToListAsync();
                    allowedIds.UnionWith(ids);
                }
                if (entityTypes.Contains("Invoice"))
                {
                    var ids = await _context.Invoice.Where(i => !i.Deleted && i.CompanyId == companyId
                            && (!customerId.HasValue || i.CustomerId == customerId.Value)
                            && (!dateFrom.HasValue || i.IssueDate.Date >= dateFrom.Value.Date)
                            && (!dateTo.HasValue || i.IssueDate.Date <= dateTo.Value.Date))
                        .Select(i => i.Id).ToListAsync();
                    allowedIds.UnionWith(ids);
                }
            }

            var includeProcurement = entityTypes.Any(ProcurementEntityTypes.Contains) && !(customerId.HasValue && !supplierId.HasValue);
            if (includeProcurement)
            {
                if (entityTypes.Contains("PurchaseOrder"))
                {
                    var ids = await _context.PurchaseOrder.Where(p => !p.Deleted && p.CompanyId == companyId
                            && (!supplierId.HasValue || p.SupplierId == supplierId.Value)
                            && (!dateFrom.HasValue || p.OrderDate.Date >= dateFrom.Value.Date)
                            && (!dateTo.HasValue || p.OrderDate.Date <= dateTo.Value.Date))
                        .Select(p => p.Id).ToListAsync();
                    allowedIds.UnionWith(ids);
                }
                if (entityTypes.Contains("PurchaseInvoice"))
                {
                    var ids = await _context.PurchaseInvoice.Where(p => !p.Deleted && p.CompanyId == companyId
                            && (!supplierId.HasValue || p.SupplierId == supplierId.Value)
                            && (!dateFrom.HasValue || p.IssueDate.Date >= dateFrom.Value.Date)
                            && (!dateTo.HasValue || p.IssueDate.Date <= dateTo.Value.Date))
                        .Select(p => p.Id).ToListAsync();
                    allowedIds.UnionWith(ids);
                }
                if (entityTypes.Contains("GoodsReceipt"))
                {
                    var ids = await _context.GoodsReceipt.Where(g => !g.Deleted && g.CompanyId == companyId
                            && (!supplierId.HasValue || g.SupplierId == supplierId.Value)
                            && (!dateFrom.HasValue || g.ReceivedDate.Date >= dateFrom.Value.Date)
                            && (!dateTo.HasValue || g.ReceivedDate.Date <= dateTo.Value.Date))
                        .Select(g => g.Id).ToListAsync();
                    allowedIds.UnionWith(ids);
                }
            }

            return allowedIds;
        }

        // Looks up the human-readable identifier (BaseModel.Name — set to the generated document
        // number at creation time, e.g. PurchaseOrderNumber/OrderNumber) for exactly the entity ids
        // that ended up in a result set, so 書類管理 can show which record a file belongs to without
        // an extra round trip. Scoped to only the needed ids (not the whole company) to stay cheap.
        private async Task<Dictionary<Guid, string>> GetEntityDisplayNamesAsync(Dictionary<string, List<Guid>> idsByType)
        {
            var names = new Dictionary<Guid, string>();

            if (idsByType.TryGetValue("Order", out var orderIds) && orderIds.Count > 0)
            {
                var rows = await _context.Order.Where(o => orderIds.Contains(o.Id)).Select(o => new { o.Id, o.Name }).ToListAsync();
                foreach (var row in rows) names[row.Id] = row.Name;
            }
            if (idsByType.TryGetValue("Invoice", out var invoiceIds) && invoiceIds.Count > 0)
            {
                var rows = await _context.Invoice.Where(i => invoiceIds.Contains(i.Id)).Select(i => new { i.Id, i.Name }).ToListAsync();
                foreach (var row in rows) names[row.Id] = row.Name;
            }
            if (idsByType.TryGetValue("PurchaseOrder", out var poIds) && poIds.Count > 0)
            {
                var rows = await _context.PurchaseOrder.Where(p => poIds.Contains(p.Id)).Select(p => new { p.Id, p.Name }).ToListAsync();
                foreach (var row in rows) names[row.Id] = row.Name;
            }
            if (idsByType.TryGetValue("PurchaseInvoice", out var piIds) && piIds.Count > 0)
            {
                var rows = await _context.PurchaseInvoice.Where(p => piIds.Contains(p.Id)).Select(p => new { p.Id, p.Name }).ToListAsync();
                foreach (var row in rows) names[row.Id] = row.Name;
            }
            if (idsByType.TryGetValue("GoodsReceipt", out var grIds) && grIds.Count > 0)
            {
                var rows = await _context.GoodsReceipt.Where(g => grIds.Contains(g.Id)).Select(g => new { g.Id, g.Name }).ToListAsync();
                foreach (var row in rows) names[row.Id] = row.Name;
            }

            return names;
        }

        public async Task<List<CaseKeywordBaseValue>> GetDocumentFilesAsync(Guid companyId, List<string> entityTypes, Guid? fileTypeId,
            List<KeywordValue> keywordValues, List<KeywordSearchRangeValue> keywordDateValues, List<KeywordSearchRangeValue> keywordDecimalValues,
            DateTime? dateFrom, DateTime? dateTo, Guid? customerId, Guid? supplierId)
        {
            try
            {
                HashSet<Guid> allowedIds = null;
                if (dateFrom.HasValue || dateTo.HasValue || customerId.HasValue || supplierId.HasValue)
                {
                    allowedIds = await GetAllowedEntityIdsAsync(companyId, entityTypes, dateFrom, dateTo, customerId, supplierId);
                }

                // Group by (EntityType, EntityId) — mirrors CaseKeywordRepository.GetDocumentsAsync's
                // group-by-Case pattern — so a custom field's KeywordValues/date/decimal match is evaluated
                // against ALL EntityKeyword rows belonging to the same record, then only the actual file rows
                // (!IsShowOnTemplate && DocumentSearchable) are selected out of the matching groups.
                var queryable = (from entityKeyword in _context.EntityKeyword
                                 join keyword in _context.Keyword on entityKeyword.KeywordId equals keyword.Id
                                 join type in _context.Type on keyword.TypeId equals type.Id
                                 join template in _context.Template on keyword.TemplateId equals template.Id
                                 join companyTemplate in _context.CompanyTemplate on template.Id equals companyTemplate.TemplateId
                                 where !entityKeyword.Deleted
                                    && !keyword.Deleted
                                    && companyTemplate.CompanyId == companyId
                                    && entityTypes.Contains(entityKeyword.EntityType)
                                 select new { entityKeyword, keyword, type })
                                .AsEnumerable()
                                .GroupBy(x => new { x.entityKeyword.EntityType, x.entityKeyword.EntityId });

                if (allowedIds != null)
                {
                    queryable = queryable.Where(z => allowedIds.Contains(z.Key.EntityId));
                }

                if (keywordValues != null && keywordValues.Any())
                {
                    queryable = queryable.Where(z => keywordValues.All(x => z.Any(c => c.entityKeyword.KeywordId.Equals(x.KeywordId)
                        && !string.IsNullOrEmpty(c.entityKeyword.Value) && c.entityKeyword.Value.Contains(x.Value))));
                }

                if (keywordDateValues != null && keywordDateValues.Any())
                {
                    queryable = queryable.Where(z => keywordDateValues.All(x => z.Any(c => c.entityKeyword.KeywordId.Equals(x.KeywordId)
                        && !string.IsNullOrEmpty(c.entityKeyword.Value)
                        && (string.IsNullOrEmpty(x.FromValue) || DateTime.Parse(c.entityKeyword.Value).Date >= DateTime.Parse(x.FromValue).Date)
                        && (string.IsNullOrEmpty(x.ToValue) || DateTime.Parse(c.entityKeyword.Value).Date <= DateTime.Parse(x.ToValue).Date))));
                }

                if (keywordDecimalValues != null && keywordDecimalValues.Any())
                {
                    queryable = queryable.Where(z => keywordDecimalValues.All(x => z.Any(c => c.entityKeyword.KeywordId.Equals(x.KeywordId)
                        && !string.IsNullOrEmpty(c.entityKeyword.Value)
                        && (string.IsNullOrEmpty(x.FromValue) || decimal.Parse(c.entityKeyword.Value) >= decimal.Parse(x.FromValue))
                        && (string.IsNullOrEmpty(x.ToValue) || decimal.Parse(c.entityKeyword.Value) <= decimal.Parse(x.ToValue)))));
                }

                if (fileTypeId != null && fileTypeId != Guid.Empty)
                {
                    queryable = queryable.Where(z => z.Any(x => x.type.Id == fileTypeId));
                }

                var fileResult = queryable.SelectMany(z => z.Where(x => !x.keyword.IsShowOnTemplate && x.keyword.DocumentSearchable));

                if (fileTypeId != null && fileTypeId != Guid.Empty)
                {
                    fileResult = fileResult.Where(x => x.type.Id == fileTypeId);
                }

                var fileRows = fileResult.ToList();
                var neededIdsByType = fileRows
                    .GroupBy(x => x.entityKeyword.EntityType)
                    .ToDictionary(g => g.Key, g => g.Select(x => x.entityKeyword.EntityId).Distinct().ToList());
                var entityNames = await GetEntityDisplayNamesAsync(neededIdsByType);

                var result = fileRows
                    .Select(x => new CaseKeywordBaseValue
                    {
                        EntityType = x.entityKeyword.EntityType,
                        EntityId = x.entityKeyword.EntityId,
                        EntityDisplayName = entityNames.GetValueOrDefault(x.entityKeyword.EntityId),
                        KeywordId = x.keyword.Id,
                        KeywordName = x.keyword.Name,
                        Value = x.entityKeyword.Value,
                        IsRequired = x.keyword.IsRequired,
                        MaxLength = x.keyword.MaxLength,
                        Searchable = x.keyword.CaseSearchable,
                        DocumentSearchable = x.keyword.DocumentSearchable,
                        IsShowOnCaseList = x.keyword.IsShowOnCaseList,
                        IsShowOnTemplate = x.keyword.IsShowOnTemplate,
                        Order = x.keyword.Order,
                        TypeId = x.type.Id,
                        TypeName = x.type.Name,
                        TypeValue = x.type.Value,
                        Metadata = !string.IsNullOrEmpty(x.type.Metadata)
                            ? x.type.Metadata.Split(',', StringSplitOptions.None).ToList()
                            : new List<string>()
                    })
                    .OrderByDescending(x => x.Value)
                    .ToList();

                return result;
            }
            catch (Exception)
            {
                return new List<CaseKeywordBaseValue>();
            }
        }
    }
}
