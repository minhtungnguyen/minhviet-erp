# PHÂN CÔNG & LUỒNG VIỆC THEO VỊ TRÍ — MINH VIỆT TRAVEL ERP
> Tài liệu giao việc cho nhân viên test trước Go Live · URL: https://minhviet-erp.vercel.app
> Mỗi người đăng nhập đúng tài khoản của mình, làm theo phần "Luồng việc" và hoàn thành "Bài tập mẫu".

---

## 0. Tài khoản đăng nhập

| Vị trí | Username | Mật khẩu |
|---|---|---|
| Sale | `hoa.sale` / `nam.sale` / `mai.sale` / `hang.dv` | mv2025 |
| Điều hành | `thanh.nm` | mv2025 |
| Kế toán trưởng | `anh.ktt` | mv2025 |
| Thủ quỹ (Kế toán quỹ) | `tung.ktq` | mv2025 |
| Phó Giám đốc | `pgd.mv` | mv2025 |
| Giám đốc | `tung.gd` | (mật khẩu GĐ) |

---

## 1. SALE (Kinh doanh)

**Luồng việc hằng ngày:**
1. Tư vấn khách → **tạo Báo giá** (module Báo giá) hoặc tạo đơn luôn.
2. **Tạo đơn hàng:**
   - Tour đoàn đông / nhiều khách → nút **"+ Tạo đơn"** (3 bước, nhập đủ hành khách).
   - Vé máy bay / khách sạn / du thuyền / tour ghép lẻ 2-3 người → nút **⚡ Bán nhanh**.
3. Thu cọc khách → **lập phiếu THU**, đính ảnh bill.
4. Theo dõi công nợ, nhắc khách thanh toán, **chăm sóc khách** (module Chăm sóc KH).
5. Khách trả đủ → **đóng đơn**.

**Bài tập mẫu (làm 2 đơn):**
- **A.** Bán nhanh 1 **vé máy bay** HAN–SGN, 2 khách, giá vốn 2.600.000 / giá bán 3.200.000, thu cọc 3.200.000. → Kiểm tra đơn hiện trong danh sách, lãi hiển thị đúng 600.000đ.
- **B.** Bán nhanh 1 **tour ghép quốc tế** (chọn 1 sản phẩm có sẵn), **3 khách** → xem giá tự nhân theo số khách. Lập phiếu thu cọc 30%.

---

## 2. ĐIỀU HÀNH (Vận hành)

**Luồng việc:**
1. Nhận đơn đã chốt → **đặt dịch vụ với NCC** (vé, phòng, land tour…).
2. **Lập phiếu CHI** cho từng NCC: chọn đúng nhà cung cấp (link NCC), đính bill/hợp đồng.
3. **Gán hướng dẫn viên** cho đơn (nếu có).
4. Quản lý sản phẩm **Tour ghép**: thêm/sửa, dùng nút **⧉ Nhân bản** để tạo nhanh tour tương tự, khai **lịch khởi hành & giá theo đợt** nếu NCC chạy nhiều tháng.

**Bài tập mẫu:**
- Mở đơn tour ghép Sale vừa tạo → **lập phiếu CHI** trả NCC (chọn đúng NCC trong danh sách, nhập số tiền giá vốn, đính 1 ảnh bất kỳ làm bill) → gửi duyệt.
- Vào module **Tour ghép** → **Nhân bản** 1 tour, đổi đối tác/ngày khởi hành → lưu thành sản phẩm mới.

---

## 3. KẾ TOÁN TRƯỞNG

**Luồng việc:**
1. **Duyệt phiếu THU** của Sale (xác nhận tiền về tài khoản).
2. **Kiểm tra phiếu CHI** do Điều hành lập → đối chiếu chứng từ → **chuyển Ban Giám đốc duyệt**.
3. Theo dõi **công nợ phải thu / phải trả**, hóa đơn VAT.
4. Cuối ngày/kỳ: xem module **Kế toán** (Tổng quan, Sổ thu chi, Phải thu, Phải trả, VAT, Quỹ & NH), **xuất CSV** báo cáo.

**Bài tập mẫu:**
- Vào **Duyệt** → duyệt phiếu THU Sale vừa lập.
- Mở phiếu CHI Điều hành lập → kiểm tra → chuyển duyệt (đẩy lên Ban GĐ).
- Vào module **Kế toán** → tab **Sổ thu chi** → bấm **Xuất CSV**, mở bằng Excel kiểm tra tiếng Việt đúng.

---

## 4. THỦ QUỸ (Kế toán quỹ)

**Luồng việc:**
1. Sau khi Ban GĐ duyệt chi → **chi tiền thật** (chuyển khoản cho NCC), đánh dấu **đã chi**.
2. Ghi nhận **sổ quỹ / số dư ngân hàng**.

**Bài tập mẫu:**
- Vào **Duyệt** → với phiếu CHI đã được Ban GĐ duyệt, bấm **đã chi** (giả lập đã chuyển khoản) → kiểm tra tab **Quỹ & NH** trong module Kế toán thấy số dư giảm đúng.

---

## 5. BAN GIÁM ĐỐC (Giám đốc + Phó Giám đốc)

**Luồng việc:**
1. **Duyệt TẤT CẢ phiếu CHI** (không còn ngưỡng 20tr — công ty kiểm soát toàn bộ dòng tiền). Giám đốc *hoặc* Phó GĐ duyệt, chỉ cần 1 người.
2. Xem **Dashboard giám đốc**: doanh thu, lợi nhuận, chỉ tiêu nhân viên.
3. **Xóa đơn** (chỉ Giám đốc) khi cần.
4. Giao **chỉ tiêu** cho các bộ phận (module Nhân sự).

**Bài tập mẫu:**
- Đăng nhập `pgd.mv` (Phó GĐ) → vào **Duyệt** → **duyệt phiếu CHI** mà Kế toán trưởng vừa chuyển lên (kiểm tra PGĐ duyệt được khi GĐ vắng).
- Đăng nhập `tung.gd` (GĐ) → mở 1 đơn nháp → thử **Xóa đơn** (xác nhận chỉ GĐ làm được).

---

## 6. Bài test xuyên suốt (1 đơn đi trọn vòng — cả nhóm phối hợp)

Lấy **1 đơn tour ghép quốc tế 3 khách** chạy hết 10 bước trong sơ đồ:
Sale tạo đơn + thu cọc → Kế toán trưởng duyệt thu → Điều hành lập chi NCC → Kế toán trưởng kiểm tra → **Ban GĐ duyệt chi** → Thủ quỹ chi tiền → Sale thu nốt + đóng đơn → Kế toán xem lãi/lỗ trong module Kế toán.

> Mỗi người đánh dấu ✔ khi xong phần của mình. Vướng ở bước nào ghi lại (chụp màn hình) để báo lại điều chỉnh trước Go Live.

---

*Xem thêm 5 kịch bản chi tiết kèm số tiền cụ thể trong file QUY_TRINH_TEST_GO_LIVE.md.*
