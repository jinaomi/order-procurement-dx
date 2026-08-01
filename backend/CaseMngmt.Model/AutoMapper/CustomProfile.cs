using AutoMapper;
using CaseMngmt.Models.Companies;
using CaseMngmt.Models.Customers;
using CaseMngmt.Models.FileTypes;
using CaseMngmt.Models.Keywords;
using CaseMngmt.Models.Products;
using CaseMngmt.Models.Suppliers;
using CaseMngmt.Models.Types;

namespace CaseMngmt.Models.AutoMapper
{
    public class CustomProfile : Profile
    {
        public CustomProfile()
        {
            CreateMap<CustomerViewModel, Customer>();
            CreateMap<Customer, CustomerViewModel>();
            CreateMap<PagedResult<CustomerViewModel>, PagedResult<Customer>>();
            CreateMap<PagedResult<Customer>, PagedResult<CustomerViewModel>>();
            CreateMap<Customer, CustomerRequest>();
            CreateMap<CustomerRequest, Customer>().ForMember(x => x.Id, opt => opt.Ignore());

            CreateMap<CompanyViewModel, Company>();
            CreateMap<Company, CompanyViewModel>();
            CreateMap<PagedResult<CompanyViewModel>, PagedResult<Company>>();
            CreateMap<PagedResult<Company>, PagedResult<CompanyViewModel>>();
            CreateMap<Company, CompanyRequest>();
            CreateMap<CompanyRequest, Company>().ForMember(x => x.Id, opt => opt.Ignore());

            CreateMap<TypeViewModel, Types.Type>();
            CreateMap<Types.Type, TypeViewModel>();
            CreateMap<Types.Type, TypeRequest>();
            CreateMap<TypeRequest, Types.Type>().ForMember(x => x.Id, opt => opt.Ignore());

            CreateMap<FileTypeViewModel, Types.Type>();
            CreateMap<Types.Type, FileTypeViewModel>();
            CreateMap<Types.Type, FileTypeModel>();
            CreateMap<FileTypeModel, Types.Type>();

            CreateMap<Keyword, KeywordRequest>();
            CreateMap<KeywordRequest, Keyword>().ForMember(x => x.Id, opt => opt.Ignore());

            CreateMap<Product, ProductViewModel>();
            CreateMap<ProductViewModel, Product>();
            CreateMap<PagedResult<Product>, PagedResult<ProductViewModel>>();
            CreateMap<PagedResult<ProductViewModel>, PagedResult<Product>>();
            CreateMap<ProductRequest, Product>().ForMember(x => x.Id, opt => opt.Ignore());

            CreateMap<Supplier, SupplierViewModel>();
            CreateMap<SupplierViewModel, Supplier>();
            CreateMap<PagedResult<Supplier>, PagedResult<SupplierViewModel>>();
            CreateMap<PagedResult<SupplierViewModel>, PagedResult<Supplier>>();
            CreateMap<SupplierRequest, Supplier>().ForMember(x => x.Id, opt => opt.Ignore());
        }
    }
}
