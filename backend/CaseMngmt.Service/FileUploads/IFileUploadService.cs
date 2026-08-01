using CaseMngmt.Models;
using CaseMngmt.Models.CaseKeywords;
using CaseMngmt.Models.EntityKeywords;
using CaseMngmt.Models.FileUploads;

namespace CaseMngmt.Service.FileUploads
{
    public interface IFileUploadService
    {
        Task<FileUploadResponse?> UploadFileAsync(CaseKeywordFileUpload fileUpload, FileUploadSetting fileSetting, AWSSetting? awsSetting);
        Task<int> DeleteFileAsync(string filename, Guid caseId, FileUploadSetting fileSetting, AWSSetting? awsSetting);
        Task<List<string?>> GetAllFileByCaseIdAsync(Guid caseId, FileUploadSetting fileSetting, AWSSetting? awsSetting);
        Task<string?> GetUploadedFolderPath(Guid caseId, FileUploadSetting fileSetting, AWSSetting? awsSetting);
        Task<string?> GetFilePath(string filename, Guid caseId, FileUploadSetting fileSetting, AWSSetting? awsSetting);
        Task<byte[]?> DownloadFileS3Async(string fileName, AWSSetting awsSetting);

        // Entity-agnostic twin of the Case-based methods above (PurchaseOrder/GoodsReceipt attachments etc.)
        // Path convention: {uploadFolder}/{entityType}/{entityId}/{fileName} instead of {uploadFolder}/{caseId}/{fileName}.
        Task<FileUploadResponse?> UploadEntityFileAsync(EntityFileUpload fileUpload, FileUploadSetting fileSetting, AWSSetting? awsSetting);
        Task<int> DeleteEntityFileAsync(string filename, string entityType, Guid entityId, FileUploadSetting fileSetting, AWSSetting? awsSetting);
        Task<string?> GetEntityUploadedFolderPath(string entityType, Guid entityId, FileUploadSetting fileSetting, AWSSetting? awsSetting);
        Task<string?> GetEntityFilePath(string filename, string entityType, Guid entityId, FileUploadSetting fileSetting, AWSSetting? awsSetting);
    }
}
