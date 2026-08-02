using CaseMngmt.Models.Account;
using CaseMngmt.Models.ApplicationRoles;
using CaseMngmt.Models.ApplicationUsers;
using CaseMngmt.Models.Database;
using CaseMngmt.Models.KeywordRoles;
using CaseMngmt.Models.Keywords;
using CaseMngmt.Models.Templates;
using CaseMngmt.Repository.Companies;
using CaseMngmt.Repository.CompanyTemplates;
using CaseMngmt.Repository.KeywordRoles;
using CaseMngmt.Repository.Keywords;
using CaseMngmt.Repository.Templates;
using CaseMngmt.Repository.Types;
using Microsoft.AspNetCore.Identity;

namespace CaseMngmt.Server
{
    internal static class DbInitializerExtension
    {
        public static async Task<IApplicationBuilder> UseItToSeedSqlServer(this IApplicationBuilder app)
        {
            ArgumentNullException.ThrowIfNull(app, nameof(app));

            using var scope = app.ApplicationServices.CreateScope();
            var services = scope.ServiceProvider;
            try
            {
                var context = services.GetRequiredService<ApplicationDbContext>();
                var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
                var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<ApplicationRole>>();
                var companyManager = scope.ServiceProvider.GetRequiredService<ICompanyRepository>();
                var typeManager = scope.ServiceProvider.GetRequiredService<ITypeRepository>();
                var templateManager = scope.ServiceProvider.GetRequiredService<ITemplateRepository>();
                var keywordManager = scope.ServiceProvider.GetRequiredService<IKeywordRepository>();
                var companyTemplateManager = scope.ServiceProvider.GetRequiredService<ICompanyTemplateRepository>();
                var keywordRoleAssignManager = scope.ServiceProvider.GetRequiredService<IKeywordRoleRepository>();

                #region Company

                var defaultCompanyGuid = Guid.Parse("A4B11694-A5C9-48D7-BF6D-F12C019482DE");
                var boatCompanyGuid = Guid.Parse("A4B11694-A5C9-48D7-BF6D-F12C019482DD");
                var checkData = await companyManager.GetByIdAsync(defaultCompanyGuid);
                if (checkData != null)
                {
                    // Existing install: seed Standard Template if missing (idempotent)
                    await SeedStandardTemplateIfNeededAsync(context, templateManager, keywordManager);
                    await SeedOrderFileTypeIfNeededAsync(context, typeManager);
                    return app;
                }
                await companyManager.AddAsync(new Models.Companies.Company
                {
                    Id = defaultCompanyGuid,
                    Name = "CASE Company DEFAULT",
                    BuildingName = "CASE Company DEFAULT",
                    City = "Ha Noi",
                    StateProvince = "Cau Giay",
                    Street = "Pham Van Bach",
                    RoomNumber = "10",
                    CreatedDate = DateTime.Now,
                    UpdatedDate = DateTime.Now,
                    CreatedBy = Guid.Empty,
                    UpdatedBy = Guid.Empty,
                    PhoneNumber = "0904752252",
                    PostCode1 = "1",
                    PostCode2 = "2",
                    Deleted = false,
                });
                await companyManager.AddAsync(new Models.Companies.Company
                {
                    Id = boatCompanyGuid,
                    Name = "BOAT Company",
                    BuildingName = "BOAT Company",
                    City = "Japan",
                    StateProvince = "Tokyo",
                    Street = "",
                    RoomNumber = "",
                    CreatedDate = DateTime.Now,
                    UpdatedDate = DateTime.Now,
                    CreatedBy = Guid.Empty,
                    UpdatedBy = Guid.Empty,
                    PhoneNumber = "09099999999",
                    PostCode1 = "1",
                    PostCode2 = "2",
                    Deleted = false,
                });
                #endregion

                #region Type

                var defaultNumbericTypeGuid = Guid.NewGuid();
                var defaultNumbericType2Guid = Guid.NewGuid();
                var defaultDateTypeGuid = Guid.NewGuid();
                var defaultDatetimeTypeGuid = Guid.NewGuid();
                var defaultCurrencyTypeGuid = Guid.NewGuid();
                var defaultAlphanumericTypeGuid = Guid.NewGuid();
                var listTextAreaGuid = Guid.NewGuid();
                var listDefaultGuid = Guid.NewGuid();
                var listRequestTypeGuid = Guid.NewGuid();
                var listPaymentStatusGuid = Guid.NewGuid();
                var listSubmissionStatusGuid = Guid.NewGuid();

                var listBoat1Guid = Guid.NewGuid();
                var listBoat2Guid = Guid.NewGuid();
                var listBoat3Guid = Guid.NewGuid();
                var listBoat4Guid = Guid.NewGuid();
                var listBoat5Guid = Guid.NewGuid();
                var listBoat6Guid = Guid.NewGuid();

                var listType = new List<Models.Types.Type>() {
                    new Models.Types.Type
                    {
                        Name = "納品書", Value = "string", IsFileType = true,
                    },
                    new Models.Types.Type
                    {
                        Name = "請求書", Value = "string",IsFileType = true,
                    },
                    new Models.Types.Type
                    {
                        Name = "発注書",Value = "string",IsFileType = true,
                    },
                    new Models.Types.Type
                    {
                        Name = "その他",Value = "string",IsFileType = true,
                    },
                    new Models.Types.Type
                    {
                        Id = defaultNumbericTypeGuid,
                        Name = "Numberic (Up to 9 digits)",
                        Value = "int",
                        IsDefaultType = true
                    },
                    new Models.Types.Type
                    {
                        Id = defaultNumbericType2Guid,
                        Name = "Numberic (Up to 20 digits)",
                        Value = "decimal",
                        IsDefaultType = true
                    },
                    new Models.Types.Type
                    {
                        Id=defaultDateTypeGuid,
                        Name = "Date",
                        Value = "datetime",
                        IsDefaultType = true
                    },
                    new Models.Types.Type
                    {
                        Id= defaultDatetimeTypeGuid,
                        Name = "Datetime",
                        Value = "datetime",
                        IsDefaultType = true
                    },
                    new Models.Types.Type
                    {
                        Id= defaultCurrencyTypeGuid,
                        Name = "Currency",
                        Value = "decimal",
                        IsDefaultType = true
                    },
                    new Models.Types.Type
                    {
                        Id = defaultAlphanumericTypeGuid,
                        Name = "Alphanumeric",
                        Value = "string",
                        IsDefaultType = true
                    },
                    new Models.Types.Type
                    {
                        Id = listTextAreaGuid,
                        Name = "TextArea",
                        Value = "textarea",
                        IsDefaultType = true
                    },
                    new Models.Types.Type
                    {
                        Id = listDefaultGuid,
                        Name = "List (Alphanumeric)",
                        Value = "list",
                        IsDefaultType = true
                    },
                    //new Models.Types.Type
                    //{
                    //    Id = listRequestTypeGuid,
                    //    Name = "List (Alphanumeric)",
                    //    Value = "list",
                    //    Metadata = "Land Parcel Survey,Topographic Survey,Geological Survey,Seismic Survey,Groundwater Survey,Architectural Design,New Construction,Remodeling/Renovation Construction,Demolition Construction",
                    //},
                    //new Models.Types.Type
                    //{
                    //    Id = listSubmissionStatusGuid,
                    //    Name = "List (Alphanumeric)",
                    //    Value = "list",
                    //    Metadata = "Not yet,Done",
                    //},
                    //new Models.Types.Type
                    //{
                    //    Id = listPaymentStatusGuid,
                    //    Name = "List (Alphanumeric)",
                    //    Value = "list",
                    //    Metadata = "Billed,Check Payment,Complete",
                    //},
                    new Models.Types.Type
                    {
                        Id = listBoat1Guid,
                        Name = "List 注文種類",
                        Value = "list",
                        Metadata = "ジェット,バスボート,マリンボート,OEM,その他",
                    },
                    new Models.Types.Type
                    {
                        Id = listBoat2Guid,
                        Name = "List 採寸性",
                        Value = "list",
                        Metadata = "不要,必要",
                    },
                    new Models.Types.Type
                    {
                        Id = listBoat3Guid,
                        Name = "List 裁断状況",
                        Value = "list",
                        Metadata = "未完了,完了",
                    },
                    new Models.Types.Type
                    {
                        Id = listBoat4Guid,
                        Name = "List 納期状況",
                        Value = "list",
                        Metadata = "未完了,完了",
                    },
                    new Models.Types.Type
                    {
                        Id = listBoat5Guid,
                        Name = "List 社内担当名",
                        Value = "list",
                        Metadata = "田中太郎,山田花子,佐藤雅人,鈴木美咲,小林太一",
                    },
                    new Models.Types.Type
                    {
                        Id = listBoat6Guid,
                        Name = "List 入金状況",
                        Value = "list",
                        Metadata = "請求済,入金要確認,入金完了",
                    }
                };
                await typeManager.AddMultiAsync(listType);

                #endregion

                #region Template

                var boatTemplateId = Guid.NewGuid();
                await templateManager.AddAsync(new Template { Id = boatTemplateId, Name = "BOAT Template" });

                #endregion

                #region CompanyTemplate
                await companyTemplateManager.AddAsync(new Models.CompanyTemplates.CompanyTemplate
                {
                    CompanyId = defaultCompanyGuid,
                    TemplateId = boatTemplateId
                });

                await companyTemplateManager.AddAsync(new Models.CompanyTemplates.CompanyTemplate
                {
                    CompanyId = boatCompanyGuid,
                    TemplateId = boatTemplateId
                });

                #endregion

                #region Keyword

                Guid keyword1PermissionId = Guid.NewGuid();
                Guid keyword2PermissionId = Guid.NewGuid();
                Guid keyword3PermissionId = Guid.NewGuid();

                var listKeywordBoat = new List<Keyword> {
                    new Keyword
                    {
                        Name = "取引先名",
                        TypeId = defaultAlphanumericTypeGuid,
                        TemplateId = boatTemplateId,
                        MaxLength = 250,
                        IsRequired = true,
                        CaseSearchable = true,
                        DocumentSearchable = true,
                        Order = 1,
                        IsShowOnCaseList = true
                    },
                    new Keyword
                    {
                        Name = "住所",
                        TypeId = defaultAlphanumericTypeGuid,
                        TemplateId = boatTemplateId,
                        MaxLength = 250,
                        IsRequired = true,
                        CaseSearchable = false,
                        Order = 2,
                    },
                    new Keyword
                    {
                        Name = "電話番号",
                        TypeId = defaultNumbericType2Guid,
                        TemplateId = boatTemplateId,
                        IsRequired = true,
                        CaseSearchable = true,
                        Order = 3,
                    },
                    new Keyword
                    {
                        Name = "顧客担当者名",
                        TypeId = defaultAlphanumericTypeGuid,
                        TemplateId = boatTemplateId,
                        MaxLength = 20,
                        Order = 4,
                    },
                    new Keyword
                    {
                        Name = "注文日",
                        TypeId = defaultDatetimeTypeGuid,
                        TemplateId = boatTemplateId,
                        IsRequired = true,
                        CaseSearchable = true,
                        DocumentSearchable = true,
                        Order = 5,
                    },
                    new Keyword
                    {
                        Name = "注文種類",
                        TypeId = listBoat1Guid,
                        TemplateId = boatTemplateId,
                        MaxLength = 50,
                        IsRequired = true,
                        CaseSearchable = true,
                        Order = 6,
                        IsShowOnCaseList = true
                    },
                    new Keyword
                    {
                        Name = "商品名/内容",
                        TypeId = defaultAlphanumericTypeGuid,
                        TemplateId = boatTemplateId,
                        MaxLength = 250,
                        IsRequired = true,
                        Order = 7,
                    },
                    new Keyword
                    {
                        Name = "生地タイプ",
                        TypeId = defaultAlphanumericTypeGuid,
                        TemplateId = boatTemplateId,
                        MaxLength = 20,
                        IsRequired = true,
                        Order = 8,
                    },
                    new Keyword
                    {
                        Name = "生地色",
                        TypeId = defaultAlphanumericTypeGuid,
                        TemplateId = boatTemplateId,
                        MaxLength = 20,
                        IsRequired = true,
                        Order = 9,
                    },
                    new Keyword
                    {
                        Name = "数量",
                        TypeId = defaultNumbericTypeGuid,
                        TemplateId = boatTemplateId,
                        IsRequired = true,
                        Order = 10,
                    },
                    new Keyword
                    {
                        Name = "単価",
                        TypeId = defaultCurrencyTypeGuid,
                        TemplateId = boatTemplateId,
                        Order = 11,
                    },
                    new Keyword
                    {
                        Name = "金額",
                        TypeId = defaultCurrencyTypeGuid,
                        TemplateId = boatTemplateId,
                        DocumentSearchable = true,
                        Order = 12,
                    },
                    new Keyword
                    {
                        Name = "納期要望日",
                        TypeId = defaultDatetimeTypeGuid,
                        TemplateId = boatTemplateId,
                        Order = 13,
                    },
                    new Keyword
                    {
                        Name = "採寸性",
                        TypeId = listBoat2Guid,
                        TemplateId = boatTemplateId,
                        MaxLength = 50,
                        Order = 14,
                    },
                    new Keyword
                    {
                        Name = "裁断状況",
                        TypeId = listBoat3Guid,
                        TemplateId = boatTemplateId,
                        MaxLength = 10,
                        Order = 15,
                    },
                    new Keyword
                    {
                        Name = "納期状況",
                        TypeId = listBoat4Guid,
                        TemplateId = boatTemplateId,
                        MaxLength = 10,
                        Order = 16,
                    },
                    new Keyword
                    {
                        Name = "社内担当名",
                        TypeId = listBoat5Guid,
                        TemplateId = boatTemplateId,
                        MaxLength = 20,
                        CaseSearchable = true,
                        Order = 17,
                    },
                    new Keyword
                    {
                        Id = keyword1PermissionId,
                        Name = "入金状況",
                        TypeId = listBoat6Guid,
                        TemplateId = boatTemplateId,
                        MaxLength = 10,
                        CaseSearchable = true,
                        Order = 18,
                    },
                    new Keyword
                    {
                        Name = "請求日",
                        Id = keyword2PermissionId,
                        TypeId = defaultDatetimeTypeGuid,
                        TemplateId = boatTemplateId,
                        CaseSearchable = true,
                        Order = 19,
                    },
                    new Keyword
                    {
                        Name = "入金日",
                        Id = keyword3PermissionId,
                        TypeId = defaultDatetimeTypeGuid,
                        TemplateId = boatTemplateId,
                        CaseSearchable = true,
                        Order = 20,
                    },
                    new Keyword
                    {
                        Name = "備考",
                        TypeId = listTextAreaGuid,
                        TemplateId = boatTemplateId,
                        Order = 21,
                    }
                };
                await keywordManager.AddMultiAsync(listKeywordBoat);

                #endregion

                #region Users & Roles

                var userExists = await userManager.FindByNameAsync("SuperAdmin");
                if (userExists == null)
                {
                    var user = new ApplicationUser
                    {
                        Email = "hoangthanhduong@gmail.com",
                        SecurityStamp = Guid.NewGuid().ToString(),
                        UserName = "SuperAdmin",
                        CompanyId = defaultCompanyGuid
                    };
                    await userManager.CreateAsync(user, "Admin@123");

                    var boatAdminUser = new ApplicationUser
                    {
                        Email = "tanbc0901@gmail.com",
                        SecurityStamp = Guid.NewGuid().ToString(),
                        UserName = "BoatAdmin",
                        CompanyId = boatCompanyGuid
                    };
                    await userManager.CreateAsync(boatAdminUser, "Admin@123");

                    var boatNormalUser = new ApplicationUser
                    {
                        Email = "tiepnvbn@gmail.com",
                        SecurityStamp = Guid.NewGuid().ToString(),
                        UserName = "BoatNormalUser",
                        CompanyId = boatCompanyGuid
                    };
                    await userManager.CreateAsync(boatNormalUser, "Admin@123");

                    await roleManager.CreateAsync(new ApplicationRole(UserRoles.SuperAdmin));
                    await roleManager.CreateAsync(new ApplicationRole(UserRoles.Admin));
                    await roleManager.CreateAsync(new ApplicationRole(UserRoles.User));

                    await userManager.AddToRoleAsync(user, UserRoles.SuperAdmin);
                    await userManager.AddToRoleAsync(boatAdminUser, UserRoles.Admin);
                    await userManager.AddToRoleAsync(boatNormalUser, UserRoles.User);

                    #endregion

                    #region Assign Keyword to Role of USER
                    var roleSuperAdmin = await roleManager.FindByNameAsync(UserRoles.SuperAdmin);
                    var roleAdmin = await roleManager.FindByNameAsync(UserRoles.Admin);
                    var roleUser = await roleManager.FindByNameAsync(UserRoles.User);

                    var assignSuperAdmin = listKeywordBoat
                        .Select(x => new KeywordRole
                        {
                            KeywordId = x.Id,
                            RoleId = roleSuperAdmin.Id
                        }).ToList();
                    var assignAdmin = listKeywordBoat
                        .Select(x => new KeywordRole
                        {
                            KeywordId = x.Id,
                            RoleId = roleAdmin.Id
                        }).ToList();
                    var assignUser = listKeywordBoat.Where(x => x.Id != keyword1PermissionId && x.Id != keyword2PermissionId && x.Id != keyword3PermissionId)
                        .Select(x => new KeywordRole
                        {
                            KeywordId = x.Id,
                            RoleId = roleUser.Id
                        }).ToList();

                    await keywordRoleAssignManager.AddMultiAsync(assignSuperAdmin);
                    await keywordRoleAssignManager.AddMultiAsync(assignAdmin);
                    await keywordRoleAssignManager.AddMultiAsync(assignUser);

                    #endregion
                }

                // New install: seed Standard Template after types are available
                await SeedStandardTemplateIfNeededAsync(context, templateManager, keywordManager);
                await SeedOrderFileTypeIfNeededAsync(context, typeManager);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[SEED ERROR] {ex.GetType().Name}: {ex.Message}");
                Console.WriteLine(ex.StackTrace);
                throw;
            }
            return app;
        }

        private static async Task SeedStandardTemplateIfNeededAsync(
            ApplicationDbContext context,
            ITemplateRepository templateManager,
            IKeywordRepository keywordManager)
        {
            if (context.Template.Any(t => t.IsDefault))
                return;

            var alphaType = context.Type.FirstOrDefault(t => t.Name == "Alphanumeric" && t.IsDefaultType);
            var dateType = context.Type.FirstOrDefault(t => t.Name == "Date" && t.IsDefaultType);

            // Types not seeded yet — skip; will be called again after first full seed
            if (alphaType == null || dateType == null)
                return;

            var standardTemplateId = Guid.Parse("A0000000-0000-0000-0000-000000000001");
            await templateManager.AddAsync(new Template
            {
                Id = standardTemplateId,
                Name = "Standard Template",
                IsDefault = true,
            });

            await keywordManager.AddMultiAsync(new List<Keyword>
            {
                new Keyword { Name = "顧客名",   TypeId = alphaType.Id, TemplateId = standardTemplateId, MaxLength = 250, IsRequired = true,  Order = 1 },
                new Keyword { Name = "住所",     TypeId = alphaType.Id, TemplateId = standardTemplateId, MaxLength = 500, IsRequired = false, Order = 2 },
                new Keyword { Name = "電話番号", TypeId = alphaType.Id, TemplateId = standardTemplateId, MaxLength = 20,  IsRequired = false, Order = 3 },
                new Keyword { Name = "作成日",   TypeId = dateType.Id,  TemplateId = standardTemplateId,                 IsRequired = true,  Order = 4 },
            });
        }

        private static async Task SeedOrderFileTypeIfNeededAsync(ApplicationDbContext context, ITypeRepository typeManager)
        {
            if (context.Type.Any(t => t.Name == "受注書" && t.IsFileType))
                return;

            await typeManager.AddAsync(new Models.Types.Type
            {
                Name = "受注書",
                Value = "string",
                IsFileType = true,
            });
        }
    }
}
