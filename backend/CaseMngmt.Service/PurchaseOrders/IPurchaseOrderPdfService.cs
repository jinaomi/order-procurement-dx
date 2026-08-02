using CaseMngmt.Models.Companies;
using CaseMngmt.Models.PurchaseOrders;
using CaseMngmt.Models.Suppliers;

namespace CaseMngmt.Service.PurchaseOrders
{
    public interface IPurchaseOrderPdfService
    {
        byte[] GeneratePdf(PurchaseOrder purchaseOrder, Supplier supplier, Company company);
    }
}
