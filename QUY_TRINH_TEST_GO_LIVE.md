# QUY TRÌNH VẬN HÀNH & 5 KỊCH BẢN TEST — MINH VIỆT TRAVEL ERP
> Tài liệu cho nhân sự test trước khi Go Live. URL: https://minhviet-erp.vercel.app

---

## A. CHUẨN BỊ TÀI KHOẢN (làm 1 lần trước khi test)

Vào **Nhân sự** (tài khoản Giám đốc `tung.gd` / `mv@admin`) kiểm tra/chỉnh các tài khoản sau cho đúng vai trò trong quy trình:

| Người | Username | Mật khẩu | Vai trò trong hệ thống | Việc họ làm |
|---|---|---|---|---|
| Nguyễn Thị Hoa | `hoa.sale` | `mv2025` | Sale (Kinh doanh) | Tư vấn, tạo đơn, thu cọc, lập phiếu thu |
| Trần Văn Nam | `nam.sale` | `mv2025` | Sale | (như trên) |
| Phạm Quốc Hùng | `hung.sale` | `mv2025` | Sale | (như trên) |
| Nguyễn Minh Thành | (tạo mới) | — | **Điều hành** (dieu_hanh) | Tạo đơn, đặt dịch vụ NCC, lập phiếu chi |
| Kế toán Trưởng – Liên | `lien.kt` | `mv2025` | **Kế toán trưởng** (accountant) | Lập/đối chiếu phiếu, duyệt phiếu **thu** |
| Kế toán Quỹ – Minh | `minh.kt` | `mv2025` | **Thủ quỹ** (cashier) ⚠️ đổi role | Chi tiền thật, ghi sổ quỹ |
| Phó Giám đốc | (tạo mới) | — | **Phó Giám đốc** (pho_giam_doc) | Duyệt phiếu chi (cùng cấp GĐ) |
| Giám đốc – Mr. Tùng | `tung.gd` | `mv@admin` | Giám đốc (manager) | Duyệt chi, xóa đơn, xem toàn bộ |

> ⚠️ **2 chỉnh sửa quan trọng:**
> 1. Đổi role của **Kế toán Quỹ – Minh** từ "Kế toán" → **Thủ quỹ (cashier)** để bước "chuyển tiền thật" về đúng người.
> 2. **Tạo 1 tài khoản Phó Giám đốc** (vd `pgd.mv`) role **Phó Giám đốc** — để test việc Ban GĐ duyệt chi khi GĐ bận.

---

## B. SƠ ĐỒ LUỒNG CHUẨN (1 đơn hàng đi hết vòng đời)

```
   SALE / ĐIỀU HÀNH                KẾ TOÁN TRƯỞNG        BAN GIÁM ĐỐC           THỦ QUỸ
   (Hoa / Thành)                   (Liên)                (GĐ Tùng / PGĐ)        (Minh)
┌──────────────────┐
│ 1. Tư vấn + Báo  │
│    giá khách      │
└────────┬─────────┘
         ▼
┌──────────────────┐
│ 2. Tạo ĐƠN HÀNG  │  (chọn sản phẩm từ Tour ghép → tự kéo giá mua/bán)
│    gán phụ trách  │
└────────┬─────────┘
         ▼
┌──────────────────┐      ┌────────────────────┐
│ 3. Lập PHIẾU THU │─────▶│ 4. Duyệt phiếu THU │  (KT trưởng / thủ quỹ xác nhận đã nhận tiền)
│    cọc của khách  │      └────────────────────┘
└──────────────────┘
         │
         ▼  (cần chi tiền cho NCC: vé, KS, land tour…)
┌──────────────────┐      ┌────────────────────┐     ┌──────────────────┐     ┌────────────────┐
│ 5. Lập PHIẾU CHI │─────▶│ 6. KT trưởng kiểm  │────▶│ 7. BAN GĐ DUYỆT  │────▶│ 8. THỦ QUỸ chi │
│   (link NCC,bill) │      │   tra, chuyển GĐ   │     │   CHI (GĐ/PGĐ)   │     │   tiền thật     │
└──────────────────┘      │   (pending_gd)     │     │   (pending_pay)  │     │   → đã chi (paid)│
   pending_kt             └────────────────────┘     └──────────────────┘     └────────────────┘
         │
         ▼  (tour chạy xong)
┌──────────────────┐
│ 9. Thanh toán nốt│ → khách trả hết → đối chiếu công nợ = 0
│    + ĐÓNG ĐƠN     │ → Kế toán xem lãi/lỗ trong module Kế toán
└──────────────────┘
```

**Quy tắc vàng (đã cấu hình trong hệ thống):**
- **Mọi phiếu CHI** (không còn ngưỡng 20tr) đều phải qua **Ban Giám đốc** (Giám đốc HOẶC Phó Giám đốc — chỉ cần 1 người duyệt).
- **Phiếu THU**: Kế toán trưởng / Thủ quỹ xác nhận, không cần Ban GĐ.
- **Xóa đơn**: chỉ Giám đốc.

---

## C. 5 KỊCH BẢN TEST CỤ THỂ (5 sản phẩm thật trong hệ thống)

### 🟢 Kịch bản 1 — Tour nội địa, luồng cơ bản
**Sản phẩm:** Tour Sapa – Fansipan 3N2Đ (TGP-0005) · Giá bán **5.500.000đ/khách** · Giá mua 4.200.000đ
**Khách:** Nguyễn Văn An (KH001) — 2 người lớn.

| Bước | Người làm | Thao tác | Kết quả mong đợi |
|---|---|---|---|
| 1 | **Hoa (sale)** | Tạo đơn, chọn Tour ghép Sapa, 2 NL | Giá tự kéo: doanh thu 11.000.000đ, giá vốn 8.400.000đ, lãi gộp **2.600.000đ** |
| 2 | Hoa | Lập **phiếu thu** cọc 5.000.000đ | Phiếu thu chờ xác nhận, gửi thông báo cho Kế toán |
| 3 | **Liên (KT trưởng)** | Vào Duyệt → xác nhận phiếu thu | Công nợ còn lại 6.000.000đ |
| 4 | **Thành (điều hành)** | Lập **phiếu chi** trả Topas Travel 8.400.000đ (link NCC, đính bill) | Phiếu chi vào `pending_kt` |
| 5 | Liên → **Ban GĐ** → **Minh (thủ quỹ)** | Duyệt 3 cấp | Phiếu chi → đã chi (paid) |
| 6 | Hoa | Khách trả nốt 6.000.000đ → **Đóng đơn** | Công nợ = 0, đơn hoàn tất |
| ✔ | **Liên** | Vào module **Kế toán** | Tab Tổng quan thấy lãi gộp đơn này = 2.600.000đ |

---

### 🟢 Kịch bản 2 — Tour quốc tế miễn visa, có trẻ em
**Sản phẩm:** Tour Thái Lan 5N4Đ Bangkok–Pattaya (TGP-0003) · NL bán 10.500.000đ (mua 8.200.000) · TE bán 8.500.000đ (mua 6.500.000)
**Khách:** Trần Thị Bích (KH002) — 2 người lớn + 1 trẻ em.

- **Nam (sale)** tạo đơn → doanh thu **29.500.000đ**, giá vốn 22.900.000đ, lãi gộp **6.600.000đ**.
- Nam lập **phiếu thu** cọc 30% ≈ 9.000.000đ → Liên duyệt.
- **Thành** lập **2 phiếu chi**: (a) cọc land tour Hanoitourist 15.000.000đ, (b) phí dịch vụ 7.900.000đ → mỗi phiếu đi đủ Liên → **Ban GĐ** → Minh.
- **Điểm test:** kiểm tra cả 2 phiếu chi đều **bắt buộc** qua Ban GĐ (dù phiếu (b) < 20tr) — đúng quy tắc mới.
- Đóng đơn → kiểm tra **Phải trả nhà cung cấp Hanoitourist** trong tab Phải trả của module Kế toán.

---

### 🟢 Kịch bản 3 — Tour cao cấp, có visa, phụ thu ngoài giá
**Sản phẩm:** Tour Hàn Quốc 5N4Đ Seoul–Nami–Everland (TGP-0001) · bán 17.900.000đ (mua 14.500.000)
**Khách:** Phạm Thùy Linh / Cty (KH004 – business) — 4 người lớn, xuất **hóa đơn VAT**.

- **Hung (sale)** tạo đơn 4 NL → doanh thu **71.600.000đ**, giá vốn 58.000.000đ, lãi gộp **13.600.000đ**.
- Thêm dòng phụ thu ngoài giá: phí visa group 4 × 2.000.000 = 8.000.000đ.
- Khách công ty → tạo **Hóa đơn VAT đầu ra** trong module Kế toán → kiểm tra tab Hóa đơn VAT tính ra **VAT phải nộp**.
- **Điểm test:** đơn giá trị lớn — phiếu chi vé máy bay (>20tr) vẫn đi đúng đường Liên → Ban GĐ → Minh (giống đơn nhỏ, không còn nhánh riêng).
- **GĐ Tùng bận** → để **PGĐ** duyệt thay → xác nhận PGĐ duyệt được phiếu chi.

---

### 🟢 Kịch bản 4 — Đơn bị giữ lại / từ chối duyệt (luồng ngoại lệ)
**Sản phẩm:** Tour Nhật Bản 6N5Đ Tokyo–Osaka–Kyoto (TGP-0002) · bán 26.500.000đ (mua 22.000.000) → lãi mỏng.
**Khách:** Lê Minh Tuấn (KH003) — **thiếu CCCD** (cố tình để trống).

- **Hoa** tạo đơn 2 NL → lãi gộp chỉ 4.500.000đ/khách → **hệ thống cảnh báo lãi thấp / thiếu CCCD**.
- Thành lập phiếu chi cọc Saigontourist 30.000.000đ.
- **Ban GĐ TỪ CHỐI** phiếu chi (lý do: chưa đủ CCCD khách, lãi mỏng cần xem lại giá).
- **Điểm test:** phiếu chi quay về trạng thái bị từ chối, thủ quỹ **không** chi được; thông báo phản hồi về người lập. Sale bổ sung CCCD → lập lại → duyệt lại thành công.

---

### 🟢 Kịch bản 5 — Hoàn/hủy một phần (refund)
**Sản phẩm:** Tour Singapore–Malaysia 6N5Đ (TGP-0004) · bán 20.500.000đ (mua 16.800.000)
**Khách:** Hoàng Minh Đức (KH005) — đặt 3 NL, sau đó **hủy 1 người**.

- **Nam** tạo đơn 3 NL → doanh thu 61.500.000đ. Thu cọc 30.000.000đ.
- Khách hủy 1 NL → lập **phiếu hoàn tiền**: hoàn cho khách phần đã nộp trừ phí hủy NCC (vd phí hủy 10% = ~1.680.000đ).
- Phiếu hoàn đi qua **Ban GĐ duyệt** rồi **thủ quỹ chi hoàn**.
- **Điểm test:** sau hoàn, doanh thu đơn còn 2 NL = 41.000.000đ; module Kế toán tab Sổ thu chi ghi nhận 1 dòng **chi hoàn**; số dư quỹ giảm đúng số tiền hoàn.

---

## D. CHECKLIST NGHIỆM THU (đánh ✔ khi test xong mỗi mục)

- [ ] Tạo đơn từ Tour ghép tự kéo đúng giá mua/bán, tính đúng lãi gộp
- [ ] Phiếu thu → Kế toán duyệt → công nợ giảm đúng
- [ ] Mọi phiếu chi (lớn & nhỏ) đều bắt buộc qua Ban GĐ
- [ ] PGĐ duyệt chi được khi GĐ vắng
- [ ] Thủ quỹ là người chi tiền cuối cùng (paid)
- [ ] Từ chối phiếu chi → thủ quỹ không chi được, phản hồi về người lập
- [ ] Hoàn tiền đi đúng luồng và ghi sổ quỹ
- [ ] Đính kèm ảnh bill ở phiếu thu/chi hoạt động
- [ ] Phiếu chi link đúng NCC → tab Phải trả cộng dồn công nợ NCC
- [ ] Module Kế toán: Tổng quan / Sổ thu chi (số dư lũy kế) / Phải thu (aging) / Phải trả / VAT / Quỹ&NH hiển thị đúng
- [ ] Chỉ Giám đốc xóa được đơn
- [ ] In hợp đồng/phiếu: số tiền tự điền nhất quán theo từng giai đoạn, không lặp header công ty
