# CaseMngmt — Architecture & Design Reference

Tài liệu này ghi lại kiến trúc, các quyết định thiết kế, convention và ràng buộc đã được thống nhất.
Claude phải đọc file này trước khi làm bất kỳ thay đổi nào vào codebase.

Tài liệu bổ sung:
- Kiến trúc chi tiết: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- Quyết định thiết kế (ADR): [docs/adr/](docs/adr/)
- Nhật ký phát triển: [docs/devlog/](docs/devlog/)
- Hướng dẫn sử dụng / demo cho khách hàng (tiếng Nhật): [docs/USER_GUIDE.md](docs/USER_GUIDE.md)

---

## Current State (2026-07-31)

**QUAN TRỌNG — phạm vi repo đã đổi**: kể từ 2026-07-31, đây là repo **`order-procurement-dx`** (clone từ `order-platform-dx`), và là **repo DUY NHẤT** còn được làm việc. User yêu cầu **không đụng vào `case-management` (`f:\Prj\CaseMngmt`) hay `order-platform-dx` (`f:\Prj\CaseMngmt-demo`) nữa** — xem chi tiết lý do + ràng buộc trong `docs/devlog/2026-07-31.md`. Repo này được tạo ra để làm điểm khởi đầu xây thêm module **仕入れ** (mua hàng/nhà cung cấp) — module này **có plan chi tiết đã chốt (Supplier/PurchaseOrder/GoodsReceipt/PurchaseInvoice, xem `docs/devlog/2026-07-31.md` mục "Vấn đề còn tồn đọng") nhưng CHƯA code**, vì phiên làm việc gần nhất đổi hướng sang xây nền tảng dynamic-field trước (xem đoạn dưới).

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

Backend (`localhost:5000`, Development) + frontend dev server (`localhost:3000`) **đang chạy nền** cho user browse demo cục bộ (không phải ngrok public) — chưa dừng, dừng khi user xác nhận xong việc. Secret (Jwt/AWS/Anthropic) lưu qua `dotnet user-secrets` (không nằm trong `appsettings.json` đang track git, vì repo này cũng public).

Artifact User Guide/demo script (KHÔNG nằm trong git, chỉ tồn tại trên claude.ai): **https://claude.ai/code/artifact/d6ac3e4c-590e-4495-8b6c-2e7d39e42667**

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

**Build health (2026-07-31)**: `dotnet build` (backend) và `npm run build`/dev server (frontend) đều pass, không lỗi, trên repo này (`order-procurement-dx`). Đã verify thêm bằng cách chạy backend thật với LocalDB (`dotnet run`) — 2 migration mới (`AddTemplateModuleType`, `AddEntityKeywordTable`) áp dụng sạch, seed data không lỗi. Lưu ý: `dotnet build` sẽ báo lỗi file-lock (MSB3027) trong lúc backend đang chạy nền (`dotnet run`) — không phải lỗi code, chỉ cần dừng process đang chạy trước khi build lại.

**Demo/chia sẻ ra ngoài**: hiện **không có demo nào đang chạy sống** (đã dừng bản demo cũ chạy từ `case-management`). Khi cần dựng lại demo: `npm run build` (frontend) → mirror vào `wwwroot` (`robocopy ... /MIR`) → chạy backend với `--no-launch-profile` (né SpaProxy cũ trỏ thư mục không tồn tại) → `ngrok http 5178`. URL ngrok đổi mỗi lần restart trừ khi có static domain đã đặt riêng — xem devlog gần nhất để biết URL hiện tại nếu có.

**Ghi chú môi trường quan trọng**: `git`, `ngrok`, và `gh` (GitHub CLI) đều **đã cài** qua winget và đã `gh auth login` thành công (account `jinaomi`) — dùng được cho việc tạo/push repo. **`dotnet` CLI đã có trên máy** (`C:\Program Files\dotnet\dotnet.exe`, SDK 10.0.302, chạy build/restore/user-secrets bình thường — thông tin "dotnet CLI không có trên máy" ở mục "Môi trường phát triển" bên dưới đã LỖI THỜI, xem ghi chú tại đó). PATH KHÔNG tự refresh giữa các lần gọi PowerShell tool (mỗi lệnh là tiến trình mới, phải tự nạp lại `$env:PATH` từ registry Machine+User trước khi gọi `git`/`ngrok`/`gh`). ngrok từng bị Windows Defender quarantine ngay khi tự update — đã fix bằng cách user thêm Defender exclusion cho `%LOCALAPPDATA%\Microsoft\WinGet\Packages`.

## Next Steps

1. **Thiết kế + code module 仕入れ (procurement/supplier)** — plan chi tiết đã chốt (Supplier với 締め日/支払サイト kiểu Nhật, PurchaseOrder→GoodsReceipt cộng ngược `StockQuantity` đối xứng với Invoice trừ kho, AI đọc 見積書/納品書 theo pattern `OrderIntakeUpload`) nhưng CHƯA thực thi — cần dựng lại plan (xem `docs/devlog/2026-07-31.md`) và code, dùng engine `EntityKeyword`/`ModuleType` mới ngay từ đầu thay vì schema cố định.
2. Search/filter theo giá trị custom field trên `ProductSearch.js`/`OrderSearch.js` (cố ý để ngoài phạm vi phiên vừa rồi).
3. Cân nhắc tách tài nguyên AWS riêng (S3 bucket/IAM) cho repo này — hiện AWS key trong `dotnet user-secrets` là key thật đang dùng CHUNG với `case-management` production (bucket `case-bucket-ap-northeast`), chưa tách riêng.
4. Quyết định có triển khai RAG hay không (hướng mở rộng AI thứ 3 đã thảo luận trước đây), hoặc chuyển sang các việc treo khác.
5. Excel import cho Product (`ClosedXML`) — nguồn dữ liệu tồn kho thực tế của SME hiện quản lý bằng Excel.
6. Nâng cấp đánh số `OrderNumber`/`InvoiceNumber` từ COUNT-based sang sequence table atomic trước khi chạy production thật (rủi ro concurrency hiện tại chấp nhận được cho demo, không cho production).

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
