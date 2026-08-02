using CaseMngmt.Models.Database;
using Microsoft.EntityFrameworkCore;
using CaseMngmt.Models.CaseKeywords;
using CaseMngmt.Models.FileUploads;
using CaseMngmt.Models;

namespace CaseMngmt.Repository.CaseKeywords
{
    public class CaseKeywordRepository : ICaseKeywordRepository
    {
        private ApplicationDbContext _context;

        public CaseKeywordRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<int> AddAsync(CaseKeyword caseKey)
        {
            try
            {
                await _context.CaseKeyword.AddAsync(caseKey);
                var result = _context.SaveChanges();

                return result;
            }
            catch (Exception ex)
            {
                return 0;
            }
        }

        public async Task<int> AddMultiAsync(List<CaseKeyword> caseKeys)
        {
            try
            {
                await _context.CaseKeyword.AddRangeAsync(caseKeys);
                var result = _context.SaveChanges();

                return result;
            }
            catch (Exception ex)
            {
                return 0;
            }
        }

        public async Task<IEnumerable<CaseKeywordBaseValue>?> GetByIdAsync(Guid caseId, bool isAdmin)
        {
            try
            {
                var IQueryable = (from caseKeyword in _context.CaseKeyword
                                  join keyword in _context.Keyword on caseKeyword.KeywordId equals keyword.Id
                                  join type in _context.Type on keyword.TypeId equals type.Id
                                  where !caseKeyword.Deleted
                                    && caseKeyword.CaseId == caseId
                                    && caseKeyword.Keyword.IsShowOnTemplate
                                    && caseKeyword.Case.Status == "Open"
                                    && !keyword.IsHidden
                                    && (isAdmin || !keyword.IsHiddenForUser)
                                  select new CaseKeywordBaseValue
                                  {
                                      KeywordId = caseKeyword.KeywordId,
                                      KeywordName = caseKeyword.Keyword.Name,
                                      Value = caseKeyword.Value,
                                      IsRequired = caseKeyword.Keyword.IsRequired,
                                      MaxLength = caseKeyword.Keyword.MaxLength,
                                      Searchable = caseKeyword.Keyword.CaseSearchable,
                                      DocumentSearchable = caseKeyword.Keyword.DocumentSearchable,
                                      IsShowOnCaseList = caseKeyword.Keyword.IsShowOnCaseList,
                                      IsShowOnTemplate = caseKeyword.Keyword.IsShowOnTemplate,
                                      Order = keyword.Order,
                                      TypeId = caseKeyword.Keyword.Type.Id,
                                      TypeName = caseKeyword.Keyword.Type.Name,
                                      TypeValue = caseKeyword.Keyword.Type.Value,
                                      Metadata = !string.IsNullOrEmpty(caseKeyword.Keyword.Type.Metadata)
                                                ? caseKeyword.Keyword.Type.Metadata.Split(',', StringSplitOptions.None).ToList()
                                                : new List<string>()
                                  });
                var result = await IQueryable.OrderBy(x => x.Order).ToListAsync();
                return result;
            }
            catch (Exception ex)
            {
                return null;
            }
        }

        public async Task<PagedResult<CaseKeywordViewModel>?> GetAllAsync(CaseKeywordSearchRequest searchRequest)
        {
            try
            {
                List<Guid>? filterCaseIds = null;
                if (searchRequest.KeywordValues != null && searchRequest.KeywordValues.Any())
                {
                    IEnumerable<Guid>? intersected = null;
                    foreach (var kv in searchRequest.KeywordValues)
                    {
                        var ids = await _context.CaseKeyword
                            .Where(x => !x.Deleted && x.KeywordId == kv.KeywordId && x.Value.Contains(kv.Value))
                            .Select(x => x.CaseId)
                            .ToListAsync();
                        intersected = intersected == null ? (IEnumerable<Guid>)ids : intersected.Intersect(ids);
                    }
                    filterCaseIds = intersected?.ToList() ?? new List<Guid>();
                }

                var baseQuery = (from caseKeyword in _context.CaseKeyword.Include(x => x.Keyword).Include(x => x.Keyword.Type).Include(x => x.Keyword.KeywordRoles)
                                 join tempCase in _context.Case on caseKeyword.CaseId equals tempCase.Id
                                 join keyword in _context.Keyword on caseKeyword.KeywordId equals keyword.Id
                                 join template in _context.Template on keyword.TemplateId equals template.Id
                                 join companyTemplate in _context.CompanyTemplate on template.Id equals companyTemplate.TemplateId
                                 where !caseKeyword.Deleted
                                    && !tempCase.Deleted
                                    && !keyword.Deleted
                                    && keyword.TemplateId == searchRequest.TemplateId
                                    && companyTemplate.CompanyId == searchRequest.CompanyId
                                    && caseKeyword.Keyword.IsShowOnTemplate
                                    && (!caseKeyword.Keyword.DocumentSearchable || (caseKeyword.Keyword.DocumentSearchable && caseKeyword.Keyword.IsShowOnTemplate))
                                    && caseKeyword.Case.Status == "Open"
                                    && !keyword.IsHidden
                                    && (searchRequest.IsAdmin || !keyword.IsHiddenForUser)
                                 select new { tempCase, caseKeyword });

                if (filterCaseIds != null)
                {
                    baseQuery = baseQuery.Where(x => filterCaseIds.Contains(x.caseKeyword.CaseId));
                }

                var queryable = baseQuery
                    .OrderByDescending(x => x.tempCase.CreatedDate)
                    .AsEnumerable()
                    .GroupBy(x => new { x.tempCase.Id, x.tempCase.Name, x.tempCase.Status });

                if (searchRequest.KeywordDateValues != null && searchRequest.KeywordDateValues.Any())
                {
                    queryable = queryable.Where(z => searchRequest.KeywordDateValues.All(x => z.Any(c => c.caseKeyword.KeywordId.Equals(x.KeywordId)
                        && !string.IsNullOrEmpty(c.caseKeyword.Value)
                        && (!string.IsNullOrEmpty(x.FromValue) && DateTime.Parse(c.caseKeyword.Value).Date >= DateTime.Parse(x.FromValue).Date)
                        && (!string.IsNullOrEmpty(x.ToValue) && DateTime.Parse(c.caseKeyword.Value).Date <= DateTime.Parse(x.ToValue).Date))));
                }

                var query = queryable
                        .Select(z => new CaseKeywordViewModel
                        {
                            CaseId = z.Key.Id,
                            CaseName = z.Key.Name,
                            Status = z.Key.Status,
                            CaseKeywordValues = z.Select(x => new CaseKeywordBaseValue
                            {
                                KeywordId = x.caseKeyword.Keyword.Id,
                                KeywordName = x.caseKeyword.Keyword.Name,
                                Value = x.caseKeyword.Value,
                                IsRequired = x.caseKeyword.Keyword.IsRequired,
                                MaxLength = x.caseKeyword.Keyword.MaxLength,
                                Searchable = x.caseKeyword.Keyword.CaseSearchable,
                                DocumentSearchable = x.caseKeyword.Keyword.DocumentSearchable,
                                IsShowOnCaseList = x.caseKeyword.Keyword.IsShowOnCaseList,
                                IsShowOnTemplate = x.caseKeyword.Keyword.IsShowOnTemplate,
                                Order = x.caseKeyword.Keyword.Order,
                                TypeId = x.caseKeyword.Keyword.Type.Id,
                                TypeName = x.caseKeyword.Keyword.Type.Name,
                                TypeValue = x.caseKeyword.Keyword.Type.Value,
                                Metadata = !string.IsNullOrEmpty(x.caseKeyword.Keyword.Type.Metadata)
                                  ? x.caseKeyword.Keyword.Type.Metadata.Split(',', StringSplitOptions.None).ToList()
                                  : new List<string>()
                            }).OrderBy(x => x.Order).AsEnumerable()
                        });

                var result = PagedResult<CaseKeywordViewModel>.CreateAsync(query, searchRequest.PageNumber.Value, searchRequest.PageSize.Value);

                return await Task.FromResult(result);
            }
            catch (Exception ex)
            {
                return null;
            }
        }

        public async Task<PagedResult<CaseKeywordBaseValue>?> GetDocumentsAsync(DocumentSearchRequest searchRequest)
        {
            try
            {
                var queryable = (from caseKeyword in _context.CaseKeyword.Include(x => x.Keyword).Include(x => x.Keyword.Type)
                                 join tempCase in _context.Case on caseKeyword.CaseId equals tempCase.Id
                                 join keyword in _context.Keyword on caseKeyword.KeywordId equals keyword.Id
                                 join template in _context.Template on keyword.TemplateId equals template.Id
                                 join companyTemplate in _context.CompanyTemplate on template.Id equals companyTemplate.TemplateId
                                 where !caseKeyword.Deleted
                                    && !tempCase.Deleted
                                    && !keyword.Deleted
                                    && companyTemplate.CompanyId == searchRequest.CompanyId
                                    && caseKeyword.Keyword.TemplateId == searchRequest.TemplateId
                                    && caseKeyword.Case.Status == "Open"
                                 select new { tempCase, caseKeyword })
                            .AsEnumerable()
                            .GroupBy(x => new { x.tempCase.Id });

                if (searchRequest.KeywordValues != null && searchRequest.KeywordValues.Any())
                {
                    queryable = queryable.Where(z => searchRequest.KeywordValues.All(x => z.Any(c => c.caseKeyword.KeywordId.Equals(x.KeywordId)
                        && c.caseKeyword.Value.Contains(x.Value))));
                }

                if (searchRequest.KeywordDateValues != null && searchRequest.KeywordDateValues.Any())
                {
                    queryable = queryable.Where(z => searchRequest.KeywordDateValues.All(x => z.Any(c => c.caseKeyword.KeywordId.Equals(x.KeywordId)
                        && !string.IsNullOrEmpty(c.caseKeyword.Value)
                        && (!string.IsNullOrEmpty(x.FromValue) && DateTime.Parse(c.caseKeyword.Value).Date >= DateTime.Parse(x.FromValue).Date)
                        && (!string.IsNullOrEmpty(x.ToValue) && DateTime.Parse(c.caseKeyword.Value).Date <= DateTime.Parse(x.ToValue).Date))));
                }

                if (searchRequest.KeywordDecimalValues != null && searchRequest.KeywordDecimalValues.Any())
                {
                    queryable = queryable.Where(z => searchRequest.KeywordDecimalValues.All(x => z.Any(c => c.caseKeyword.KeywordId.Equals(x.KeywordId)
                        && !string.IsNullOrEmpty(c.caseKeyword.Value)
                        && (!string.IsNullOrEmpty(x.FromValue) && decimal.Parse(c.caseKeyword.Value) >= decimal.Parse(x.FromValue))
                        && (!string.IsNullOrEmpty(x.ToValue) && decimal.Parse(c.caseKeyword.Value) <= decimal.Parse(x.ToValue)))));
                }

                if (searchRequest.FileTypeId != null && searchRequest.FileTypeId != Guid.Empty)
                {
                    queryable = queryable.Where(z => z.Any(x => x.caseKeyword.Keyword.Type.Id == searchRequest.FileTypeId));
                }

                var caseResult = queryable.SelectMany(z => z.Where(x => !x.caseKeyword.Keyword.IsShowOnTemplate && x.caseKeyword.Keyword.DocumentSearchable));

                if (searchRequest.FileTypeId != null && searchRequest.FileTypeId != Guid.Empty)
                {
                    caseResult = caseResult.Where(x => x.caseKeyword.Keyword.Type.Id == searchRequest.FileTypeId);
                }

                var query = caseResult
                        .Select(x => new CaseKeywordBaseValue
                        {
                            CaseId = x.tempCase.Id,
                            EntityDisplayName = x.tempCase.Name,
                            KeywordId = x.caseKeyword.Keyword.Id,
                            KeywordName = x.caseKeyword.Keyword.Name,
                            Value = x.caseKeyword.Value,
                            IsRequired = x.caseKeyword.Keyword.IsRequired,
                            MaxLength = x.caseKeyword.Keyword.MaxLength,
                            Searchable = x.caseKeyword.Keyword.CaseSearchable,
                            DocumentSearchable = x.caseKeyword.Keyword.DocumentSearchable,
                            IsShowOnCaseList = x.caseKeyword.Keyword.IsShowOnCaseList,
                            IsShowOnTemplate = x.caseKeyword.Keyword.IsShowOnTemplate,
                            Order = x.caseKeyword.Keyword.Order,
                            TypeId = x.caseKeyword.Keyword.Type.Id,
                            TypeName = x.caseKeyword.Keyword.Type.Name,
                            TypeValue = x.caseKeyword.Keyword.Type.Value,
                            Metadata = !string.IsNullOrEmpty(x.caseKeyword.Keyword.Type.Metadata)
                                      ? x.caseKeyword.Keyword.Type.Metadata.Split(',', StringSplitOptions.None).ToList()
                                      : new List<string>()
                        }).OrderBy(x => x.Order).AsEnumerable();

                var result = PagedResult<CaseKeywordBaseValue>.CreateAsync(query, searchRequest.PageNumber.Value, searchRequest.PageSize.Value);

                return await Task.FromResult(result);
            }
            catch (Exception ex)
            {
                return null;
            }
        }

        public async Task<int> UpdateAsync(CaseKeyword caseKey)
        {
            try
            {
                if (caseKey != null)
                {
                    _context.CaseKeyword.Update(caseKey);
                    await _context.SaveChangesAsync();
                    return 1;
                }

                return 0;
            }
            catch (Exception ex)
            {
                return 0;
            }
        }

        public async Task<int> DeleteAsync(Guid id)
        {
            try
            {
                CaseKeyword? model = await _context.CaseKeyword.FindAsync(id);
                if (model != null)
                {
                    model.Deleted = true;
                    await _context.SaveChangesAsync();
                    return 1;
                }

                return 0;
            }
            catch (Exception ex)
            {
                return 0;
            }
        }

        public async Task<int> DeleteByCaseIdAsync(Guid caseId)
        {
            try
            {
                var data = _context.CaseKeyword.Where(a => !a.Deleted && a.CaseId == caseId).ToList();
                foreach (var item in data)
                {
                    item.Deleted = true;
                    _context.CaseKeyword.Update(item);
                }
                await _context.SaveChangesAsync();

                return 1;
            }
            catch (Exception ex)
            {
                return 0;
            }
        }

        public async Task<int> UpdateMultiAsync(Guid caseId, List<CaseKeyword> caseKeys)
        {
            try
            {
                var queryableCase = from tempCase in _context.Case
                                    join caseKeyword in _context.CaseKeyword on tempCase.Id equals caseKeyword.CaseId
                                    join keyword in _context.Keyword on caseKeyword.KeywordId equals keyword.Id
                                    where tempCase.Id == caseId
                                        && keyword.IsShowOnTemplate
                                    select caseKeyword;

                var data = await queryableCase.Where(a => !a.Deleted).ToListAsync();

                _context.CaseKeyword.RemoveRange(data);
                await _context.SaveChangesAsync();

                if (caseKeys != null && caseKeys.Any())
                {
                    await _context.CaseKeyword.AddRangeAsync(caseKeys);
                    var result = _context.SaveChanges();
                    return 1;
                }

                return 0;
            }
            catch (Exception ex)
            {
                return 0;
            }
        }

        public async Task<CaseKeyword?> GetByCaseIdAndKeywordIdAsync(Guid caseId, Guid keywordId)
        {
            try
            {
                CaseKeyword? model = await _context.CaseKeyword.FirstOrDefaultAsync(x => x.CaseId == caseId && x.KeywordId == keywordId);
                return model;
            }
            catch (Exception ex)
            {
                return null;
            }
        }

        public async Task<IEnumerable<FileResponse>> GetFileKeywordsByCaseIdAsync(Guid caseId)
        {
            try
            {
                var IQueryable = from caseKeyword in _context.CaseKeyword.Include(x => x.Keyword).Include(x => x.Keyword.Type)
                                 join keyword in _context.Keyword on caseKeyword.KeywordId equals keyword.Id
                                 join type in _context.Type on keyword.TypeId equals type.Id
                                 where !caseKeyword.Deleted
                                   && !keyword.Deleted
                                   && !type.Deleted
                                   && caseKeyword.CaseId == caseId
                                   && !caseKeyword.Keyword.IsShowOnTemplate
                                 select new FileResponse
                                 {
                                     KeywordId = caseKeyword.KeywordId,
                                     FileName = caseKeyword.Keyword.Name,
                                     FilePath = caseKeyword.Value
                                 };
                var result = await IQueryable.OrderBy(x => x.FileName).ToListAsync();
                return result;
            }
            catch (Exception ex)
            {
                return new List<FileResponse>();
            }
        }

        public async Task<CaseKeyword?> GetByCustomerIdAsync(Guid customerId)
        {
            try
            {
                var queryableCase = from caseKeyword in _context.CaseKeyword
                                    join tempCase in _context.Case on caseKeyword.CaseId equals tempCase.Id
                                    join keyword in _context.Keyword on caseKeyword.KeywordId equals keyword.Id
                                    where caseKeyword.Case.Status == "Open" 
                                        && caseKeyword.Value == customerId.ToString()
                                        && caseKeyword.Keyword.IsShowOnTemplate
                                        && caseKeyword.Keyword.Name == "取引先名"
                                    select caseKeyword;

                var data = await queryableCase.Where(a => !a.Deleted).FirstOrDefaultAsync();
                return data;
            }
            catch (Exception ex)
            {
                return null;
            }
        }
    }
}
