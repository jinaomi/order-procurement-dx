using CaseMngmt.Models.Database;
using CaseMngmt.Models.EntityKeywords;
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
                var existing = await _context.EntityKeyword
                    .Where(x => !x.Deleted && x.EntityType == entityType && x.EntityId == entityId)
                    .ToListAsync();
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
    }
}
