using CaseMngmt.Models;
using CaseMngmt.Models.EntityKeywords;
using CaseMngmt.Models.FileUploads;
using CaseMngmt.Models.Invoices;
using CaseMngmt.Models.Orders;
using CaseMngmt.Repository.Companies;
using CaseMngmt.Repository.Customers;
using CaseMngmt.Repository.Invoices;
using CaseMngmt.Repository.Orders;
using CaseMngmt.Repository.Products;
using CaseMngmt.Repository.Types;
using CaseMngmt.Service.EntityKeywords;
using CaseMngmt.Service.FileUploads;
using CaseMngmt.Service.Templates;
using Microsoft.Extensions.Configuration;

namespace CaseMngmt.Service.Invoices
{
    public class InvoiceService : IInvoiceService
    {
        private readonly IInvoiceRepository _repository;
        private readonly IOrderRepository _orderRepository;
        private readonly ICompanyRepository _companyRepository;
        private readonly ICustomerRepository _customerRepository;
        private readonly IProductRepository _productRepository;
        private readonly IInvoicePdfService _pdfService;
        private readonly IEntityKeywordService _entityKeywordService;
        private readonly ITemplateService _templateService;
        private readonly ITypeRepository _typeRepository;
        private readonly IFileUploadService _fileUploadService;
        private readonly IConfiguration _configuration;

        private static readonly string[] InvoiceableStatuses = { "Confirmed" };

        public InvoiceService(
            IInvoiceRepository repository,
            IOrderRepository orderRepository,
            ICompanyRepository companyRepository,
            ICustomerRepository customerRepository,
            IProductRepository productRepository,
            IInvoicePdfService pdfService,
            IEntityKeywordService entityKeywordService,
            ITemplateService templateService,
            ITypeRepository typeRepository,
            IFileUploadService fileUploadService,
            IConfiguration configuration)
        {
            _repository = repository;
            _orderRepository = orderRepository;
            _companyRepository = companyRepository;
            _customerRepository = customerRepository;
            _productRepository = productRepository;
            _pdfService = pdfService;
            _entityKeywordService = entityKeywordService;
            _templateService = templateService;
            _typeRepository = typeRepository;
            _fileUploadService = fileUploadService;
            _configuration = configuration;
        }

        public async Task<InvoiceCreateResult> CreateFromOrderAsync(Guid orderId, Guid companyId, Guid currentUserId)
        {
            var order = await _orderRepository.GetByIdAsync(orderId, companyId);
            if (order == null)
            {
                return new InvoiceCreateResult { StatusCode = 0, Message = "Order not found." };
            }

            var existingInvoice = await _repository.GetByOrderIdAsync(orderId, companyId);
            if (existingInvoice != null)
            {
                return new InvoiceCreateResult { StatusCode = -1, Message = "この受注にはすでに請求書が発行されています。" };
            }

            if (!InvoiceableStatuses.Contains(order.Status))
            {
                return new InvoiceCreateResult
                {
                    StatusCode = -1,
                    Message = order.Status == "RiskFlagged"
                        ? "在庫/生産能力の不足が確認された受注です。請求書を発行する前にリスクを解消するか、受注ステータスを確認してください。"
                        : $"ステータスが「{order.Status}」の受注は請求書を発行できません。"
                };
            }

            var invoiceCount = await _repository.GetInvoiceCountAsync(companyId, DateTime.UtcNow.Year);
            var invoiceNumber = $"INV-{DateTime.UtcNow.Year}-{(invoiceCount + 1):D5}";

            var invoice = new Invoice
            {
                Name = invoiceNumber,
                OrderId = order.Id,
                CompanyId = companyId,
                CustomerId = order.CustomerId,
                InvoiceNumber = invoiceNumber,
                IssueDate = DateTime.UtcNow.Date,
                DueDate = DateTime.UtcNow.Date.AddDays(30),
                SubTotalAmount = order.SubTotalAmount,
                TaxAmount = order.TaxAmount,
                TotalAmount = order.TotalAmount,
                Status = "Issued",
                CreatedBy = currentUserId,
                UpdatedBy = currentUserId
            };

            var result = await _repository.AddAsync(invoice);
            if (result <= 0)
            {
                return new InvoiceCreateResult { StatusCode = 0, Message = "請求書の作成に失敗しました。" };
            }

            await _orderRepository.UpdateStatusAsync(order.Id, companyId, "Invoiced", currentUserId);

            // Physical stock is only decremented once the order is actually invoiced (goods considered
            // shipped at that point) — not at order confirmation, so it can still reflect real warehouse
            // counts via manual edits/Excel import in the meantime.
            var orderedProductIds = order.OrderItems
                .Where(i => i.ProductId.HasValue)
                .Select(i => i.ProductId!.Value)
                .Distinct()
                .ToList();

            if (orderedProductIds.Count > 0)
            {
                var products = await _productRepository.GetByIdsAsync(orderedProductIds);
                foreach (var item in order.OrderItems.Where(i => i.ProductId.HasValue))
                {
                    var product = products.FirstOrDefault(p => p.Id == item.ProductId!.Value);
                    if (product != null)
                    {
                        product.StockQuantity -= item.Quantity;
                        await _productRepository.UpdateAsync(product);
                    }
                }
            }

            await AttachGeneratedPdfAsync(invoice, order, companyId, currentUserId);

            return new InvoiceCreateResult { StatusCode = result, InvoiceId = invoice.Id };
        }

        // Persists the invoice PDF once at creation time (instead of only ever regenerating it
        // on download) by attaching it through the same EntityKeyword mechanism already used for
        // PurchaseOrder/GoodsReceipt/PurchaseInvoice documents, so it also surfaces automatically
        // in the unified 書類管理 search. Best-effort: a failure here must not fail invoice
        // creation, mirroring how AI照合 failures don't fail order creation in OrderController.
        private async Task AttachGeneratedPdfAsync(Invoice invoice, Order order, Guid companyId, Guid currentUserId)
        {
            try
            {
                var company = await _companyRepository.GetByIdAsync(companyId);
                var customer = await _customerRepository.GetByIdAsync(order.CustomerId);
                if (company == null || customer == null)
                {
                    return;
                }

                var pdfBytes = _pdfService.GeneratePdf(invoice, order, company, customer);
                var fileType = await _typeRepository.GetByTypeNameAsync("請求書");
                if (fileType == null)
                {
                    return;
                }

                var template = await _templateService.EnsureModuleTemplateAsync(companyId, "Invoice");
                if (template == null)
                {
                    return;
                }

                var fileName = $"{invoice.InvoiceNumber}.pdf";
                var fileUpload = new EntityFileUpload
                {
                    EntityType = "Invoice",
                    EntityId = invoice.Id,
                    FileTypeId = fileType.Id,
                    FileName = fileName,
                    FileToUpload = new InMemoryFormFile(pdfBytes, fileName, "application/pdf")
                };

                var (fileSetting, awsSetting) = BuildFileSettings();

                var uploadResult = await _fileUploadService.UploadEntityFileAsync(fileUpload, fileSetting, awsSetting);
                if (uploadResult == null)
                {
                    return;
                }

                await _entityKeywordService.AddFileToEntityKeywordAsync(
                    "Invoice", invoice.Id, fileType.Id, uploadResult, template.Id, currentUserId);

                await _repository.UpdatePdfPathAsync(invoice.Id, companyId, uploadResult.FilePath);
            }
            catch (Exception)
            {
                // Non-fatal: the invoice itself was already registered successfully.
            }
        }

        private (FileUploadSetting, AWSSetting?) BuildFileSettings()
        {
            var fileSetting = new FileUploadSetting
            {
                AcceptTypes = _configuration["FileUploadSettings:acceptTypes"],
                InvalidFileExtensions = _configuration["FileUploadSettings:invalidFileExtensions"],
                UploadFolder = _configuration["FileUploadSettings:uploadFolder"],
                ValidFileTypes = _configuration["FileUploadSettings:validFileTypes"],
            };
            AWSSetting? awsSetting = null;
            if (!string.IsNullOrEmpty(_configuration["AWS:S3Bucket"]))
            {
                awsSetting = new AWSSetting
                {
                    S3Bucket = _configuration["AWS:S3Bucket"],
                    ACCESS_KEY = _configuration["AWS:ACCESS_KEY"],
                    SECRET_KEY = _configuration["AWS:SECRET_KEY"],
                    UploadFolder = _configuration["AWS:UploadFolder"]
                };
            }
            return (fileSetting, awsSetting);
        }

        public async Task<PagedResult<InvoiceViewModel>?> GetAllInvoicesAsync(Guid companyId, Guid? customerId, string? status, string? orderNumber, DateTime? issueDateFrom, DateTime? issueDateTo, int pageSize, int pageNumber)
        {
            var invoicesFromRepository = await _repository.GetAllAsync(companyId, customerId, status, orderNumber, issueDateFrom, issueDateTo, pageSize, pageNumber);
            if (invoicesFromRepository == null)
            {
                return null;
            }

            return new PagedResult<InvoiceViewModel>(
                invoicesFromRepository.Items.Select(MapToViewModel),
                invoicesFromRepository.TotalCount,
                invoicesFromRepository.CurrentPage,
                invoicesFromRepository.PageSize);
        }

        public async Task<InvoiceViewModel?> GetByIdAsync(Guid id, Guid companyId)
        {
            var entity = await _repository.GetByIdAsync(id, companyId);
            return entity == null ? null : MapToViewModel(entity);
        }

        public async Task<InvoiceViewModel?> GetByOrderIdAsync(Guid orderId, Guid companyId)
        {
            var entity = await _repository.GetByOrderIdAsync(orderId, companyId);
            return entity == null ? null : MapToViewModel(entity);
        }

        public async Task<int> UpdateStatusAsync(Guid id, Guid companyId, string status, Guid currentUserId)
        {
            return await _repository.UpdateStatusAsync(id, companyId, status, currentUserId);
        }

        public async Task<byte[]?> GeneratePdfAsync(Guid id, Guid companyId)
        {
            var invoice = await _repository.GetByIdAsync(id, companyId);
            if (invoice?.Order == null || invoice.Customer == null)
            {
                return null;
            }

            var company = await _companyRepository.GetByIdAsync(companyId);
            if (company == null)
            {
                return null;
            }

            return _pdfService.GeneratePdf(invoice, invoice.Order, company, invoice.Customer);
        }

        public async Task<string?> GetInvoiceFileNameAsync(Guid id, Guid companyId)
        {
            var invoice = await _repository.GetByIdAsync(id, companyId);
            return invoice == null ? null : $"{invoice.InvoiceNumber}.pdf";
        }

        // Prefers the PDF persisted at invoice-creation time (see AttachGeneratedPdfAsync) so
        // 書類管理/downloads all read the same file; falls back to regenerating on the fly for
        // invoices created before this attachment existed, or if the persisted file went missing.
        public async Task<byte[]?> GetOrGeneratePdfAsync(Guid id, Guid companyId)
        {
            try
            {
                var attachedFiles = await _entityKeywordService.GetFileKeywordsByEntityAsync("Invoice", id);
                var pdfFile = attachedFiles.FirstOrDefault(f => f.FileName.EndsWith(".pdf", StringComparison.OrdinalIgnoreCase));
                if (pdfFile != null)
                {
                    var (fileSetting, awsSetting) = BuildFileSettings();
                    var filePath = await _fileUploadService.GetEntityFilePath(pdfFile.FileName, "Invoice", id, fileSetting, awsSetting);
                    if (filePath != null)
                    {
                        return awsSetting == null
                            ? await File.ReadAllBytesAsync(filePath)
                            : await _fileUploadService.DownloadFileS3Async(filePath, awsSetting);
                    }
                }
            }
            catch (Exception)
            {
                // Fall through to on-the-fly regeneration below.
            }

            return await GeneratePdfAsync(id, companyId);
        }

        private static InvoiceViewModel MapToViewModel(Invoice invoice)
        {
            return new InvoiceViewModel
            {
                Id = invoice.Id,
                OrderId = invoice.OrderId,
                OrderNumber = invoice.Order?.OrderNumber,
                CompanyId = invoice.CompanyId,
                CustomerId = invoice.CustomerId,
                CustomerName = invoice.Customer?.Name,
                InvoiceNumber = invoice.InvoiceNumber,
                IssueDate = invoice.IssueDate,
                DueDate = invoice.DueDate,
                SubTotalAmount = invoice.SubTotalAmount,
                TaxAmount = invoice.TaxAmount,
                TotalAmount = invoice.TotalAmount,
                Status = invoice.Status,
                PdfPath = invoice.PdfPath,
                CreatedDate = invoice.CreatedDate
            };
        }
    }
}
