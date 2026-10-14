# DESIGN_SYSTEM.md
# Hệ Thống Thiết Kế Giao Diện — AuraShorts OS (Modern Glass & Friendly Control Room)

**Phiên bản:** 2.0.0 (Bản nâng cấp thẩm mỹ hiện đại, thân thiện & tách biệt nguồn thủ công)  
**Căn cứ đặc tả:** `PROJECT.md` & Phản hồi người dùng (User Design Direction)  
**Triết lý:** Tối ưu trải nghiệm (Friendly UX), Thẩm mỹ cao cấp (Modern Dark Glassmorphism), Rõ ràng, Dễ dùng cho mọi cấp độ người vận hành

---

## 1. Triết Lý Thiết Kế Mới: "Friendly Glass Studio"

Dựa trên phản hồi thực tế, giao diện được tái cấu trúc từ phong cách điều khiển kỹ thuật nặng nề sang **Modern Creator OS**:
- **Thân thiện & Dễ tiếp cận (Intuitive & Friendly):** Loại bỏ các khối thuật ngữ gây bối rối; sử dụng từ ngữ tiếng Việt tự nhiên, trực quan (ví dụ: *"Dán link báo chí"* thay vì *"Manual Connector Ingestion"*).
- **Tone Màu Cao Cấp (Aesthetic Obsidian & Neon Accents):**
  - Chuyển từ tông xám đen phẳng sang **Obsidian Deep Space** (`#0B0F19`) với các mảng sáng nền mờ (atmospheric radial glow) tím chìm (`rgba(99, 102, 241, 0.05)`).
  - Sử dụng hiệu ứng **Glassmorphism tinh tế:** Panel và Card dùng nền trong suốt mờ ảo `rgba(17, 24, 39, 0.7)` kết hợp `backdrop-filter: blur(16px)` và viền sáng mảnh `rgba(255, 255, 255, 0.08)`.
  - Gradient nhấn mượt mà: Gradient Indigo-to-Cyan (`linear-gradient(135deg, #6366F1, #06B6D4)`) cho các nút hành động chính, tạo cảm giác hiện đại như các sản phẩm hàng đầu (Linear, Raycast, Vercel).
- **Tách Biệt Rõ Ràng Hai Nguồn Kịch Bản:**
  1. **Nguồn Thủ Công (Manual Link / URL Ingestion):** Người dùng chủ động gửi link bài viết, AI đọc nội dung và phân tích kịch bản.
  2. **Nguồn Tự Động (AI Trend Radar):** AI tự động quét mạng lưới RSS và mạng xã hội theo ngách đã cấu hình.

---

## 2. Design Tokens & Bảng Màu Tinh Chỉnh

### 2.1. Thang Màu Bề Mặt (Surface Layers)
| Token | HEX / RGBA | Vai trò thị giác |
| :--- | :--- | :--- |
| `--surface-canvas` | `#080C15` | Nền canvas toàn hệ thống, tạo độ sâu vô cực |
| `--surface-panel` | `rgba(15, 23, 42, 0.75)` | Thanh điều hướng (Sidebar), Header với hiệu ứng Blur |
| `--surface-card` | `rgba(30, 41, 59, 0.65)` | Thẻ phân cảnh, Card provider, Hộp nhập link |
| `--surface-card-hover`| `rgba(51, 65, 85, 0.8)` | Trạng thái hover có hiệu ứng nổi nhẹ |
| `--surface-input` | `rgba(11, 19, 34, 0.85)` | Khung nhập URL, textarea lời bình, select box |
| `--glass-border` | `rgba(255, 255, 255, 0.08)`| Đường viền kính mảnh 1px thanh lịch |
| `--glass-border-focus`| `rgba(99, 102, 241, 0.4)`| Viền phát sáng nhẹ khi click tương tác |

### 2.2. Điểm Nhấn Màu Sắc (Accent Radiance)
- **Primary Brand:** `#6366F1` (Electric Indigo) kết hợp `#8B5CF6` (Violet).
- **Secondary Action:** `#06B6D4` (Cyan Glow) cho quy trình xử lý video và trích xuất.
- **Success / Licensed:** `#10B981` (Emerald) — Mang lại cảm giác tin cậy, nhẹ nhàng.
- **Warning / Review Needed:** `#F59E0B` (Warm Amber) — Cảnh báo thân thiện, không gây giật mình.
- **Error / Restricted:** `#F43F5E` (Rose Coral) — Rõ ràng, lịch sự.

---

## 3. Typography & Bố Cục Thân Thiện

- **UI Headings:** Font chữ sans-serif hiện đại, độ đậm vừa phải (Semi-bold 600 thay vì Bold nặng nề), khoảng cách dòng thoáng (line-height 1.5).
- **Hộp Nhập URL Trực Quan:** Kích thước lớn, có nút "Dán từ clipboard", tự động nhận diện favicon của nguồn báo chí (VnExpress, Tuổi Trẻ, TechCrunch...).
- **Quy Trình 3 Bước Dễ Hiểu:**
  1. *Dán Link Nguồn* ➔ 2. *AI Đọc & Phân Tích Sự Thật* ➔ 3. *Tạo Kịch Bản 9:16 & Vào Studio*

---

## 4. Bố Cục Video Studio Tối Ưu Tương Tác

- Khung xem trước 9:16 nằm ở trung tâm với viền mỏng bo tròn 24px mô phỏng smartphone hiện đại, có bóng đổ mềm (soft ambient shadow).
- Phụ đề Karaoke với chữ trắng nổi bật trên nền đen mờ bo tròn, chữ đang đọc phát sáng vàng ấm (`#FBBF24`).
- Thẻ phân cảnh (Scene Cards) có độ rộng hợp lý, dễ đọc, có nút bấm to rõ ràng, không gây cảm giác rối mắt.

---
*Bản thiết kế này khắc phục triệt để cảm giác kỹ thuật khô cứng, mang lại trải nghiệm sáng tạo video hiện đại và lôi cuốn.*
