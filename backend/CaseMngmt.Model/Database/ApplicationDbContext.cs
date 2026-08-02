using CaseMngmt.Models.AiMatching;
using CaseMngmt.Models.ApplicationRoles;
using CaseMngmt.Models.ApplicationUsers;
using CaseMngmt.Models.CaseKeywords;
using CaseMngmt.Models.Cases;
using CaseMngmt.Models.Companies;
using CaseMngmt.Models.CompanyTemplates;
using CaseMngmt.Models.Customers;
using CaseMngmt.Models.EntityKeywords;
using CaseMngmt.Models.GoodsReceipts;
using CaseMngmt.Models.Invoices;
using CaseMngmt.Models.PurchaseInvoices;
using CaseMngmt.Models.KeywordRoles;
using CaseMngmt.Models.Keywords;
using CaseMngmt.Models.Orders;
using CaseMngmt.Models.Products;
using CaseMngmt.Models.PurchaseOrders;
using CaseMngmt.Models.RoleFileTypes;
using CaseMngmt.Models.Suppliers;
using CaseMngmt.Models.Templates;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace CaseMngmt.Models.Database
{
    public class ApplicationDbContext : IdentityDbContext<ApplicationUser, ApplicationRole, Guid>
    {
#pragma warning disable CS8618 // Non-nullable field must contain a non-null value when exiting constructor. Consider declaring as nullable.
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
#pragma warning restore CS8618 // Non-nullable field must contain a non-null value when exiting constructor. Consider declaring as nullable.
            : base(options)
        {
        }


        public virtual DbSet<ApplicationRole> ApplicationRole { get; set; }
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Case>()
              .HasMany(e => e.Keywords)
              .WithMany(e => e.Cases)
              .UsingEntity<CaseKeyword>(
                  l => l.HasOne(e => e.Keyword).WithMany(e => e.CaseKeywords).HasForeignKey(e => e.KeywordId), //MapLeftKey
                  r => r.HasOne(e => e.Case).WithMany(e => e.CaseKeywords).HasForeignKey(e => e.CaseId)) //MapRightKey
              .HasKey(e => e.Id);

            modelBuilder.Entity<Types.Type>()
                .HasMany(e => e.Roles)
                .WithMany(e => e.FileTypes)
                .UsingEntity<RoleFileType>(
                    l => l.HasOne(e => e.ApplicationRole).WithMany(e => e.RoleFileTypes).HasForeignKey(e => e.RoleId), //MapLeftKey
                    r => r.HasOne(e => e.FileType).WithMany(e => e.RoleFileTypes).HasForeignKey(e => e.TypeId)) //MapRightKey
              .HasKey(e => new { e.RoleId, e.TypeId });

            modelBuilder.Entity<ApplicationRole>()
                .HasMany(e => e.Keywords)
                .WithMany(e => e.Roles)
                .UsingEntity<KeywordRole>(
                    l => l.HasOne(e => e.Keyword).WithMany(e => e.KeywordRoles).HasForeignKey(e => e.KeywordId), //MapLeftKey
                    r => r.HasOne(e => e.ApplicationRole).WithMany(e => e.KeywordRoles).HasForeignKey(e => e.RoleId)) //MapRightKey
              .HasKey(e => new { e.RoleId, e.KeywordId });

            modelBuilder.Entity<CompanyTemplate>()
                .HasKey(e => new { e.CompanyId, e.TemplateId });

            modelBuilder.Entity<Order>()
                .HasOne(e => e.Customer)
                .WithMany()
                .HasForeignKey(e => e.CustomerId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Order>()
                .HasOne<Company>()
                .WithMany()
                .HasForeignKey(e => e.CompanyId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Product>()
                .HasOne<Company>()
                .WithMany()
                .HasForeignKey(e => e.CompanyId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Supplier>()
                .HasOne<Company>()
                .WithMany()
                .HasForeignKey(e => e.CompanyId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<PurchaseOrder>()
                .HasOne<Company>()
                .WithMany()
                .HasForeignKey(e => e.CompanyId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<PurchaseOrder>()
                .HasOne(e => e.Supplier)
                .WithMany()
                .HasForeignKey(e => e.SupplierId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<PurchaseOrderItem>()
                .HasOne(e => e.PurchaseOrder)
                .WithMany(e => e.PurchaseOrderItems)
                .HasForeignKey(e => e.PurchaseOrderId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<PurchaseOrderItem>()
                .HasOne(e => e.Product)
                .WithMany()
                .HasForeignKey(e => e.ProductId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<PurchaseOrder>()
                .Property(e => e.SubTotalAmount).HasColumnType("decimal(18,2)");
            modelBuilder.Entity<PurchaseOrder>()
                .Property(e => e.TaxAmount).HasColumnType("decimal(18,2)");
            modelBuilder.Entity<PurchaseOrder>()
                .Property(e => e.TotalAmount).HasColumnType("decimal(18,2)");
            modelBuilder.Entity<PurchaseOrderItem>()
                .Property(e => e.Quantity).HasColumnType("decimal(18,2)");
            modelBuilder.Entity<PurchaseOrderItem>()
                .Property(e => e.UnitPrice).HasColumnType("decimal(18,2)");
            modelBuilder.Entity<PurchaseOrderItem>()
                .Property(e => e.LineAmount).HasColumnType("decimal(18,2)");
            modelBuilder.Entity<PurchaseOrderItem>()
                .Property(e => e.ReceivedQuantity).HasColumnType("decimal(18,2)");

            modelBuilder.Entity<GoodsReceipt>()
                .HasOne<Company>()
                .WithMany()
                .HasForeignKey(e => e.CompanyId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<GoodsReceipt>()
                .HasOne(e => e.PurchaseOrder)
                .WithMany()
                .HasForeignKey(e => e.PurchaseOrderId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<GoodsReceipt>()
                .HasOne(e => e.Supplier)
                .WithMany()
                .HasForeignKey(e => e.SupplierId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<GoodsReceiptItem>()
                .HasOne(e => e.GoodsReceipt)
                .WithMany(e => e.GoodsReceiptItems)
                .HasForeignKey(e => e.GoodsReceiptId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<GoodsReceiptItem>()
                .HasOne(e => e.PurchaseOrderItem)
                .WithMany()
                .HasForeignKey(e => e.PurchaseOrderItemId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<GoodsReceiptItem>()
                .HasOne(e => e.Product)
                .WithMany()
                .HasForeignKey(e => e.ProductId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<GoodsReceiptItem>()
                .Property(e => e.ReceivedQuantity).HasColumnType("decimal(18,2)");

            modelBuilder.Entity<PurchaseOrderIssuance>()
                .HasOne(e => e.PurchaseOrder)
                .WithMany()
                .HasForeignKey(e => e.PurchaseOrderId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<PurchaseInvoice>()
                .HasOne<Company>()
                .WithMany()
                .HasForeignKey(e => e.CompanyId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<PurchaseInvoice>()
                .HasOne(e => e.Supplier)
                .WithMany()
                .HasForeignKey(e => e.SupplierId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<PurchaseInvoice>()
                .HasOne(e => e.PurchaseOrder)
                .WithMany()
                .HasForeignKey(e => e.PurchaseOrderId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<PurchaseInvoice>()
                .HasOne(e => e.GoodsReceipt)
                .WithMany()
                .HasForeignKey(e => e.GoodsReceiptId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<PurchaseInvoice>()
                .Property(e => e.SubTotalAmount).HasColumnType("decimal(18,2)");
            modelBuilder.Entity<PurchaseInvoice>()
                .Property(e => e.TaxAmount).HasColumnType("decimal(18,2)");
            modelBuilder.Entity<PurchaseInvoice>()
                .Property(e => e.TotalAmount).HasColumnType("decimal(18,2)");

            modelBuilder.Entity<OrderItem>()
                .HasOne(e => e.Order)
                .WithMany(e => e.OrderItems)
                .HasForeignKey(e => e.OrderId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<OrderItem>()
                .HasOne(e => e.Product)
                .WithMany()
                .HasForeignKey(e => e.ProductId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Order>()
                .Property(e => e.SubTotalAmount).HasColumnType("decimal(18,2)");
            modelBuilder.Entity<Order>()
                .Property(e => e.TaxAmount).HasColumnType("decimal(18,2)");
            modelBuilder.Entity<Order>()
                .Property(e => e.TotalAmount).HasColumnType("decimal(18,2)");
            modelBuilder.Entity<OrderItem>()
                .Property(e => e.Quantity).HasColumnType("decimal(18,2)");
            modelBuilder.Entity<OrderItem>()
                .Property(e => e.UnitPrice).HasColumnType("decimal(18,2)");
            modelBuilder.Entity<OrderItem>()
                .Property(e => e.LineAmount).HasColumnType("decimal(18,2)");
            modelBuilder.Entity<Product>()
                .Property(e => e.StockQuantity).HasColumnType("decimal(18,2)");
            modelBuilder.Entity<Product>()
                .Property(e => e.ProductionCapacityPerDay).HasColumnType("decimal(18,2)");
            modelBuilder.Entity<Product>()
                .Property(e => e.UnitPrice).HasColumnType("decimal(18,2)");

            modelBuilder.Entity<Invoice>()
                .HasOne(e => e.Order)
                .WithMany()
                .HasForeignKey(e => e.OrderId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Invoice>()
                .HasOne(e => e.Customer)
                .WithMany()
                .HasForeignKey(e => e.CustomerId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Invoice>()
                .HasOne<Company>()
                .WithMany()
                .HasForeignKey(e => e.CompanyId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Invoice>()
                .Property(e => e.SubTotalAmount).HasColumnType("decimal(18,2)");
            modelBuilder.Entity<Invoice>()
                .Property(e => e.TaxAmount).HasColumnType("decimal(18,2)");
            modelBuilder.Entity<Invoice>()
                .Property(e => e.TotalAmount).HasColumnType("decimal(18,2)");

            modelBuilder.Entity<OrderRiskLineResult>()
                .HasOne(e => e.Order)
                .WithMany(e => e.RiskAssessments)
                .HasForeignKey(e => e.OrderId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<OrderRiskLineResult>()
                .HasOne(e => e.OrderItem)
                .WithMany()
                .HasForeignKey(e => e.OrderItemId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<EntityKeyword>()
                .HasOne(e => e.Keyword)
                .WithMany()
                .HasForeignKey(e => e.KeywordId)
                .OnDelete(DeleteBehavior.Restrict);

            // BaseModel.Name has no `?`, so with <Nullable>enable</Nullable> EF's NRT convention treats it
            // as required — but the AddEntityKeywordTable migration created it nullable (matching CaseKeyword's
            // own migration) and nothing that creates an EntityKeyword row ever sets Name. Without this override,
            // any query that materializes a full EntityKeyword entity (not a projection) throws SqlNullValueException
            // the first time it reads a row back. Override to match the actual (intentionally nullable) column.
            modelBuilder.Entity<EntityKeyword>()
                .Property(e => e.Name)
                .IsRequired(false);

            base.OnModelCreating(modelBuilder);
        }

        public DbSet<Company> Company { get; set; }
        public DbSet<Customer> Customer { get; set; }
        public DbSet<Types.Type> Type { get; set; }
        public DbSet<Case> Case { get; set; }
        public DbSet<Template> Template { get; set; }
        public DbSet<Keyword> Keyword { get; set; }
        public DbSet<KeywordRole> KeywordRole { get; set; }
        public DbSet<CaseKeyword> CaseKeyword { get; set; }
        public DbSet<CompanyTemplate> CompanyTemplate { get; set; }
        public DbSet<RoleFileType> RoleFileType { get; set; }
        public DbSet<Order> Order { get; set; }
        public DbSet<OrderItem> OrderItem { get; set; }
        public DbSet<Product> Product { get; set; }
        public DbSet<Invoice> Invoice { get; set; }
        public DbSet<OrderRiskLineResult> OrderRiskLineResult { get; set; }
        public DbSet<EntityKeyword> EntityKeyword { get; set; }
        public DbSet<Supplier> Supplier { get; set; }
        public DbSet<PurchaseOrder> PurchaseOrder { get; set; }
        public DbSet<PurchaseOrderItem> PurchaseOrderItem { get; set; }
        public DbSet<PurchaseOrderIssuance> PurchaseOrderIssuance { get; set; }
        public DbSet<GoodsReceipt> GoodsReceipt { get; set; }
        public DbSet<GoodsReceiptItem> GoodsReceiptItem { get; set; }
        public DbSet<PurchaseInvoice> PurchaseInvoice { get; set; }
    }
}
