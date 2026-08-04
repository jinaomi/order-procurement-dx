# CaseMngmt — Architecture & Design Reference

Tài liệu này ghi lại kiến trúc, các quyết định thiết kế, convention và ràng buộc đã được thống nhất.
Claude phải đọc file này trước khi làm bất kỳ thay đổi nào vào codebase.

Tài liệu bổ sung:
- Kiến trúc chi tiết: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- Quyết định thiết kế (ADR): [docs/adr/](docs/adr/)
- Nhật ký phát triển: [docs/devlog/](docs/devlog/)
- Hướng dẫn sử dụng / demo cho khách hàng (tiếng Nhật): [docs/USER_GUIDE.md](docs/USER_GUIDE.md)

---

## Current State (2026-08-04)

**Redesign toàn bộ giao diện (theme màu mới + điều hướng mới) — ĐÃ CODE XONG + ĐÃ MERGE vào `main` (2026-08-04)**: theo yêu cầu "thay đổi giao diện hoàn toàn mới", đã tạo theme MUI trung tâm (`frontend/src/theme.js`, palette navy `#1F3A5F`/copper `#B85A25`), viết lại `Sidebar.js` (nhóm menu mới マスタ管理/受注管理/仕入れ管理/レポート・ツール, drawer thu gọn được, avatar+logout ở AppBar), `Login.js` (MUI Card/TextField), `FormButton.js` (màu theo theme + thêm `buttonType="secondaryAction"`), dọn hex cứng toàn app, đổi tab title + favicon. Sau đó có 1 lượt tinh chỉnh tiếp theo phản hồi trực tiếp từ user: header bảng đổi từ khối navy đặc sang kiểu nhẹ (nền sáng/chữ đậm/gạch chân), tăng cỡ chữ toàn app, component mới `FormSection.js` (Card bọc nội dung form thay vì để trần trên nền xám) áp dụng cho 7 trang detail (`OrderDetail`/`PurchaseOrderDetail`/`GoodsReceiptDetail`/`PurchaseInvoiceDetail`/`SupplierDetail`/`ProductDetail`/`CustomerDetail`), phân cấp lại bộ nút 保存/新規作成/添付 (không còn 3 khối đặc bằng nhau), và đổi style tiêu đề section "カスタム項目" từ Divider+Chip sang tiêu đề đơn giản đồng bộ với `FormSection`. Đã test qua Playwright+Edge thật ở mọi bước, `npm run build` production sạch. Xem `docs/devlog/2026-08-03.md` để biết đầy đủ quyết định + các bug phát hiện thêm qua QA (nút 編集/削除 lẫn màu ở 15 file, 2 bug scroll khi đổi trang/mở menu).

**Giữ giao diện cũ làm đường lùi — branch `ui-legacy` (mới, 2026-08-04)**: theo yêu cầu user (muốn dùng giao diện mới làm chính nhưng vẫn có đường lùi nếu phát sinh bug, hoặc sau này khách hàng yêu cầu dùng lại giao diện cũ), branch **`ui-legacy`** đã được tạo tại đúng điểm `main` TRƯỚC khi merge redesign (commit `a76394c`, "Fix production build using stale hardcoded IP; update project docs", 2026-08-02) — đóng băng vĩnh viễn toàn bộ giao diện cũ, **không phát triển tiếp** trên branch này. Cách dựng lại nếu cần: `git checkout ui-legacy` → `cd frontend && npm run build` → mirror kết quả vào `wwwroot` (`robocopy ... /MIR`, xem mục "Demo/chia sẻ ra ngoài" bên dưới) → chạy backend trỏ vào `wwwroot` đó. Quyết định này thay cho việc xây cơ chế toggle runtime trong app (đã cân nhắc và loại bỏ vì chi phí bảo trì lâu dài quá cao — sẽ phải duy trì song song 2 bộ code UI mãi mãi — trong khi nhu cầu thực tế chỉ là có đường lùi, không cần chạy đồng thời).

**QUAN TRỌNG — phạm vi repo đã đổi**: kể từ 2026-07-31, đây là repo **`order-procurement-dx`** (clone từ `order-platform-dx`), và là **repo DUY NHẤT** còn được làm việc. User yêu cầu **không đụng vào `case-management` (`f:\Prj\CaseMngmt`) hay `order-platform-dx` (`f:\Prj\CaseMngmt-demo`) nữa** — xem chi tiết lý do + ràng buộc trong `docs/devlog/2026-07-31.md`.

**Module 仕入れ (procurement/supplier) — ĐÃ CODE XONG cả 6 phase (2026-08-01)**: Supplier → PurchaseOrder → GoodsReceipt → PurchaseInvoice, cộng thêm 2 tính năng AI (発注提案 đề xuất đặt hàng chủ động, và AI đọc 見積書/納品書). Toàn bộ dùng engine `EntityKeyword`/`ModuleType` cho custom field ngay từ đầu. Xem mục "Module 仕入れ" bên dưới để biết kiến trúc chi tiết, và `docs/devlog/2026-08-01.md` để biết đầy đủ quyết định + kết quả test. **Chưa test qua UI thật** (chỉ test qua API/curl + build check) — xem Next Steps.

**Dynamic Field / Custom Fields cho Product & Order (mới, 2026-07-31)**: đã tổng quát hoá cơ chế EAV vốn chỉ phục vụ 案件管理 (`Template`/`Keyword`/`Type`/`CaseKeyword`) để dùng chung được cho `Product`/`Order` — admin giờ tự thêm/bớt "field bổ sung" (không phải field lõi có logic nghiệp vụ) qua Form Builder (`KeywordBuilder.jsx`) có sẵn, không cần sửa code. Chi tiết kiến trúc:
- `Template.ModuleType` (`"Case"`/`"Product"`/`"Order"`, default `"Case"` — không đổi hành vi Case cũ) phân biệt template thuộc module nào; 1 company giờ có nhiều `CompanyTemplate` (1 per module) thay vì giả định 1-template-duy-nhất như trước.
- Bảng mới `EntityKeyword{EntityType, EntityId, KeywordId, Value}` (`CaseMngmt.Model|Repository|Service/EntityKeywords/`) — lưu giá trị custom field cho Product/Order, **tách biệt hoàn toàn** khỏi bảng `CaseKeyword` cũ (Case zero-touch, không rủi ro regression).
- Field LÕI (`StockQuantity`, `UnitPrice`, `ProductionCapacityPerDay`, `Quantity`, `CustomerId`, `OrderDate`...) — những field có logic nghiệp vụ thật phụ thuộc (AI照合, trừ/cộng kho, PDF) — **vẫn là cột C# cố định**, KHÔNG đưa vào EAV. Chỉ field bổ sung mới dynamic.
- Endpoint mới `GET /api/template/module?moduleType=` (`TemplateController.cs`) tự tạo template rỗng cho company nếu chưa có (self-healing, không cần backfill migration).
- Frontend: `CustomFieldsSection.js` (mới, dùng chung) + section "カスタム項目" trong `ProductDetail.js`/`OrderDetail.js`. `GenericItems.js` được vá thêm case `"textarea"` còn thiếu từ trước (bug cũ của Case, giờ đã fix luôn).
- **Đã test qua UI thật (Playwright headless + Edge, 2026-07-31)**: login → Form Builder thêm field mới cho Product/Order → tạo record có điền field → reload từ server → giá trị persist đúng, cho cả 2 module. Phát hiện + fix thêm 1 bug thật trong lúc test: field mới tạo mà để trống "最大文字数" bị lưu `MaxLength=0`, khiến `<input maxLength={0}>` chặn hoàn toàn việc gõ chữ — đã fix ở `GenericItems.js` (`maxLength={props.maxLength || undefined}`, cả case `"string"` và `"textarea"`). Chi tiết xem `docs/devlog/2026-07-31.md` phần "Test dynamic-field qua UI thật".
- Section "カスタム項目" trên form Product/Order giờ hiển thị bằng `Divider`+`Chip` (đường kẻ + nhãn dạng viên ở giữa) thay vì chữ thường, để phân biệt rõ field cố định (phía trên) và field khách hàng tự thêm (phía dưới) — `CustomFieldsSection.js`.
- **2 bug layout MUI pre-existing (không liên quan dynamic-field) phát hiện khi user browse app thật, đã fix**: (1) `FormSelection.js` — icon dropdown/X của Autocomplete lệch ra ngoài khung input (do `sx` cũ có `top: "auto"` sai, đổi thành `top: "50%", transform: "translate(0,-50%)"`), ảnh hưởng MỌI Autocomplete trong app (取引先, dòng 商品 trong bảng...). (2) `index.css` — `html { font-size: 24px }` toàn cục bị input MUI kế thừa qua `font: inherit`, làm vỡ khung tính padding/height mặc định MUI, lộ rõ nhất ở dialog "フィールド追加" (`KeywordBuilder.jsx`, field 順序/最大文字数 lệch chữ) — fix scoped bằng `.MuiInputBase-input, .MuiInputBase-root { font-size: 16px !important; }` + `:not(.MuiInputBase-input)` trên rule cũ, không đụng cỡ chữ 24px của form kiểu cũ ở chỗ khác. Chi tiết xem devlog phần "Chạy demo cho user browse + fix layout bug".
- Menu **案件管理**/**書類管理** trong Sidebar đã ẩn theo yêu cầu — code JSX được **comment out** (không xoá) trong `Sidebar.js` để dễ bật lại sau này.

**Code đã push lên GitHub** (`origin/main`, repo `order-procurement-dx`, commit `ac28bf9`, 2026-07-31) — gồm toàn bộ dynamic-field engine + các fix layout + đổi UI trên.

Backend **đang chạy nền** ở cổng **5178** (production-style: `--no-launch-profile`, serve cả API lẫn frontend build tĩnh từ `wwwroot`) + có **ngrok tunnel public** đang mở (xem mục "Demo đã publish qua ngrok" bên dưới để biết chi tiết + bug đã fix) — chưa dừng, dừng khi user xác nhận xong việc. Secret (Jwt/AWS/Anthropic) lưu qua `dotnet user-secrets` (không nằm trong `appsettings.json` đang track git, vì repo này cũng public).

Artifact User Guide/demo script (KHÔNG nằm trong git, chỉ tồn tại trên claude.ai) — xem link MỚI NHẤT ở mục "Artifact User Guide đã đổi sang bản MỚI" bên dưới, KHÔNG dùng link cũ nữa.

**Golden demo-data snapshot + reset (mới, 2026-08-02)**: database dùng cho backend Development KHÔNG phải LocalDB mà là SQL Server instance mặc định trên máy (`Data Source=.` trong `appsettings.Development.json`, ghi đè `appsettings.json` vốn trỏ LocalDB — 2 config khác connection string, dễ nhầm khi tự query bằng `sqlcmd`, luôn check `appsettings.Development.json` trước). Vì demo tương tác qua UI thật (bấm 支払済み, 入荷登録...) sẽ làm thay đổi data vĩnh viễn khiến demo scenario/script không còn đúng nữa lần sau, đã tạo cơ chế backup/restore toàn bộ DB thay vì viết undo logic tay cho từng thao tác:
- `scripts/snapshot-demo-data.ps1` — `BACKUP DATABASE` toàn bộ `CaseMngmt` ra file `.bak` (mặc định lưu ở thư mục backup mặc định của SQL Server, `C:\Program Files\Microsoft SQL Server\MSSQL17.MSSQLSERVER\MSSQL\Backup\CaseMngmt_DemoBaseline.bak` — KHÔNG lưu trong repo vì là binary/runtime data). Chạy lại khi muốn cập nhật baseline mới.
- `scripts/reset-demo-data.ps1` — dừng process `CaseMngmt.Server` đang chạy nền, `RESTORE DATABASE` đè lại từ baseline, rồi user tự khởi động lại backend. Restore toàn bộ file nên đảm bảo reset đúng 100% mọi bảng (tồn kho, trạng thái thanh toán, receipt...) mà không cần đoán từng thay đổi.
- Baseline đầu tiên đã chụp ngày 2026-08-02, đúng lúc PO-2026-00020 đang ở trạng thái "sẵn sàng demo" (đã revert thủ công `PINV-2026-00017` từ `Paid` về `Recorded`/`PaidDate=NULL` qua SQL trước khi backup, vì app không có nút "hủy thanh toán"). Data "Test"-prefix (TestSupplier1, Test Attach Supplier, TestPartX, TestCustomer1) phát hiện lẫn trong DB đã kiểm tra và xác nhận **đã soft-delete từ trước** (`Deleted=1`), không cần dọn thêm — không hiện trong app.
- PO-2026-00020 hiện có tình huống **2 invoice cho cùng 1 PO** (PINV-2026-00016 + PINV-2026-00017, mỗi cái ¥28,000, PO chỉ ¥28,000) — đây chính là nguyên nhân demo 金額不一致の警告 trong 三者照合, giữ nguyên trong baseline vì là ví dụ thật hữu ích để demo cảnh báo mismatch.
- **Cập nhật 2026-08-02 (phiên sau)**: baseline đã được snapshot LẠI sau khi tắt `documentSearchable` cho 3 field案件 cũ (取引先名/注文日/金額 — xem mục 書類管理 bên dưới) — nếu baseline còn cũ hơn, `reset-demo-data.ps1` sẽ vô tình bật lại 3 field đó.

---

**書類管理 (document management) — overhaul lớn (2026-08-02)**: đã làm 2 phần chính, cả 2 đã test qua API thật + Playwright:
- **Phần A + B (tìm kiếm)**: thêm field cố định (発注日/受注日/取引先/仕入先, áp dụng cho cả 5 loại `Order`/`Invoice`/`PurchaseOrder`/`PurchaseInvoice`/`GoodsReceipt`) VÀ field bổ sung qua template (đã fix `EntityKeywordRepository.GetDocumentFilesAsync` để group-by-entity + match KeywordValues giống hệt pattern `CaseKeywordRepository.GetDocumentsAsync`, thêm switch "文書検索対象" còn thiếu trong `KeywordBuilder.jsx`, gộp field bổ sung từ mọi module vào `/api/document/template`). Phát hiện + fix 1 bug thật: khi mix keyword của nhiều module trong 1 request, `.All()` matching sẽ vô tình zero-out kết quả của module kia — đã fix bằng cách partition theo module trước khi query.
- **Cột định danh record** (`対象レコード`): thêm `EntityDisplayName` vào kết quả search, lấy từ `BaseModel.Name` (đã luôn được gán = số chứng từ lúc tạo record, xác nhận qua toàn bộ 5 `*Service.cs`).
- Đã bổ sung `PurchaseInvoiceService`/`GoodsReceiptService` custom-field support (trước đây chỉ có `Order`/`PurchaseOrder`).
- **Đã tắt field案件 cũ khỏi 書類管理** (`取引先名`/`注文日`/`金額`, set `documentSearchable=false`) theo yêu cầu vì 案件管理 không còn dùng — đã snapshot baseline mới để giữ trạng thái này.
- **3 vấn đề còn lại CHƯA làm** (đã ghi nhận, ngoài phạm vi phiên này): #2 phân trang bỏ sót tài liệu entity sau trang 1 (`DocumentController.cs` chỉ gộp entity docs ở `PageNumber<=1`), #3 tài liệu của案件 đã đóng (`Status != "Open"`) bị ẩn khỏi kết quả, #5 tài liệu `Invoice` (bán hàng) không có nút "詳細表示" vì không có `InvoiceDetail.js`.

**Test module 仕入れ qua UI thật (2026-08-02) — PASS toàn bộ, không phát hiện bug**: đã test qua Playwright+Edge thật (không chỉ curl) cả 6 phase: 仕入先登録, 発注登録, 三者照合 (đủ 4 trạng thái chuyển đúng), 発注書発行+lịch sử, 入荷登録(tồn kho cộng đúng), 仕入請求書+支払い確認, 発注提案→"発注書を作成" pre-fill (verify bằng giá trị input thật, không chỉ page text), và cả 2 luồng AI upload (発注アップロード đọc 見積書, 入荷アップロード đọc 納品書 — ảnh test sinh bằng PowerShell `System.Drawing`, gọi Claude thật). Đã dọn sạch data test + reset về baseline sau khi xong.

**Demo đã publish qua ngrok (2026-08-02)**: build production (`npm run build` → mirror `wwwroot`) + backend chạy port 5178 (`ASPNETCORE_ENVIRONMENT=Development dotnet run --no-launch-profile --urls http://localhost:5178`) + `ngrok http 5178`. Phát hiện + fix 1 bug thật lúc publish: `frontend/.env.production` có `REACT_APP_BASE_URL` trỏ tới 1 IP production CŨ không liên quan (`54.250.117.30`, sót lại từ repo gốc) — bản build production trước đó gọi nhầm sang IP đó khiến login treo im lặng. Đã sửa thành rỗng (relative/same-origin) — **fix này CHƯA commit**, xem file `frontend/.env.production`. URL ngrok đổi mỗi lần restart (không có static domain), xem devlog/lịch sử chat gần nhất nếu cần biết URL đang sống.

**Artifact User Guide đã đổi sang bản MỚI (2026-08-02)**: `https://claude.ai/code/artifact/945d5a20-2d36-473c-8271-59348f271b81` (tiêu đề "受注・仕入 業務管理システム ご利用ガイド") — bản CŨ (`d6ac3e4c-...`) chỉ có phía 受注, đã lỗi thời. Bản mới có đủ cả 仕入れ (8 tính năng, tách rõ AI thật ①-⑥ vs tự động hoá không-AI ⑦⑧), status label tiếng Nhật khớp UI, demo script Part A/B đã verify khớp 100% dữ liệu baseline hiện tại.

---

Ngoài hệ thống Case/Template gốc mô tả bên dưới, project đã được mở rộng thành nền tảng **受注業務DX** (order-processing) cho SME sản xuất Nhật Bản, dùng để demo bán hàng. Toàn bộ 6 bước của flow đã triển khai và test qua API/UI thật:

`受注 → データ化 → AI照合 → 請求作成 → 売上分析 → 経営判断`

- **受注 (Order/OrderItem)**: module quan hệ riêng (`CaseMngmt.Model/Orders/`), KHÔNG dùng EAV Case/Keyword. FK thật tới Customer, `OrderNumber` tự sinh. 受注検索 có 検索条件 (取引先, 受注日 range) + cột **AI照合** hiện risk level tệ nhất của từng đơn.
- **Product/tồn kho** (`CaseMngmt.Model/Products/`): `StockQuantity`, `ProductionCapacityPerDay`, CRUD admin. `StockQuantity` **trừ thật** khi 1 đơn được xuất請求書 (Invoiced) — trước đó (Confirmed/RiskFlagged) chỉ tính "đang giữ chỗ" động, không trừ thật.
- **データ化**: `IAiOrderExtractionService` — Claude vision (forced tool-call) đọc ảnh/PDF đơn hàng → trả draft chưa lưu DB → `OrderIntakeUpload.js` cho duyệt trước khi confirm lưu.
- **AI照合**: `IAiMatchingService` — risk level tính deterministic bằng C# (`item.Quantity` so với `StockQuantity - GetCommittedQuantitiesAsync(đơn khác chưa Invoiced)`, không còn tính đơn độc lập gây double-count), Claude chỉ enrich giải thích tiếng Nhật (forced tool-call). Entity `OrderRiskLineResult`. Tự chạy khi confirm order.
- **請求作成**: entity `Invoice`, PDF qua QuestPDF (font MS Gothic), chặn tạo invoice từ order `RiskFlagged` (409 theo convention `-1`), trừ `Product.StockQuantity` khi tạo thành công. 請求書管理 có 検索条件 (取引先, ステータス, 発行日 range).
- **売上分析**: `DashboardService.GetSummaryAsync` (LINQ thuần, không entity mới) + `SalesDashboard.js`.
- **経営判断**: `IDashboardCommentService` — dashboard AI comment (headline/highlights/recommendation tiếng Nhật, forced tool-call), không lưu DB, endpoint trả 204/ẩn lặng lẽ nếu lỗi.
- **Chat AI**: `IChatAssistantService` — trợ lý hỏi-đáp read-only qua **agentic tool-use loop thật** (`while stop_reason == "tool_use"`, khác các service khác chỉ gọi Claude 1 lần với forced tool-call), 4 tool (dashboard/orders/products/invoices). `companyId` luôn lấy server-side từ JWT, không bao giờ nhận từ input Claude. Lịch sử chat KHÔNG lưu DB (chỉ React state, mất khi refresh).

Toàn bộ AI feature dùng chung `AnthropicClient` (`CaseMngmt.Service/Ai/AnthropicClient.cs`), model `claude-opus-4-8`, API key qua `dotnet user-secrets` (KHÔNG trong appsettings.json).

---

### Module 仕入れ (procurement/supplier) — mới, 2026-08-01

Đối xứng với 受注業務DX ở trên nhưng cho chiều mua hàng, dành cho khách hàng mục tiêu là 卸売・流通業 (bán buôn/lưu thông) chứ không phải 製造業 (sản xuất) — quyết định chiến lược từ góp ý chuyên gia tư vấn (bác Sugimoto), xem `docs/devlog/2026-08-01.md` đầu file để biết bối cảnh đầy đủ. Vòng lặp cốt lõi đơn giản, KHÔNG mô hình hoá chuỗi công đoạn gia công như sản xuất:

`仕入先管理 → 発注 → 入荷（tồn kho cộng thật) → 仕入請求書・三者照合`, cộng thêm `発注提案`（AI chủ động）và AI đọc chứng từ (見積書/納品書).

- **Supplier** (`CaseMngmt.Model/Suppliers/`): thông tin công ty + địa chỉ (mirror `Customer`) + điều khoản thanh toán kiểu Nhật cố định trên entity: `ClosingDay`(締め日, int, 99=月末), `PaymentCycleMonths`(支払サイト tháng), `PaymentDay`(支払日, cùng convention 99=月末). Dùng dynamic-field (`EntityType="Supplier"`) cho field bổ sung.
- **PurchaseOrder/PurchaseOrderItem** (`CaseMngmt.Model/PurchaseOrders/`): mirror `Order`/`OrderItem`, đánh số `PO-{year}-{seq:D5}`. Status `Draft→Confirmed→(PartiallyReceived↔nhận thêm)→Received`, `Cancelled` — **không có `RiskFlagged`** (không có nguồn dữ liệu đánh giá độ tin cậy supplier, khác với đánh giá tồn kho của chính mình cho Order). `PurchaseOrderItem.ReceivedQuantity` là cột cố định (cộng dồn qua các lần nhận hàng), không đưa vào EAV vì có logic nghiệp vụ thật.
- **GoodsReceipt/GoodsReceiptItem** (`CaseMngmt.Model/GoodsReceipts/`): 1 PurchaseOrder : nhiều GoodsReceipt (hỗ trợ giao hàng nhiều đợt). `GoodsReceiptService.CreateAsync` **cộng thật** `Product.StockQuantity` — đối xứng với `InvoiceService` trừ kho, nhưng atomic hơn: mutate trực tiếp entity đã tracked (PurchaseOrder/PurchaseOrderItem/Product cùng load qua 1 DbContext) rồi để 1 lệnh `AddAsync` cuối cùng persist tất cả trong 1 SaveChanges. Cảnh báo (không chặn) nếu nhận thừa so với đặt.
- **PurchaseInvoice** (`CaseMngmt.Model/PurchaseInvoices/`): header-only (không có line item, giống `Invoice`), snapshot tiền từ `PurchaseOrder`. `DueDate` tính 1 lần lúc tạo từ điều khoản Supplier (`IssueDate + PaymentCycleMonths + PaymentDay`, KHÔNG mô hình hoá cutoff-cycle của `ClosingDay` — đơn giản hoá đã ghi rõ trong plan). `PaidDate` tách riêng `Status` để phục vụ đối chiếu.
- **三者照合 (đối chiếu 3 chiều)**: `PurchaseOrderService.GetReconciliationAsync` (`GET /api/PurchaseOrder/{id}/reconciliation`) — checklist 4 bước 発注済み/入荷済み/請求受領済み/支払済み + cờ `HasAmountMismatch` (chỉ báo khi đã nhận đủ hàng, tránh báo sai lúc supplier chưa bill hết). Hiển thị dạng Chip nhúng trong `PurchaseOrderDetail.js`. Khi `hasAmountMismatch=true`, giờ hiện thêm (2026-08-02): (1) số tiền chênh lệch tường minh (超過/不足), (2) bảng liệt kê từng invoice liên quan (số/tiền/trạng thái) kèm nút "詳細" mở thẳng `PurchaseInvoiceDetail` trong `ContentDialog` lồng nhau (không cần tự chuyển sang menu 仕入請求書管理) — đóng dialog con sẽ tự refresh lại reconciliation của PO cha. `PurchaseInvoiceSearch.js` cũng đã có thêm field tìm theo 仕入請求書番号 (`purchaseInvoiceNumber`, `Contains` filter, xuyên suốt Controller/Service/Repository).
- **発注提案 (AI đề xuất đặt hàng chủ động)**: `AiReorderSuggestionService` (`CaseMngmt.Service/ReorderSuggestions/`) — mirror pattern `AiMatchingService`: **C# tính xác định 100%** (tốc độ tiêu thụ từ `OrderItem` lịch sử 90 ngày, hệ số mùa vụ so cùng tháng năm trước có clamp 0.3~3.0, lead time supplier từ lịch sử PurchaseOrder→GoodsReceipt, số lượng/thời điểm đề xuất), Claude chỉ sinh phần giải thích tiếng Nhật cho sản phẩm nhóm `UrgentReorder`/`PlanAhead`. Không entity/migration mới, kết quả tính live mỗi lần gọi `GET /api/ReorderSuggestion` (không persist, giống `DashboardCommentService`). Frontend `ReorderSuggestions.js` có nút "発注書を作成" pre-fill `PurchaseOrderDetail.js` qua prop `initialData` mới (người dùng vẫn phải xác nhận thủ công mới lưu — nguyên tắc "AI chỉ đề xuất" áp dụng nhất quán).
- **AI đọc 見積書/納品書**: `AiProcurementExtractionService` (`CaseMngmt.Service/Ai/`, 1 service chung 2 method `ExtractPurchaseOrderAsync`/`ExtractGoodsReceiptAsync`) mirror `AiOrderExtractionService` — áp dụng sẵn 2 bài học từ phiên trước (giữ confidence thay vì bỏ trống khi chữ không rõ, backfill `UnitPrice` từ product master). `ExtractGoodsReceiptAsync` nhận thêm `purchaseOrderId?` để ưu tiên khớp `PurchaseOrderItemId` cụ thể trong PO đã chọn. Frontend `PurchaseOrderIntakeUpload.js`/`GoodsReceiptIntakeUpload.js` mirror 2 giai đoạn upload→review của `OrderIntakeUpload.js`.
- **発注書発行・送付履歴 (mới, 2026-08-02)**: sinh PDF 発注書 chính thức + lưu vào hệ thống + log lịch sử phát hành, tách biệt khỏi bản ghi 新規発注 nội bộ — theo góp ý nghiên cứu thực tế SME 卸売業 Nhật (FAX/Email vẫn là kênh chủ đạo, EDI ngoài tầm SME). Entity mới `PurchaseOrderIssuance` (`CaseMngmt.Model/PurchaseOrders/`, bảng lịch sử ĐẦU TIÊN trong toàn hệ thống — trước đó chưa có precedent nào dạng audit-log): `PurchaseOrderId`, `IssuedDate`, `Channel` (FAX/Email/郵送/その他, do nhân viên tự chọn — KHÔNG tự động gửi thật vì `Supplier` chưa có field email/fax), `Note`, `FileName`, `IssuedBy`. `PurchaseOrderService.IssueAsync` mirror 1:1 pattern `InvoiceService.AttachGeneratedPdfAsync` (QuestPDF `PurchaseOrderPdfService`, font MS Gothic, tái dùng `InMemoryFormFile` từ namespace `CaseMngmt.Service.Invoices` — không di chuyển file, chỉ reference — rồi `EntityKeywordService.AddFileToEntityKeywordAsync` với `EntityType="PurchaseOrder"`, Type `"発注書"` đã seed sẵn từ đầu dự án). **Mỗi lần phát hành = 1 PDF snapshot riêng** (filename có timestamp, không ghi đè) — an toàn bằng chứng nếu PO bị sửa sau khi đã gửi. UI trong `PurchaseOrderDetail.js`: nút "発注書を発行する" mở form nhỏ (送付方法/備考) + bảng lịch sử ngay bên dưới; PDF tự hiện trong `AttachedFilesList`/書類管理 sẵn có (không cần logic tải file riêng). Endpoint: `POST/GET /api/PurchaseOrder/{id}/issue|issuances`.
- **4 mảnh còn thiếu so với thực tế SME 卸売業** (ghi nhận từ nghiên cứu user, CHƯA làm): 支払管理/支払予定 (tổng hợp hoá đơn sắp đến hạn nhiều Supplier — nền tảng đã có qua `PurchaseInvoice.DueDate`/三者照合), 仕入先別単価マスタ (đơn giá đã thoả thuận riêng để so khi nhận invoice), 発注変更/キャンセル (PO có `Cancelled` nhưng chưa có flow sửa sau khi Confirmed), 仕入返品/値引き (chưa có entity nào).

Menu Sidebar "仕入れ管理" (mở rộng được): 仕入先検索/仕入先登録/発注検索/発注登録/発注アップロード（AI）/入荷検索/入荷登録/入荷アップロード（AI）/発注提案/仕入請求書管理.

**Lưu ý quan trọng khi thêm migration mới**: golden demo snapshot (`CaseMngmt_DemoBaseline.bak`, xem mục snapshot/reset bên trên) chụp CẢ schema lẫn data — sau khi chạy migration mới làm đổi schema, PHẢI chạy lại `scripts/snapshot-demo-data.ps1` để cập nhật baseline, nếu không lần `reset-demo-data.ps1` tiếp theo sẽ RESTORE schema CŨ (trước migration), xoá mất bảng/cột vừa thêm. Trên máy hiện tại, `powershell.exe` chặn script theo execution policy mặc định — chạy `powershell -ExecutionPolicy Bypass -File scripts\...` thay vì gọi thẳng.

**Đã test chức năng thật cho cả 6 phase** (curl qua API thật, gồm cả gọi Claude thật cho Phase 4 và Phase 6 — Phase 6 dùng ảnh 見積書/納品書 tổng hợp bằng PowerShell `System.Drawing` vì không có ảnh mẫu thật) — xem `docs/devlog/2026-08-01.md` để biết kết quả chi tiết từng phase. **CHƯA test qua UI thật** (Playwright/browser) — khác với dynamic-field engine đã test đầy đủ qua UI ở phiên 2026-07-31.

**Build health (2026-08-01)**: `dotnet build` (backend) và `npm run build`/dev server (frontend) đều pass, không lỗi, trên repo này (`order-procurement-dx`). Đã verify thêm bằng cách chạy backend thật với LocalDB (`dotnet run`) sau MỖI phase của module 仕入れ — 4 migration mới (`AddSupplierModule`, `AddPurchaseOrderModule`, `AddGoodsReceiptModule`, `AddPurchaseInvoiceModule`, cộng 2 migration cũ `AddTemplateModuleType`/`AddEntityKeywordTable` từ 2026-07-31) đều áp dụng sạch, không lỗi. Lưu ý: `dotnet build` sẽ báo lỗi file-lock (MSB3027) trong lúc backend đang chạy nền (`dotnet run`) — không phải lỗi code, chỉ cần dừng process đang chạy trước khi build lại (`Stop-Process -Name CaseMngmt.Server -Force`).

**Demo/chia sẻ ra ngoài**: hiện **không có demo nào đang chạy sống** (đã dừng bản demo cũ chạy từ `case-management`). Khi cần dựng lại demo: `npm run build` (frontend) → mirror vào `wwwroot` (`robocopy ... /MIR`) → chạy backend với `--no-launch-profile` (né SpaProxy cũ trỏ thư mục không tồn tại) → `ngrok http 5178`. URL ngrok đổi mỗi lần restart trừ khi có static domain đã đặt riêng — xem devlog gần nhất để biết URL hiện tại nếu có.

**Ghi chú môi trường quan trọng**: `git`, `ngrok`, và `gh` (GitHub CLI) đều **đã cài** qua winget và đã `gh auth login` thành công (account `jinaomi`) — dùng được cho việc tạo/push repo. **`dotnet` CLI đã có trên máy** (`C:\Program Files\dotnet\dotnet.exe`, SDK 10.0.302, chạy build/restore/user-secrets bình thường — thông tin "dotnet CLI không có trên máy" ở mục "Môi trường phát triển" bên dưới đã LỖI THỜI, xem ghi chú tại đó). PATH KHÔNG tự refresh giữa các lần gọi PowerShell tool (mỗi lệnh là tiến trình mới, phải tự nạp lại `$env:PATH` từ registry Machine+User trước khi gọi `git`/`ngrok`/`gh`). ngrok từng bị Windows Defender quarantine ngay khi tự update — đã fix bằng cách user thêm Defender exclusion cho `%LOCALAPPDATA%\Microsoft\WinGet\Packages`.

## Next Steps

0. ~~Redesign giao diện: review + commit + merge~~ — **DONE 2026-08-04**, đã merge `feature/ui-redesign` vào `main`, giao diện mới giờ là chính thức. Giao diện cũ đóng băng ở branch `ui-legacy` (xem Current State). **Còn treo**: build lại production + cập nhật demo ngrok đang chạy (hiện vẫn phục vụ bản build cũ từ trước redesign) — cần user xác nhận trước khi rebuild+redeploy demo sống.
1. ~~Test module 仕入れ qua UI thật~~ — **DONE 2026-08-02**, PASS toàn bộ qua Playwright thật, không phát hiện bug. Xem mục "Test module 仕入れ qua UI thật" phía trên.
2. ~~Dọn dữ liệu test~~ — đã kiểm tra 2026-08-02: các bản ghi tên bắt đầu "Test" (TestSupplier1, Test Attach Supplier, TestPartX, TestCustomer1) đã ở trạng thái `Deleted=1` từ trước, không hiện trong app, không cần dọn thêm.
3. Search/filter theo giá trị custom field trên `ProductSearch.js`/`OrderSearch.js`/`SupplierSearch.js` (cố ý để ngoài phạm vi các phiên vừa rồi).
4. Cân nhắc tách tài nguyên AWS riêng (S3 bucket/IAM) cho repo này — hiện AWS key trong `dotnet user-secrets` là key thật đang dùng CHUNG với `case-management` production (bucket `case-bucket-ap-northeast`), chưa tách riêng.
5. Quyết định có triển khai RAG hay không (hướng mở rộng AI thứ 3 đã thảo luận trước đây), hoặc chuyển sang các việc treo khác.
6. Excel import cho Product (`ClosedXML`) — nguồn dữ liệu tồn kho thực tế của SME hiện quản lý bằng Excel.
7. Nâng cấp đánh số `OrderNumber`/`InvoiceNumber`/`PurchaseOrderNumber`/`GoodsReceiptNumber`/`PurchaseInvoiceNumber` từ COUNT-based sang sequence table atomic trước khi chạy production thật (rủi ro concurrency hiện tại chấp nhận được cho demo, không cho production).
8. ~~Cải thiện giao diện màn hình login~~ — **DONE 2026-08-03**, viết lại bằng MUI Card/TextField/Alert theo theme mới, xem mục "Redesign toàn bộ giao diện" phía trên.
9. **[Ghi nhận 2026-08-02, chưa làm]** Kiểm tra lại テンプレート管理 — hiện đang lộn xộn: (a) `テンプレート名` hiện tên tiếng Anh (vd "PurchaseOrder Template"), nên đổi hiển thị sang tiếng Nhật; (b) `フィールド数` hiển thị SAI — vd template PurchaseOrder ghi 11 field nhưng vào `フィールド管理` thực tế chỉ thấy 2 field, cần tìm nguyên nhân (có thể đang đếm nhầm field đã `IsHidden`/`Deleted`, hoặc đếm cả field-đính-kèm-file `IsShowOnTemplate=false`).
10. ~~Đổi text "受注管理システム" trong Sidebar~~ — **DONE 2026-08-03**, đổi thành "受注・仕入 業務管理システム" ở branding đầu Drawer + tab title + favicon.
11. **[Ghi nhận 2026-08-02, chưa làm]** Tạo thêm demo data, đặc biệt là **documents/tài liệu đính kèm** — hiện vào 書類管理 tìm kiếm chỉ ra vỏn vẹn 2 kết quả, quá ít để demo tính năng tìm kiếm/lọc cho thuyết phục.
12. **[Ghi nhận 2026-08-02, chưa làm]** 経営ダッシュボード (`SalesDashboard.js`/`DashboardService`) hiện CHỈ tổng hợp phía 受注 (bán hàng) — chưa có phần tổng hợp/AI comment cho phía 仕入れ (mua hàng: 発注 tồn đọng, 仕入請求書 sắp đến hạn, v.v.). Cân nhắc mở rộng dashboard hoặc thêm dashboard riêng cho 仕入れ.
13. **[Ghi nhận 2026-08-02, chưa làm]** AIチャット (`ChatAssistant`) — thêm sẵn vài câu hỏi gợi ý (suggested prompts) để người dùng bấm chọn thay vì phải tự gõ, giảm rào cản dùng thử lần đầu.
14. **[Ghi nhận 2026-08-02, chưa làm]** 3 vấn đề còn lại của 書類管理 (đã audit kỹ, xem mục "書類管理 — overhaul lớn" phía trên): #2 phân trang bỏ sót tài liệu entity sau trang 1, #3 tài liệu của案件 đã đóng bị ẩn khỏi kết quả, #5 tài liệu `Invoice` (bán hàng) không mở được record nguồn vì chưa có `InvoiceDetail.js`.
15. Commit fix `frontend/.env.production` (xoá IP production cũ hardcode, đổi thành rỗng/relative) — đã sửa và test qua ngrok thành công 2026-08-02 nhưng **CHƯA commit**, cần user xác nhận.

Các next-step khác liên quan riêng tới `case-management` gốc (rotate AWS key hardcode trong repo đó, thêm `*.log` vào `.gitignore` gốc...) — không còn thuộc phạm vi làm việc, xem `docs/devlog/2026-07-31.md` nếu cần biết chi tiết.

---

## Tổng quan hệ thống

CaseMngmt là hệ thống quản lý hồ sơ/case **đa tenant** (multi-tenant).
- **Backend**: ASP.NET Core 6.0 Web API + Entity Framework Core + SQL Server
- **Frontend**: React 17 (JavaScript/JSX) + Material UI v5 + Axios
- **Auth**: ASP.NET Identity + JWT Bearer token
- **Deployment**: Backend serve cả static frontend (SPA)

---

## Kiến trúc Backend

### Cấu trúc project (4 layer)

```
CaseMngmt.Model/          → Entities, ViewModels, DTOs, Migrations, AutoMapper, DbContext
CaseMngmt.Repository/     → Data access: IXxxRepository + XxxRepository (EF Core)
CaseMngmt.Service/        → Business logic: IXxxService + XxxService
CaseMngmt.Server/         → ASP.NET Core: Controllers, Program.cs, DbInitializerExtension
```

### Quy tắc layer (BẮT BUỘC)

- Controller chỉ gọi Service — không chứa business logic
- Service chỉ gọi Repository — không gọi DbContext trực tiếp
- Repository gọi DbContext — không có business logic
- API không trả Entity trực tiếp — luôn qua ViewModel/DTO + AutoMapper

### BaseModel

Tất cả entity kế thừa `BaseModel`:
```csharp
Id          Guid        // auto = Guid.NewGuid()
Name        string
CreatedDate DateTime    // auto = DateTime.UtcNow
UpdatedDate DateTime    // auto = DateTime.UtcNow
CreatedBy   Guid
UpdatedBy   Guid
Deleted     bool        // soft-delete toàn hệ thống
```

### Các module chính

| Module | Repository | Service | Controller | Ghi chú |
|---|---|---|---|---|
| Company | ICompanyRepository | ICompanyService | CompanyController | Tự động clone Standard Template khi tạo mới |
| Template | ITemplateRepository | ITemplateService | TemplateController | IsDefault=true là Standard Template |
| Keyword | IKeywordRepository | IKeywordService | KeywordController | Form Builder fields |
| Case | ICaseRepository | ICaseService | CaseController | Hồ sơ chính |
| CaseKeyword | ICaseKeywordRepository | ICaseKeywordService | — | Junction: Case ↔ Keyword |
| CompanyTemplate | ICompanyTemplateRepository | ICompanyTemplateService | — | Junction: Company ↔ Template |
| Type | ITypeRepository | ITypeService | TypeController | Kiểu dữ liệu cho Keyword |
| Customer | ICustomerRepository | ICustomerService | CustomerController | |
| KeywordRole | IKeywordRoleRepository | IKeywordRoleService | — | Phân quyền theo field |

### Authentication & Authorization

- JWT Bearer token — `[Authorize(AuthenticationSchemes = "Bearer")]` trên toàn controller
- Claims trong token: `ClaimTypes.NameIdentifier` (userId), `CompanyId` (custom claim), `ClaimTypes.Role`
- Role-based: `[ClaimRequirement(ClaimTypes.Role, "SuperAdmin")]` cho write operations
- Roles: `SuperAdmin`, `Admin`, `Editor`, `User`
- Lấy companyId trong controller: `User?.FindFirst("CompanyId")?.Value`

### Multi-tenant Design

- Mọi query phải scope theo `CompanyId` — không bao giờ trả dữ liệu của company khác
- Template và Company liên kết qua `CompanyTemplate` (junction table, composite key `CompanyId + TemplateId`)
- Keyword thuộc Template, không có CompanyId trực tiếp

### Các Entity quan trọng

**Template**
```csharp
IsDefault   bool    // true = Standard Template dùng để clone cho company mới
                    // Chỉ có đúng 1 record IsDefault=true trong toàn hệ thống
```

**Keyword**
```csharp
TypeId      Guid    // FK → Type.Id (Admin chọn từ Type có sẵn, KHÔNG dùng enum)
TemplateId  Guid
IsHidden    bool    // soft-delete cho Form Builder — ẩn khỏi UI nhưng giữ CaseKeyword data
Deleted     bool    // hard soft-delete — ẩn khỏi mọi nơi (từ BaseModel)
OptionsList string? // pipe-separated options, e.g. "選択肢A|選択肢B|選択肢C", max 2000 chars
Order       int
```

**Type**
```csharp
Value           string  // "alphanumeric", "date", "number", "list", v.v.
IsDefaultType   bool    // true = type hệ thống (seeded), false = custom list type
IsFileType      bool    // true = loại file (dùng riêng cho document)
Metadata        string  // comma-separated options (legacy, cho BOAT types)
```

**CompanyTemplate** (junction, không kế thừa BaseModel)
```csharp
CompanyId   Guid    // composite PK
TemplateId  Guid    // composite PK
```

### Return value convention (Repository → Service → Controller)

| Giá trị | Ý nghĩa |
|---|---|
| `> 0` | Thành công (số rows affected) |
| `0` | Thất bại / không tìm thấy |
| `-1` | Business rule violation (ví dụ: soft-delete keyword đang được dùng) |

Controller map:
- `-1` → `Conflict(409)`
- `0` → `BadRequest(400)`
- `null` → `NotFound(404)`

### AutoMapper (CustomProfile.cs)

AutoMapper convention tự map property cùng tên. Chỉ cần explicit mapping khi:
- Bỏ qua `Id` khi map Request → Entity: `.ForMember(x => x.Id, opt => opt.Ignore())`
- Property tên khác nhau giữa source và destination

Namespace: `CaseMngmt.Models.AutoMapper.CustomProfile`

### Migration

- Tạo migration file **thủ công** theo pattern EF Core (đây vẫn là cách chính, kể cả khi `dotnet-ef` đã có sẵn — xem ghi chú dưới)
- Namespace migration: `CaseMngmt.Models.Migrations`
- Tên class phải match tên file, kế thừa `Migration`, có `Up()` và `Down()`
- **Mỗi migration `.cs` cần 1 file `.Designer.cs` đi kèm** mang `[DbContext(typeof(ApplicationDbContext))]` + `[Migration("id")]` (id = tên file không có đuôi `.cs`) — **thiếu file này thì `db.Database.Migrate()` sẽ ÂM THẦM coi migration là đã áp dụng** (không báo lỗi lúc start), rồi crash runtime khi query/insert cột mới (`Invalid column name`). `BuildTargetModel(ModelBuilder modelBuilder) { }` để RỖNG là đủ — đây là pattern đã có sẵn trong repo (vd `20260529000001_AddIsHiddenForUser.Designer.cs`), không cần snapshot đầy đủ.
- Cột NOT NULL mới: **bắt buộc có `defaultValue`** để an toàn với data hiện có
- Sau khi tạo migration: cập nhật `ApplicationDbContextModelSnapshot.cs` thủ công (thêm property block + relationship block theo đúng vị trí — xem migration `AddEntityKeywordTable`/`AddTemplateModuleType` làm ví dụ)
- Auto-apply khi startup: `db.Database.Migrate()` trong `Program.cs` (đã có sẵn)
- **Đã thử `dotnet ef migrations add`** (2026-07-31) để tự sinh Designer.cs: THẤT BẠI vì snapshot hiện tại của repo có 1 lỗi tiềm ẩn không liên quan (`Order.OrderItems` navigation lỗi khi tooling load — do lịch sử migration toàn viết tay, chưa từng qua `dotnet ef`) — chưa sửa bug đó (ngoài phạm vi), vẫn ưu tiên viết tay theo pattern ở trên.

### Seed data (DbInitializerExtension)

- Guard pattern: kiểm tra tồn tại trước khi insert (idempotent)
- Standard Template seed: `context.Template.Any(t => t.IsDefault)` làm guard
- Seed chạy cho cả install mới và install cũ (existing data)
- Types được seed với tên tiếng Anh + IsDefaultType=true

---

## Kiến trúc Frontend

### Cấu trúc thư mục

```
frontend/src/
  api/axios.js              → axios instances (default + axiosPrivate)
  hooks/
    useAxiosPrivate.js      → JWT interceptor — luôn dùng hook này cho authenticated calls
    useAuth.js              → auth context
    useRefreshToken.js
  context/AuthProvider.js   → JWT context provider
  services/                 → API wrappers (nhận axiosPrivate làm param đầu)
    templateService.js
    keywordService.js
    typeService.js
  pages/
    admin/
      TemplateList.jsx      → /admin/templates
      KeywordBuilder.jsx    → /admin/templates/:templateId/keywords
  components/
    Admin.js                → Admin landing page
    CaseDetail.js           → Tạo/xem hồ sơ
    CaseSearch.js           → Tìm kiếm hồ sơ
    until/                  → Reusable UI components
      FormSnackbar.js       → Alert/notification (prop: item, setItem)
      LoadingSpinner.js     → Backdrop spinner (prop: loading)
      ConfirmBox.js         → Confirm dialog
      ContentDialog.js, DialogHandle.js, FormButton.js, ...
  App.js                    → Routes
  index.js
```

### Routing (App.js)

Tất cả route cần auth nằm trong `RequireAuth` block với `allowedRoles`:
```jsx
<Route element={<RequireAuth allowedRoles={[ROLES.Admin, ROLES.User, ROLES.SuperAdmin]} />}>
  <Route path="admin" element={<Admin />} />
  <Route path="/admin/templates" element={<TemplateList />} />
  <Route path="/admin/templates/:templateId/keywords" element={<KeywordBuilder />} />
</Route>
```

### useAxiosPrivate — Quy tắc BẮT BUỘC

```js
// ✅ ĐÚNG — dùng hook để có interceptor
const axiosPrivate = useAxiosPrivate();
const data = await axiosPrivate.get('/api/...');

// ❌ SAI — import trực tiếp, mất JWT interceptor
import { axiosPrivate } from '../api/axios';
```

### Service pattern

Service file export default object, nhận `axiosPrivate` làm tham số đầu:
```js
const templateService = {
  getAll: (axiosPrivate, pageSize = 25, pageNumber = 1) =>
    axiosPrivate.get(`/api/template/getAll?pageSize=${pageSize}&pageNumber=${pageNumber}`),
};
export default templateService;
```

### Component state pattern

```js
const [snackbar, setSnackbar] = useState({ isOpen: false, status: "success", message: "" });
const [loading, setLoading] = useState(false);

// Usage:
<LoadingSpinner loading={loading} />
<FormSnackbar item={snackbar} setItem={setSnackbar} />
```

### Drag-and-drop (KeywordBuilder)

Dùng `@dnd-kit/core` + `@dnd-kit/sortable` + `@dnd-kit/utilities`.
Pattern: optimistic update local state → gọi API → revert nếu lỗi.

---

## API Endpoints

### Keyword API (Form Builder — mới)

```
GET    /api/keywords?templateId={id}    Lấy ALL keywords (kể cả IsHidden) cho admin
POST   /api/keywords                    Tạo keyword mới [SuperAdmin]
PUT    /api/keywords/{id}               Cập nhật keyword [SuperAdmin]
DELETE /api/keywords/{id}               Soft-hide (IsHidden=true) [SuperAdmin]
                                        → 409 nếu keyword đang được dùng trong CaseKeyword
PATCH  /api/keywords/reorder            Bulk reorder [{id, order}] [SuperAdmin]
```

### Template API (existing + mới)

```
GET    /api/template/getAll             Templates của company hiện tại (paged) [SuperAdmin]
GET    /api/template?templateId={id}    Chi tiết template
GET    /api/template/template           Template của company từ JWT (dùng cho case form)
POST   /api/template                    Tạo template + keywords [SuperAdmin]
PUT    /api/template/{id}               Cập nhật template [SuperAdmin]
DELETE /api/template/{id}               Xóa template [SuperAdmin]
POST   /api/template/{id}/clone         Clone template sang company [SuperAdmin]
```

### Type API

```
GET    /api/type/type       Lấy tất cả kiểu dữ liệu (không phải file type)
GET    /api/type/file-type  Lấy kiểu file
```

---

## Các quyết định thiết kế đã chốt

### 1. TypeId FK (không dùng enum)

Keyword.TypeId là FK trỏ đến Type table. Admin chọn từ danh sách Type có sẵn qua dropdown.
**Không** refactor sang DataType enum. Lý do: Type table có metadata linh hoạt và đã có data.

### 2. OptionsList là chuỗi pipe-separated

`Keyword.OptionsList` lưu options dưới dạng `"選択肢A|選択肢B|選択肢C"`, max 2000 ký tự.
**Không** tạo bảng riêng. Lý do: đơn giản, đủ cho use case hiện tại.

### 3. IsHidden vs Deleted (Keyword)

| Flag | Ý nghĩa | Ảnh hưởng |
|---|---|---|
| `Deleted=true` | Hard soft-delete | Ẩn khỏi mọi nơi, kể cả case form |
| `IsHidden=true` | Form Builder hide | Ẩn khỏi admin UI, vẫn giữ trong CaseKeyword history |

Khi admin muốn ẩn field: set `IsHidden=true` (KHÔNG set `Deleted=true`).
Lý do: CaseKeyword data phải được bảo toàn dù field bị ẩn.

### 4. Standard Template + Auto-clone

- Có đúng **1** Template với `IsDefault=true` trong toàn hệ thống (Standard Template)
- Khi tạo Company mới: `CompanyController.Create` tự động clone Standard Template và link với company
- Clone: tạo Template mới + copy Keywords (chỉ non-hidden) + tạo CompanyTemplate record
- Clone KHÔNG copy `IsDefault=true` — bản clone luôn có `IsDefault=false`

### 5. Frontend language: JavaScript (không TypeScript)

Tất cả file frontend là `.js` hoặc `.jsx`. **Không tạo `.ts` hay `.tsx`**.
Lý do: project đã bắt đầu với JS, không muốn migration cost.

### 6. Dynamic Field cho Product/Order: hybrid, không full-EAV, bảng riêng khỏi CaseKeyword (2026-07-31)

- `Template.ModuleType` (`"Case"`/`"Product"`/`"Order"`) phân biệt template theo module — quyết định #4 (Standard Template + Auto-clone) ở trên **chỉ áp dụng cho `ModuleType="Case"`**; `IsDefault=true` vẫn là duy nhất toàn hệ thống trên thực tế vì Product/Order template luôn tạo với `IsDefault=false` (không có khái niệm "Standard Template" cho 2 module này — chúng bắt đầu rỗng).
- Field có logic nghiệp vụ phụ thuộc (`StockQuantity`, `UnitPrice`, `Quantity`...) **giữ nguyên là cột C# cố định**, KHÔNG đưa vào EAV — chỉ field bổ sung (không ảnh hưởng tính toán) mới dynamic qua bảng `EntityKeyword` mới.
- `EntityKeyword` là bảng **riêng biệt** với `CaseKeyword` (không dùng chung/không migrate data cũ) dù cùng hình dạng generic — để zero-touch dữ liệu Case đang chạy.
- Lý do chốt: xem `docs/devlog/2026-07-31.md` mục "Phiên tiếp theo... Quyết định quan trọng & lý do".

---

## Ràng buộc và quy tắc bắt buộc

### Backend

1. **Không hard-delete Keyword** khi có CaseKeyword references → trả 409 Conflict
2. **Không trả Entity trực tiếp** từ API — luôn dùng ViewModel/DTO
3. **Migration mới**: luôn có `defaultValue` cho cột NOT NULL; luôn update snapshot
4. **Seed idempotent**: luôn có guard check trước khi insert
5. **Async/await**: tất cả DB call phải async — **không dùng `.Result` hay `.Wait()`**
6. **Layer không được xuyên**: Service không gọi DbContext, Controller không gọi Repository
7. **Multi-tenant**: mọi query filter theo CompanyId — không bao giờ leak data cross-company

### Frontend

1. **Luôn dùng `useAxiosPrivate` hook** — không import `axiosPrivate` trực tiếp
2. **Service nhận `axiosPrivate` làm param đầu** — không bind trong service file
3. **Không thêm comment** trừ khi lý do kỹ thuật không rõ ràng
4. **Không dùng TypeScript** — chỉ JS/JSX
5. **Snackbar shape**: `{ isOpen: bool, status: "success"|"error", message: string }`
6. **Xử lý 409**: khi DELETE keyword, bắt `error.response?.status === 409` riêng

### Chung

1. **Không thêm feature**, refactor, hay abstraction ngoài scope của task
2. **Đọc file trước khi Edit** — không overwrite mà không đọc
3. **Giữ nguyên code hiện có** khi thêm tính năng mới

---

## Môi trường phát triển

- **OS**: Windows 11 Pro
- **Shell**: PowerShell (dùng PowerShell syntax, KHÔNG bash syntax cho file ops)
- **dotnet CLI**: **đã có trên máy** (`C:\Program Files\dotnet\dotnet.exe`, SDK 10.0.302) — `dotnet build`/`restore`/`user-secrets` dùng bình thường. **`dotnet-ef` global tool đã cài** (2026-07-31, pin version `6.0.25` khớp EF Core của project — bản mới nhất mặc định bị `FileLoadException` do version mismatch runtime với net6.0), nhưng `dotnet ef migrations add` vẫn KHÔNG dùng được do bug tiềm ẩn trong snapshot hiện có (xem mục "Migration" ở trên) — migration vẫn phải viết tay + kèm Designer.cs tối giản.
- **npm**: có trong frontend/
- **Database**: SQL Server (connection string trong appsettings)
- **Auto-migration**: `db.Database.Migrate()` trong `Program.cs` — apply khi app start

---

## Subagents

Project có 2 custom subagent định nghĩa trong `.claude/agents/`:

| Agent | File | Khi nào dùng |
|---|---|---|
| code-reviewer | `.claude/agents/code-reviewer.md` | Sau khi viết/sửa code đáng kể |
| code-tester | `.claude/agents/code-tester.md` | Khi cần viết test cho tính năng |

Gọi bằng: `@code-reviewer` hoặc `@code-tester` trong chat.
