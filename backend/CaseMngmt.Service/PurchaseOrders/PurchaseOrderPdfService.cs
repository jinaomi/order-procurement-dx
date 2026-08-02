using CaseMngmt.Models.Companies;
using CaseMngmt.Models.PurchaseOrders;
using CaseMngmt.Models.Suppliers;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace CaseMngmt.Service.PurchaseOrders
{
    public class PurchaseOrderPdfService : IPurchaseOrderPdfService
    {
        private const string FontFamily = "MS Gothic";

        public byte[] GeneratePdf(PurchaseOrder purchaseOrder, Supplier supplier, Company company)
        {
            var document = Document.Create(container =>
            {
                container.Page(page =>
                {
                    page.Size(PageSizes.A4);
                    page.Margin(40);
                    page.DefaultTextStyle(x => x.FontFamily(FontFamily).FontSize(10));

                    page.Header().Column(col =>
                    {
                        col.Item().Text("発注書").FontSize(22).Bold();
                        col.Item().PaddingTop(5).Text($"発注番号: {purchaseOrder.PurchaseOrderNumber}");
                        col.Item().Text($"発注日: {purchaseOrder.OrderDate:yyyy年MM月dd日}");
                        if (purchaseOrder.ExpectedDeliveryDate.HasValue)
                        {
                            col.Item().Text($"納品希望日: {purchaseOrder.ExpectedDeliveryDate:yyyy年MM月dd日}");
                        }
                    });

                    page.Content().PaddingVertical(15).Column(col =>
                    {
                        col.Spacing(10);

                        col.Item().Row(row =>
                        {
                            row.RelativeItem().Column(c =>
                            {
                                c.Item().Text("発注先").Bold();
                                c.Item().Text($"{supplier.Name} 御中");
                                c.Item().Text(FormatAddress(supplier.PostCode1, supplier.PostCode2, supplier.StateProvince, supplier.City, supplier.Street, supplier.BuildingName, supplier.RoomNumber));
                                c.Item().Text($"TEL: {supplier.PhoneNumber}");
                            });
                            row.RelativeItem().Column(c =>
                            {
                                c.Item().Text("発注元").Bold();
                                c.Item().Text(company.Name);
                                c.Item().Text(FormatAddress(company.PostCode1, company.PostCode2, company.StateProvince, company.City, company.Street, company.BuildingName, company.RoomNumber));
                                c.Item().Text($"TEL: {company.PhoneNumber}");
                            });
                        });

                        col.Item().Table(table =>
                        {
                            table.ColumnsDefinition(columns =>
                            {
                                columns.RelativeColumn(4);
                                columns.RelativeColumn(1);
                                columns.RelativeColumn(2);
                                columns.RelativeColumn(2);
                            });

                            table.Header(header =>
                            {
                                header.Cell().Element(HeaderCellStyle).Text("品目");
                                header.Cell().Element(HeaderCellStyle).Text("数量");
                                header.Cell().Element(HeaderCellStyle).AlignRight().Text("単価");
                                header.Cell().Element(HeaderCellStyle).AlignRight().Text("金額");
                            });

                            foreach (var item in purchaseOrder.PurchaseOrderItems)
                            {
                                table.Cell().Element(BodyCellStyle).Text(item.ProductNameRaw);
                                table.Cell().Element(BodyCellStyle).Text(item.Quantity.ToString("#,0.##"));
                                table.Cell().Element(BodyCellStyle).AlignRight().Text(item.UnitPrice.ToString("#,0"));
                                table.Cell().Element(BodyCellStyle).AlignRight().Text(item.LineAmount.ToString("#,0"));
                            }
                        });

                        col.Item().AlignRight().Column(c =>
                        {
                            c.Item().Text($"小計: {purchaseOrder.SubTotalAmount:#,0} 円");
                            c.Item().Text($"消費税: {purchaseOrder.TaxAmount:#,0} 円");
                            c.Item().PaddingTop(5).Text($"合計金額: {purchaseOrder.TotalAmount:#,0} 円").FontSize(13).Bold();
                        });

                        if (!string.IsNullOrEmpty(purchaseOrder.Note))
                        {
                            col.Item().PaddingTop(10).Text($"備考: {purchaseOrder.Note}");
                        }
                    });

                    page.Footer().AlignCenter().Text("Powered by ITFreee").FontSize(8);
                });
            });

            return document.GeneratePdf();
        }

        private static IContainer HeaderCellStyle(IContainer container)
        {
            return container.DefaultTextStyle(x => x.Bold()).PaddingVertical(5).BorderBottom(1).BorderColor(Colors.Black);
        }

        private static IContainer BodyCellStyle(IContainer container)
        {
            return container.PaddingVertical(5).BorderBottom(0.5f).BorderColor(Colors.Grey.Lighten2);
        }

        private static string FormatAddress(string? postCode1, string? postCode2, string? state, string? city, string? street, string? building, string? room)
        {
            var postCode = string.IsNullOrEmpty(postCode1) ? "" : $"〒{postCode1}-{postCode2} ";
            return $"{postCode}{state}{city}{street}{building}{room}".Trim();
        }
    }
}
