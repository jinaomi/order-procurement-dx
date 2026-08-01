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

        public async Task<List<CaseKeywordBaseValue>> GetDocumentFilesAsync(Guid companyId, List<string> entityTypes, Guid? fileTypeId)
        {
            try
            {
                var query = from entityKeyword in _context.EntityKeyword
                            join keyword in _context.Keyword on entityKeyword.KeywordId equals keyword.Id
                            join type in _context.Type on keyword.TypeId equals type.Id
                            join template in _context.Template on keyword.TemplateId equals template.Id
                            join companyTemplate in _context.CompanyTemplate on template.Id equals companyTemplate.TemplateId
                            where !entityKeyword.Deleted
                                && !keyword.Deleted
                                && !keyword.IsShowOnTemplate
                                && keyword.DocumentSearchable
                                && companyTemplate.CompanyId == companyId
                                && entityTypes.Contains(entityKeyword.EntityType)
                                && (fileTypeId == null || fileTypeId == Guid.Empty || type.Id == fileTypeId)
                            select new CaseKeywordBaseValue
                            {
                                EntityType = entityKeyword.EntityType,
                                EntityId = entityKeyword.EntityId,
                                KeywordId = keyword.Id,
                                KeywordName = keyword.Name,
                                Value = entityKeyword.Value,
                                IsRequired = keyword.IsRequired,
                                MaxLength = keyword.MaxLength,
                                Searchable = keyword.CaseSearchable,
                                DocumentSearchable = keyword.DocumentSearchable,
                                IsShowOnCaseList = keyword.IsShowOnCaseList,
                                IsShowOnTemplate = keyword.IsShowOnTemplate,
                                Order = keyword.Order,
                                TypeId = type.Id,
                                TypeName = type.Name,
                                TypeValue = type.Value,
                                Metadata = !string.IsNullOrEmpty(type.Metadata)
                                    ? type.Metadata.Split(',', StringSplitOptions.None).ToList()
                                    : new List<string>()
                            };
                return await query.OrderByDescending(x => x.Value).ToListAsync();
            }
            catch (Exception)
            {
                return new List<CaseKeywordBaseValue>();
            }
        }
    }
}
