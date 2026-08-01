using CaseMngmt.Models.CaseKeywords;
using CaseMngmt.Models.EntityKeywords;
using CaseMngmt.Models.FileUploads;
using CaseMngmt.Models.GenericValidation;
using CaseMngmt.Models.Keywords;
using CaseMngmt.Repository.EntityKeywords;
using CaseMngmt.Repository.Keywords;

namespace CaseMngmt.Service.EntityKeywords
{
    public class EntityKeywordService : IEntityKeywordService
    {
        private readonly IEntityKeywordRepository _repository;
        private readonly IKeywordRepository _keywordRepository;

        public EntityKeywordService(IEntityKeywordRepository repository, IKeywordRepository keywordRepository)
        {
            _repository = repository;
            _keywordRepository = keywordRepository;
        }

        public async Task<List<EntityKeywordValue>> GetByEntityAsync(string entityType, Guid entityId)
        {
            try
            {
                return await _repository.GetByEntityAsync(entityType, entityId);
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
                return await _repository.ReplaceValuesAsync(entityType, entityId, values ?? new List<EntityKeywordValueRequest>(), currentUserId);
            }
            catch (Exception)
            {
                return 0;
            }
        }

        public async Task<Guid?> AddFileToEntityKeywordAsync(string entityType, Guid entityId, Guid fileTypeId, FileUploadResponse fileResponse, Guid templateId, Guid currentUserId)
        {
            try
            {
                var keyword = new Keyword()
                {
                    Name = fileResponse.FileName,
                    TypeId = fileTypeId,
                    TemplateId = templateId,
                    IsRequired = false,
                    Order = 0,
                    CaseSearchable = false,
                    DocumentSearchable = true,
                    IsShowOnCaseList = false,
                    // false so this throwaway per-file Keyword never shows up as a normal custom field on the
                    // entity's form, and — just as importantly — so EntityKeywordRepository.ReplaceValuesAsync's
                    // IsShowOnTemplate guard never deletes it when the user saves an unrelated custom field.
                    IsShowOnTemplate = false,
                    CreatedBy = currentUserId,
                    UpdatedBy = currentUserId
                };
                await _keywordRepository.AddAsync(keyword);

                var entityKeyword = new Models.EntityKeywords.EntityKeyword
                {
                    EntityType = entityType,
                    EntityId = entityId,
                    KeywordId = keyword.Id,
                    Value = fileResponse.FilePath,
                    CreatedBy = currentUserId,
                    UpdatedBy = currentUserId
                };

                var addResult = await _repository.AddAsync(entityKeyword);
                return addResult > 0 ? keyword.Id : null;
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
                var result = await _repository.GetFileKeywordsByEntityAsync(entityType, entityId);
                foreach (var item in result)
                {
                    string ext = Path.GetExtension(item.FileName).ToLower();
                    item.IsImage = DataTypeDictionary.ImageTypes.Contains(ext);
                }
                return result;
            }
            catch (Exception)
            {
                return new List<FileResponse>();
            }
        }

        public async Task<int> DeleteFileEntityKeywordAsync(string entityType, Guid entityId, Guid keywordId)
        {
            try
            {
                var entityKeyword = await _repository.GetByEntityAndKeywordIdAsync(entityType, entityId, keywordId);
                if (entityKeyword != null)
                {
                    await _repository.DeleteAsync(entityKeyword.Id);
                    await _keywordRepository.DeleteAsync(keywordId);
                }

                return 1;
            }
            catch (Exception)
            {
                return 0;
            }
        }

        public async Task<List<CaseKeywordBaseValue>> GetDocumentFilesAsync(Guid companyId, List<string> entityTypes, Guid? fileTypeId)
        {
            try
            {
                var result = await _repository.GetDocumentFilesAsync(companyId, entityTypes, fileTypeId);
                foreach (var item in result)
                {
                    string ext = Path.GetExtension(item.KeywordName).ToLower();
                    item.IsImage = DataTypeDictionary.ImageTypes.Contains(ext);
                }
                return result;
            }
            catch (Exception)
            {
                return new List<CaseKeywordBaseValue>();
            }
        }
    }
}
