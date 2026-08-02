using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.Net.Http.Headers;
using Microsoft.OpenApi.Models;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using AutoMapper;
using CaseMngmt.Server;
using CaseMngmt.Models.Database;
using CaseMngmt.Models.AutoMapper;
using CaseMngmt.Models.ApplicationUsers;
using CaseMngmt.Models.ApplicationRoles;
using CaseMngmt.Service.Customers;
using CaseMngmt.Service.Companies;
using CaseMngmt.Service.Types;
using CaseMngmt.Service.Keywords;
using CaseMngmt.Service.Templates;
using CaseMngmt.Service.Cases;
using CaseMngmt.Service.CaseKeywords;
using CaseMngmt.Service.CompanyTemplates;
using CaseMngmt.Service.FileUploads;
using CaseMngmt.Repository.Companies;
using CaseMngmt.Repository.Customers;
using CaseMngmt.Repository.Types;
using CaseMngmt.Repository.Keywords;
using CaseMngmt.Repository.Templates;
using CaseMngmt.Repository.Cases;
using CaseMngmt.Repository.CaseKeywords;
using CaseMngmt.Repository.CompanyTemplates;
using CaseMngmt.Repository.KeywordRoles;
using CaseMngmt.Service.KeywordRoles;
using CaseMngmt.Repository.Orders;
using CaseMngmt.Service.Orders;
using CaseMngmt.Repository.Products;
using CaseMngmt.Service.Products;
using CaseMngmt.Repository.Invoices;
using CaseMngmt.Service.Invoices;
using CaseMngmt.Service.Dashboard;
using CaseMngmt.Service.Ai;
using CaseMngmt.Service.AiMatching;
using CaseMngmt.Repository.AiMatching;
using CaseMngmt.Service.Chat;
using CaseMngmt.Repository.EntityKeywords;
using CaseMngmt.Service.EntityKeywords;
using CaseMngmt.Repository.Suppliers;
using CaseMngmt.Service.Suppliers;
using CaseMngmt.Repository.PurchaseOrders;
using CaseMngmt.Service.PurchaseOrders;
using CaseMngmt.Repository.GoodsReceipts;
using CaseMngmt.Service.GoodsReceipts;
using CaseMngmt.Service.ReorderSuggestions;
using CaseMngmt.Repository.PurchaseInvoices;
using CaseMngmt.Service.PurchaseInvoices;

QuestPDF.Settings.License = QuestPDF.Infrastructure.LicenseType.Community;

var builder = WebApplication.CreateBuilder(args);

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(connectionString,
                options => options.EnableRetryOnFailure(
                    maxRetryCount: 5,
                    maxRetryDelay: System.TimeSpan.FromSeconds(30),
                    errorNumbersToAdd: null)
                ));

builder.Services.AddHttpClient<AnthropicClient>(client =>
{
    client.BaseAddress = new Uri("https://api.anthropic.com/");
    client.DefaultRequestHeaders.Add("anthropic-version", "2023-06-01");
    var anthropicApiKey = builder.Configuration["Anthropic:ApiKey"];
    if (!string.IsNullOrEmpty(anthropicApiKey))
    {
        client.DefaultRequestHeaders.Add("x-api-key", anthropicApiKey);
    }
});

builder.Services.AddDatabaseDeveloperPageExceptionFilter();
builder.Services
    .AddIdentity<ApplicationUser, ApplicationRole>()
    .AddEntityFrameworkStores<ApplicationDbContext>()
    .AddDefaultTokenProviders()
    .AddErrorDescriber<JapaneseIdentityErrorDescriber>();

//if (builder.Environment.IsDevelopment())
//{
//    builder.Services.AddCors(options =>
//    {
//        options.AddPolicy("LocalhostPolicy", builder =>
//        {
//            builder.SetIsOriginAllowed(origin => new Uri(origin).Host == "localhost");
//            builder.AllowAnyHeader();
//            builder.AllowAnyMethod();
//            builder.AllowCredentials();
//        });
//    });
//}

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAnyHost", builder =>
    {
        builder.SetIsOriginAllowed(origin => new Uri(origin).Host == "localhost");
        builder.AllowAnyHeader();
        builder.AllowAnyMethod();
        builder.AllowCredentials();
    });
});

#region Register Service & Repository

builder.Services.AddTransient<ICustomerService, CustomerService>();
builder.Services.AddTransient<ICustomerRepository, CustomerRepository>();

builder.Services.AddTransient<ICompanyService, CompanyService>();
builder.Services.AddTransient<ICompanyRepository, CompanyRepository>();

builder.Services.AddTransient<ITypeService, TypeService>();
builder.Services.AddTransient<ITypeRepository, TypeRepository>();

builder.Services.AddTransient<IKeywordService, KeywordService>();
builder.Services.AddTransient<IKeywordRepository, KeywordRepository>();

builder.Services.AddTransient<ITemplateService, TemplateService>();
builder.Services.AddTransient<ITemplateRepository, TemplateRepository>();

builder.Services.AddTransient<ICaseService, CaseService>();
builder.Services.AddTransient<ICaseRepository, CaseRepository>();

builder.Services.AddTransient<ICaseKeywordService, CaseKeywordService>();
builder.Services.AddTransient<ICaseKeywordRepository, CaseKeywordRepository>();

builder.Services.AddTransient<ITypeService, TypeService>();
builder.Services.AddTransient<ITypeRepository, TypeRepository>();

builder.Services.AddTransient<ICompanyTemplateService, CompanyTemplateService>();
builder.Services.AddTransient<ICompanyTemplateRepository, CompanyTemplateRepository>();

builder.Services.AddTransient<IKeywordRoleService, KeywordRoleService>();
builder.Services.AddTransient<IKeywordRoleRepository, KeywordRoleRepository>();

builder.Services.AddTransient<IFileUploadService, FileUploadService>();

builder.Services.AddTransient<IOrderService, OrderService>();
builder.Services.AddTransient<IOrderRepository, OrderRepository>();

builder.Services.AddTransient<IProductService, ProductService>();
builder.Services.AddTransient<IProductRepository, ProductRepository>();

builder.Services.AddTransient<IInvoiceService, InvoiceService>();
builder.Services.AddTransient<IInvoiceRepository, InvoiceRepository>();
builder.Services.AddTransient<IInvoicePdfService, InvoicePdfService>();

builder.Services.AddTransient<IDashboardService, DashboardService>();

builder.Services.AddTransient<IOrderRiskRepository, OrderRiskRepository>();
builder.Services.AddTransient<IAiMatchingService, AiMatchingService>();
builder.Services.AddTransient<IAiOrderExtractionService, AiOrderExtractionService>();
builder.Services.AddTransient<IDashboardCommentService, DashboardCommentService>();
builder.Services.AddTransient<IChatAssistantService, ChatAssistantService>();

builder.Services.AddTransient<IEntityKeywordService, EntityKeywordService>();
builder.Services.AddTransient<IEntityKeywordRepository, EntityKeywordRepository>();

builder.Services.AddTransient<ISupplierService, SupplierService>();
builder.Services.AddTransient<ISupplierRepository, SupplierRepository>();

builder.Services.AddTransient<IPurchaseOrderService, PurchaseOrderService>();
builder.Services.AddTransient<IPurchaseOrderRepository, PurchaseOrderRepository>();
builder.Services.AddTransient<IPurchaseOrderIssuanceRepository, PurchaseOrderIssuanceRepository>();
builder.Services.AddTransient<IPurchaseOrderPdfService, PurchaseOrderPdfService>();

builder.Services.AddTransient<IGoodsReceiptService, GoodsReceiptService>();
builder.Services.AddTransient<IGoodsReceiptRepository, GoodsReceiptRepository>();

builder.Services.AddTransient<IAiReorderSuggestionService, AiReorderSuggestionService>();

builder.Services.AddTransient<IPurchaseInvoiceService, PurchaseInvoiceService>();
builder.Services.AddTransient<IPurchaseInvoiceRepository, PurchaseInvoiceRepository>();

builder.Services.AddTransient<IAiProcurementExtractionService, AiProcurementExtractionService>();

#endregion


builder.Services.AddAuthentication(x =>
{
    x.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    x.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    x.DefaultScheme = JwtBearerDefaults.AuthenticationScheme;
}).AddJwtBearer(o =>
{
    o.RequireHttpsMetadata = false;
    o.SaveToken = true;
    o.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = false,
        ValidateAudience = false,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = builder.Configuration["Jwt:ValidIssuer"],
        ValidAudience = builder.Configuration["Jwt:ValidIssuer"],
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Secret"]))
    };
});

// Add services to the container.

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
        options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
    });
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
    {
        c.SwaggerDoc("v1", new OpenApiInfo { Title = "ApiCaseManagement", Version = "v1" });
        c.AddSecurityDefinition(
            "token",
            new OpenApiSecurityScheme
            {
                Type = SecuritySchemeType.Http,
                BearerFormat = "JWT",
                Scheme = "Bearer",
                In = ParameterLocation.Header,
                Name = HeaderNames.Authorization
            }
        );
        c.AddSecurityRequirement(
            new OpenApiSecurityRequirement
            {
                {
                    new OpenApiSecurityScheme
                    {
                        Reference = new OpenApiReference
                        {
                            Type = ReferenceType.SecurityScheme,
                            Id = "token"
                        },
                    },
                    Array.Empty<string>()
                }
            }
        );
    }
);
builder.Services.AddSwaggerGen();
builder.Services.AddAutoMapper(AppDomain.CurrentDomain.GetAssemblies());


var mappingConfig = new MapperConfiguration(mc =>
{
    mc.AddProfile(new CustomProfile());
});

IMapper mapper = mappingConfig.CreateMapper();
builder.Services.AddSingleton(mapper);

var app = builder.Build();

// Apply pending migrations automatically on startup
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    db.Database.Migrate();
}

// Seed data (users, roles, templates) — runs on every startup, idempotent
await app.UseItToSeedSqlServer();

app.UseRouting();
app.UseCors("AllowAnyHost");

app.UseDefaultFiles();
app.UseStaticFiles();

app.UseSwagger();
app.UseSwaggerUI();

if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.MapFallbackToFile("/index.html");

app.Run();


