# Test Cases — Dynamic Field (Custom Fields) cho Product/Order

Ghi lại các test case đã thực thi thủ công qua browser thật (Playwright headless + Microsoft Edge, không phải giả lập) trong phiên 2026-07-31, khi verify tính năng dynamic-field tổng quát hoá từ 案件管理 sang Product/Order. Dùng file này để chạy lại regression test khi có thay đổi liên quan đến `Template`/`Keyword`/`EntityKeyword`/`GenericItems.js`/`CustomFieldsSection.js`.

**Phạm vi liên quan**: `docs/devlog/2026-07-31.md` (mục "Tổng quát hoá Dynamic Field" và "Test dynamic-field qua UI thật"), `CLAUDE.md` mục "Current State".

---

## Môi trường test

- Backend: `ASPNETCORE_ENVIRONMENT=Development dotnet run --no-launch-profile` trong `backend/CaseMngmt.Server` (bắt buộc `Development` để `dotnet user-secrets` load `Jwt:Secret` — chạy `--no-launch-profile` không set biến này mặc định là `Production`, secret sẽ không load, login trả 500).
- Frontend: `REACT_APP_BASE_URL=http://localhost:5000 npm start` trong `frontend/` (mặc định code trỏ prod `13.114.116.252`, phải override).
- DB: SQL Server LocalDB (`MSSQLLocalDB`), database `CaseMngmt`.
- Login: `SuperAdmin` / `Admin@123` (seed mặc định, xem `DbInitializerExtension.cs`).
- Driver test: `playwright-core` + Microsoft Edge có sẵn trên máy (`channel: msedge` qua `executablePath`), viết REPL driver riêng vì môi trường không có `chromium-cli` sẵn và không có mạng tải Chromium. Driver không lưu trong repo (nằm ở scratchpad tạm của phiên chat) — cần viết lại nếu muốn tự động hoá lại theo cách này; xem `docs/devlog/2026-07-31.md` để biết cấu trúc driver (`fill-near`, `click-near`, `click-option`, `click-btn` — các lệnh tự chế để né bug label không liên kết `htmlFor` và tránh match nhầm nút "追加"/"品名" trùng tên với nút/field nền phía sau Dialog).

---

## Test cases đã PASS (test thật, có ảnh chụp màn hình lúc chạy)

### TC-01: Template rỗng tự tạo lazy cho company khi mở màn hình Product/Order lần đầu
**Bước**:
1. Login SuperAdmin.
2. Mở 商品・在庫管理 → 新規商品 (kích hoạt `GET /api/template/module?moduleType=Product`).
3. Mở 受注管理 → 受注登録 (kích hoạt `GET /api/template/module?moduleType=Order`).
4. Vào テンプレート管理 (`/admin/templates`).

**Kết quả mong đợi**: Bảng hiện đủ 3 template — `BOAT Template` (種別=案件管理, giữ nguyên field count cũ), `Product Template` (種別=商品管理, 0 field, ngày tạo = hôm nay), `Order Template` (種別=受注管理, 0 field, ngày tạo = hôm nay).

**Kết quả thực tế**: PASS. Cả 3 template hiện đúng, cột "種別" (mới thêm vào `TemplateList.jsx`) hiển thị đúng nhãn.

---

### TC-02: Admin thêm field mới cho Product qua Form Builder (không cần code)
**Bước**:
1. Từ テンプレート管理, click "フィールド管理" ở dòng `Product Template`.
2. Click "+ フィールド追加".
3. Điền フィールド名 = `保管場所`, タイプ = `Alphanumeric`, để trống 最大文字数, 順序 = mặc định.
4. Click "追加".

**Kết quả mong đợi**: Toast "フィールドを追加しました。", field xuất hiện trong bảng field list với 状態 = 表示中.

**Kết quả thực tế**: PASS (sau khi sửa lỗi test script tự gây — xem mục "Lỗi test-script tự gây" bên dưới, không phải bug app).

---

### TC-03: Admin thêm field mới cho Order qua Form Builder
Giống TC-02, nhưng target `Order Template`, tên field `配送方法`, type `Alphanumeric`.

**Kết quả thực tế**: PASS.

---

### TC-04: Field mới render đúng trong form tạo Product
**Bước**: Mở 商品・在庫管理 → 新規商品 (sau khi đã có field 保管場所 từ TC-02).

**Kết quả mong đợi**: Section "カスタム項目" xuất hiện dưới field 備考, có field text "保管場所".

**Kết quả thực tế**: PASS.

---

### TC-05: Field mới render đúng trong form tạo Order
**Bước**: Mở 受注管理 → 受注登録 (sau khi đã có field 配送方法 từ TC-03).

**Kết quả mong đợi**: Section "カスタム項目" xuất hiện dưới bảng 商品/trên 備考, có field text "配送方法".

**Kết quả thực tế**: PASS.

---

### TC-06: Tạo Product mới có điền custom field → lưu thành công
**Bước**:
1. Mở 新規商品.
2. Điền 品名=`テスト部品ABC`, 在庫数量=`10`, 保管場所=`A棟2階棚3`.
3. Click 保存.

**Kết quả mong đợi**: Toast "商品の登録は正常に完了しました！", giá trị 保管場所 vẫn hiển thị đúng trong form ngay sau lưu.

**Kết quả thực tế**: PASS (sau khi fix bug maxLength=0 — xem mục Bug bên dưới; trước khi fix, ký tự gõ vào 保管場所 bị chặn hoàn toàn ở tầng browser).

---

### TC-07: Reload Product từ server → custom field value persist đúng
**Bước**:
1. Sau TC-06, vào 商品・在庫管理, tìm kiếm theo 品名=`テスト部品ABC`.
2. Click 編集 (mở lại form từ `GET /api/product?id=...` — GET thật, không dùng cache client).

**Kết quả mong đợi**: Field 保管場所 hiện đúng giá trị `A棟2階棚3` đã lưu ở TC-06.

**Kết quả thực tế**: PASS. Verify bằng cả UI (đọc `.value` của input qua DOM eval, không dùng text-match vì input value không phải text node) lẫn API trực tiếp (`curl GET /api/product?id=...` → `customFieldValues` đúng).

---

### TC-08: Tạo Order mới có chọn khách hàng + dòng sản phẩm + điền custom field → lưu thành công
**Bước**:
1. Mở 受注登録.
2. Chọn 取引先 = `さくら商事株式会社` (Autocomplete).
3. Điền dòng 商品: 商品名を入力 = `テスト商品X`, 数量 = `1` (mặc định).
4. Điền 配送方法 = `宅配便`.
5. Click 保存.

**Kết quả mong đợi**: Toast "受注の登録は正常に完了しました！", 受注番号 tự sinh (vd `ORD-2026-00024`), ステータス=`Confirmed`.

**Kết quả thực tế**: PASS.

---

### TC-09: Reload Order từ server (qua 受注検索 → 編集) → custom field value persist đúng
**Bước**:
1. Sau TC-08, vào 受注検索, click 検索 (list không tự load, phải bấm tìm kiếm trước).
2. Tìm dòng `ORD-2026-00024`, click 編集.

**Kết quả mong đợi**: Field 配送方法 hiện đúng `宅配便` sau khi component fetch xong (`getOrderDetail()` — có độ trễ nhỏ vì `loadOptions()` chạy trước).

**Kết quả thực tế**: PASS. Verify bằng API trực tiếp (`curl GET /api/order?id=...`) cho kết quả nhất quán với UI.

---

## Bug phát hiện + đã fix trong phiên test này

### BUG-01: `MaxLength=0` khiến field mới tạo không gõ được ký tự nào
- **Điều kiện**: Tạo field mới qua Form Builder mà để trống "最大文字数".
- **Nguyên nhân gốc**: `KeywordBuilder.jsx` gửi `maxLength: formData.maxLength ? parseInt(formData.maxLength) : 0` — để trống thì gửi `0` thay vì `null`. Backend lưu `Keyword.MaxLength = 0`. `GenericItems.js` (case `"string"`/`"textarea"`) truyền thẳng `maxLength={props.maxLength}` xuống `<input>` native → HTML `maxlength="0"` chặn **mọi** ký tự gõ vào (hành vi chuẩn của trình duyệt, không phải bug React).
- **Phạm vi ảnh hưởng**: Bug có sẵn từ trước (áp dụng cho cả Case), chỉ chưa lộ ra vì Case luôn set maxLength khi tạo field qua UI cũ.
- **Fix**: `frontend/src/components/until/GenericItems.js` — đổi `maxLength={props.maxLength}` → `maxLength={props.maxLength || undefined}` ở cả 2 case (dùng `replace_all`). Không sửa `KeywordBuilder.jsx` (nơi bug thực sự phát sinh) vì fix ở renderer chặn triệt để hơn và không đổi payload gửi lên backend.
- **Test lại sau fix**: TC-06/TC-08 chạy lại PASS.

### Lỗi test-script tự gây (KHÔNG phải bug app — ghi lại để tránh hiểu nhầm lần sau)
1. **Nút "追加" bị match nhầm với "+ フィールド追加"** (nút cha ngoài dialog, chứa substring "追加") khi dùng text-substring locator (`text=追加`) — khiến tưởng "lưu field" thành công nhưng thực ra chỉ click trúng nút mở lại dialog, không hề gọi API. Fix trong test script: dùng `getByRole('button', {name: '追加', exact: true})`.
2. **`fill`/`click` theo label text bị match nhầm field nền phía sau Dialog** — `ProductSearch.js` có field 品名 (không required, không dấu `*`) vẫn mounted phía sau khi `ProductDetail.js` mở dưới dạng Dialog; field thật trong Dialog có label `"品名 *"` (khác text). Locator không scope theo `.MuiDialog-root` sẽ fill nhầm field nền. Fix: scope locator trong `.MuiDialog-root .section-item` khi có Dialog đang mở.
3. **`wait-text` không đọc được giá trị bên trong `<input>`** (Playwright text engine chỉ scan text node, không đọc `.value`) — verify giá trị input phải dùng `eval ... .value`, không dùng `wait-text`. Từng khiến tưởng nhầm Order không persist custom field trong khi backend đã lưu đúng (xác nhận lại bằng `curl` trực tiếp).

---

## Chưa test / cần bổ sung ở phiên sau

- [ ] **409 khi xoá/ẩn field đang có giá trị sử dụng** — guard `KeywordService.SoftDeleteAsync` tổng quát hoá theo `ModuleType` (route sang `EntityKeyword.HasUsageAsync` cho Product/Order) chưa test qua UI/API thật, chỉ mới đọc code.
- [ ] **Regression 案件管理 (Case)** sau khi sửa `GenericItems.js` — chưa test click-through thật (tạo/sửa/tìm kiếm 1 Case với field list/date/textarea/customerlist) trong phiên này, chỉ suy luận từ đọc code là an toàn (không đổi field/layout logic của Case, chỉ thêm case `"textarea"` còn thiếu + sửa `maxLength` fallback).
- [ ] **Field type khác ngoài Alphanumeric** cho Product/Order — chỉ test type `Alphanumeric` (string). Chưa test `List`, `Date`, `Numeric`, `TextArea` cho custom field của Product/Order.
- [ ] **Update Product/Order đã có custom field value** (không chỉ tạo mới) — TC-06/08 chỉ test luồng tạo mới; luồng sửa record đã tồn tại và đổi giá trị custom field, sau đó lưu lại, chưa test riêng (dù code `ProductService.UpdateProductAsync`/`OrderService.UpdateOrderAsync` đều có gọi `ReplaceValuesAsync`).
- [ ] Search/filter theo custom field trên `ProductSearch.js`/`OrderSearch.js` — ngoài phạm vi thiết kế ban đầu, chưa implement nên không có gì để test.

---

## Dữ liệu test còn sót lại trong DB (không ảnh hưởng, chỉ ghi chú)

- Product: `テスト部品ABC` (品番 trống, 在庫数量=10, 保管場所=A棟2階棚3).
- Order: `ORD-2026-00024` (tạo qua UI), `ORD-2026-00025` (tạo qua `curl` để debug BUG-01/verify persistence độc lập với UI).

Không cần dọn vì là DB dev cục bộ (LocalDB), không phải production.
