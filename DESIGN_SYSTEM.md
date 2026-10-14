# DESIGN_SYSTEM.md
# Hệ Thống Thiết Kế Giao Diện — AI Video Shorts Automation & MCN Platform

**Phiên bản:** 1.0.0  
**Tình trạng:** Master UI/UX Specification & Design System  
**Căn cứ đặc tả:** `PROJECT.md` (Phần III, V, XIV, XVI, XX)  
**Triết lý cốt lõi:** Chuyên nghiệp, Tối ưu thông tin, Phản hồi nhanh, Không ngụy tạo số liệu

---

## 1. Triết Lý Thiết Kế & Định Vị Sản Phẩm

### 1.1. Bản Sắc Giao Diện (Design Persona)
Nền tảng là một **Hệ thống Điều hành Tác nghiệp Video AI (AI Video Operating System)** dành cho nhà sáng tạo nội dung chuyên nghiệp và nhà quản trị mạng lưới kênh (MCN). 

Khác với các ứng dụng tiêu dùng đơn giản (consumer apps) hoặc các trình làm video đồ chơi (toy tools), giao diện được định vị theo phong cách **High-Velocity AI Control Room**:
- **Tập trung cao độ (Deep Focus):** Tông nền tối cao cấp (Dark Mode First) giúp tối ưu độ tương phản cho tư liệu hình ảnh và video tỷ lệ 9:16.
- **Mật độ thông tin tối ưu (Information Density with Breathing Room):** Bố cục gọn gàng, giảm bớt khoảng trống lãng phí nhưng vẫn đảm bảo tính phân cấp thị giác rõ ràng bằng border 1px và elevation tinh tế.
- **Minh bạch & Phòng thủ (Defensive UX):** Mọi tài sản nội dung (claim, media, audio) đều thể hiện nguồn gốc, trạng thái bản quyền và tình trạng xác thực. Không che giấu lỗi, không hiển thị dữ liệu giả định (no fake metrics).
- **Thao tác tốc độ cao:** Phím tắt, batch actions, bảng điều khiển 3 phân vùng (3-pane studio) giúp giảm thiểu số lần chuyển trang.

---

## 2. Design Tokens & Hệ Thống Màu Sắc

### 2.1. Bảng Màu Nền Tảng (Surface & Neutrals)
Giao diện xây dựng trên thang màu Slate/Zinc sâu, loại bỏ hiện tượng đen tuyệt đối `#000000` để giảm mỏi mắt và tăng chiều sâu.

| Token | Giá trị HEX | Mô tả & Ứng dụng |
| :--- | :--- | :--- |
| `--surface-bg` | `#090D16` | Nền canvas ứng dụng tổng thể (App background) |
| `--surface-panel` | `#0F172A` | Nền panel phụ trợ, Sidebar, Header, Drawer |
| `--surface-card` | `#1E293B` | Nền thẻ component, Scene card, Dialog, Dropdown |
| `--surface-card-hover` | `#283548` | Trạng thái hover của thẻ và hàng trong bảng |
| `--surface-input` | `#0B1322` | Nền input text, textarea, select |
| `--border-subtle` | `rgba(255, 255, 255, 0.07)` | Đường ngăn cách nhẹ giữa các panel |
| `--border-default` | `rgba(255, 255, 255, 0.14)` | Đường viền thẻ card, input, button outline |
| `--border-focus` | `#6366F1` | Viền active khi focus hoặc chọn phần tử |

### 2.2. Màu Thương Hiệu & Thao Tác (Brand & Interactive Accents)
Hệ thống sử dụng bộ ba màu nhấn hiện đại đại diện cho quy trình sản xuất AI:

| Token | Giá trị HEX | Ý nghĩa nghiệp vụ |
| :--- | :--- | :--- |
| `--accent-primary` | `#6366F1` (Indigo 500) | Thao tác chính, Call-to-action (CTA), Active tab |
| `--accent-primary-hover`| `#4F46E5` (Indigo 600) | Hover button chính |
| `--accent-ai` | `#8B5CF6` (Violet 500) | Tác vụ trí tuệ nhân tạo (LLM generation, Prompting) |
| `--accent-pipeline` | `#06B6D4` (Cyan 500) | Trạng thái Render FFmpeg, Audio alignment, Pipeline |

### 2.3. Màu Trạng Thái Nghiệp Vụ (Semantic & Status Colors)
Phù hợp 100% với các enum trạng thái trong `PROJECT.md` (không phụ thuộc chỉ vào màu sắc mà luôn đi kèm Icon + Label).

```
+------------------------------------------------------------------------+
| Trạng thái          | Màu chữ/Icon | Màu nền badge        | Viền badge |
+------------------------------------------------------------------------+
| HEALTHY / SUCCESS   | #10B981      | rgba(16, 185, 129, 0.12)| #059669 |
| FREE_CONFIRMED      | (Emerald)    |                      |            |
| LICENSED / VERIFIED |              |                      |            |
+---------------------+--------------+----------------------+------------+
| DEGRADED / WARNING  | #F59E0B      | rgba(245, 158, 11, 0.12)| #D97706 |
| TRIAL / FREE_LIMITED| (Amber)      |                      |            |
| NEEDS_REVIEW        |              |                      |            |
+---------------------+--------------+----------------------+------------+
| ERROR / FAILED      | #F43F5E      | rgba(244, 63, 94, 0.12) | #E11D48 |
| OPEN_CIRCUIT        | (Rose)       |                      |            |
| RESTRICTED / PAID   |              |                      |            |
+---------------------+--------------+----------------------+------------+
| RUNNING / ACTIVE    | #0EA5E9      | rgba(14, 165, 233, 0.15)| #0284C7 |
| (Pulse animation)   | (Sky/Cyan)   |                      |            |
+---------------------+--------------+----------------------+------------+
| WAITING_PROVIDER    | #A855F7      | rgba(168, 85, 247, 0.12)| #7E22CE |
| WAITING_APPROVAL    | (Purple)     |                      |            |
+---------------------+--------------+----------------------+------------+
| UNVERIFIED / UNKNOWN| #94A3B8      | rgba(148, 163, 184, 0.1)| #475569 |
| DISABLED / DRAFT    | (Slate)      |                      |            |
+------------------------------------------------------------------------+
```

---

## 3. Typography (Kiểu Chữ)

### 3.1. Font Families
- **Font giao diện chính (UI Text):** `Inter`, `-apple-system`, `BlinkMacSystemFont`, `"Segoe UI"`, `sans-serif`. Đảm bảo hỗ trợ tiếng Việt hoàn hảo, dấu thanh rõ nét không bị dính vào chữ hoa.
- **Font kỹ thuật (Monospace / Code / Data):** `JetBrains Mono`, `"Fira Code"`, `Consolas`, `monospace`. Sử dụng cho Model Identifiers, Token count, Timestamps (00:01:240), JSON schema preview và Logs.

### 3.2. Bảng Phân Cấp Typography

| Cấp bậc | Size (rem / px) | Line-height | Weight | Ứng dụng |
| :--- | :--- | :--- | :--- | :--- |
| **Display** | `1.875rem` (30px) | `2.25rem` (36px) | 700 (Bold) | Tiêu đề trang trọng yếu, KPI lớn |
| **Heading 1** | `1.5rem` (24px) | `2rem` (32px) | 600 (Semi) | Tiêu đề màn hình (Dashboard, Studio) |
| **Heading 2** | `1.25rem` (20px) | `1.75rem` (28px) | 600 (Semi) | Tiêu đề nhóm chức năng, Modal title |
| **Heading 3** | `1rem` (16px) | `1.5rem` (24px) | 600 (Semi) | Tiêu đề card, Tên Scene, Tên Provider |
| **Body Large** | `0.9375rem` (15px) | `1.375rem` (22px) | 400/500 | Lời thoại kịch bản (Script editor) |
| **Body Base** | `0.875rem` (14px) | `1.25rem` (20px) | 400/500 | Văn bản bảng biểu, Mô tả thuộc tính |
| **Caption** | `0.75rem` (12px) | `1rem` (16px) | 500 (Med) | Meta info, Sub-labels, Badge tags |
| **Micro** | `0.6875rem` (11px) | `0.875rem` (14px) | 600 (Semi) | Timestamp mini, Tag phân loại hẹp |

---

## 4. Spacing, Radius & Bố Cục Không Gian

### 4.1. Hệ Thống Spacing (Lưới 4px chuẩn)
```css
--space-1: 0.25rem;  /* 4px  - Padding mini cho badge, micro icon gaps */
--space-2: 0.5rem;   /* 8px  - Khoảng cách các phần tử liên quan chặt */
--space-3: 0.75rem;  /* 12px - Padding input, button nhỏ */
--space-4: 1rem;     /* 16px - Padding card thông dụng, khoảng cách cột */
--space-5: 1.25rem;  /* 20px - Khoảng cách giữa các khối component */
--space-6: 1.5rem;   /* 24px - Padding panel studio, header */
--space-8: 2rem;     /* 32px - Khoảng cách giữa các section lớn */
--space-12: 3rem;    /* 48px - Margin layout container */
```

### 4.2. Border Radius
- `--radius-sm: 4px`: Cho status indicator, tag nhỏ, scrollbar thumb.
- `--radius-md: 8px`: Cho button, input, select, dropdown menu items.
- `--radius-lg: 12px`: Cho cards, modal dialogs, scene items, preview container.
- `--radius-xl: 16px`: Cho floating drawers, master panels.
- `--radius-full: 9999px`: Cho avatar, badge tròn, pill action buttons.

---

## 5. Quy Chuẩn Component Thư Viện

### 5.1. Nút Thao Tác (Button)
- **Primary:** Nền `--accent-primary` (`#6366F1`), chữ trắng, shadow nhẹ. Dùng cho hành động quyết định (Tạo kịch bản, Render video, Lưu cấu hình).
- **Secondary:** Nền `--surface-card`, viền `--border-default`, hover sáng hơn. Dùng cho thao tác phụ (Lọc, Thêm scene, Cấu hình model).
- **Ghost / Tertiary:** Không nền, hover `--surface-card-hover`. Dùng trong toolbar, icon-only button.
- **Danger:** Nền `--rose-600` hoặc viền đỏ kèm icon cảnh báo. Yêu cầu modal xác nhận đối với tác vụ hủy job hoặc xóa provider.
- **Loading State:** Thay thế icon bằng Spinner xoay tròn 16px và disable tương tác để chống bấm đúp (double-click submit).

### 5.2. Huy Hiệu Trạng Thái (Status Badges)
Mọi badge phải có:
1. Đèn chỉ báo (Dot indicator) hoặc Icon ngữ cảnh (Check, Alert, Clock, X).
2. Chuỗi chữ tiếng Việt hoặc thuật ngữ chuẩn theo `PROJECT.md` (ví dụ: `Miễn phí đã xác minh`, `Cần duyệt bản quyền`, `Hết Quota (429)`).
3. Tooltip giải thích khi hover nếu trạng thái mang tính cảnh báo.

### 5.3. Bảng Dữ Liệu (Data Tables)
- Header cố định (Sticky header) với viền dưới rõ rệt.
- Hỗ trợ sorting đa cột, filter theo status enum, checkbox chọn hàng loạt.
- Không để dữ liệu tràn viền (truncate text với tooltip hiển thị toàn văn).

### 5.4. Video Studio 3-Pane Layout
Màn hình trung tâm của nền tảng được cấu trúc 3 cột linh hoạt:
- **Cột Trái (Script & Storyboard Outline - 360px):** Danh sách cảnh (Scenes), lời bình (spoken text), từ khóa tìm kiếm và claim liên kết.
- **Cột Giữa (Vertical Canvas Preview & Timeline - linh hoạt, min 420px):**
  - Khung xem trước chuẩn 9:16 (1080x1920 scaled) với vạch safe-zone mô phỏng giao diện TikTok/Reels/Shorts.
  - Bộ thanh trượt timeline đồng bộ lời đọc (karaoke word-level sync scrubbing).
  - Nút play, pause, bước từng frame.
- **Cột Phải (Inspector & Asset Config - 380px):**
  - Lựa chọn tư liệu (Media candidates with rights check: GREEN/YELLOW/RED).
  - Cấu hình TTS giọng đọc và tốc độ (speed, pitch).
  - Lựa chọn Template đồ họa & vị trí phụ đề.

---

## 6. Iconography (Biểu Tượng Chuẩn)

Sử dụng bộ icon chuẩn **Lucide React** (kích thước 16px, 18px hoặc 20px, stroke-width: 1.75px).

- `LayoutDashboard`: Tổng quan hệ thống.
- `Clapperboard` / `Film`: Video Studio & Dự án video.
- `Bot` / `Cpu`: Quản trị AI Provider & Models.
- `Sparkles`: Tác vụ sinh bằng AI.
- `TrendingUp`: Săn xu hướng & Niche.
- `FolderCheck` / `ShieldCheck`: Bản quyền & Xác minh quyền tư liệu (`LICENSED`).
- `ShieldAlert`: Cảnh báo rủi ro bản quyền (`NEEDS_REVIEW`).
- `ShieldX`: Cấm sử dụng (`RESTRICTED` / `REJECTED`).
- `Volume2` / `Mic`: TTS & Cấu hình giọng đọc.
- `Calendar`: Lịch xuất bản mạng xã hội.
- `Send`: Xuất bản bài viết.
- `BarChart3`: Phân tích hiệu suất.
- `Settings`: Cài đặt hệ thống.

---

## 7. Khả Năng Tiếp Cận & Nguyên Tắc UX Phòng Thủ (Accessibility & Defensive UX)

### 7.1. Accessibility (WCAG 2.1 AA)
- Độ tương phản chữ cơ bản đạt tối thiểu **4.5:1** đối với văn bản thông thường và **3:1** đối với văn bản lớn.
- Focus Ring rõ ràng (`2px solid #6366F1`, offset `2px`) khi duyệt bằng phím `Tab`.
- Hỗ trợ đầy đủ thuộc tính `aria-label`, `role="status"` cho các cảnh báo pipeline.

### 7.2. Nguyên Tắc UX Phòng Thủ (Defensive UX)
Theo yêu cầu bắt buộc của `PROJECT.md`:
1. **Minh bạch bản quyền:** Tư liệu có trạng thái `UNKNOWN` hoặc `RESTRICTED` bị gắn cờ màu hổ phách/đỏ và **chặn nút xuất bản tự động** cho đến khi người dùng duyệt thủ công.
2. **Không số liệu giả định:** Nếu nguồn không cung cấp lượt view/like, hiển thị trạng thái `N/A - Không có dữ liệu` thay vì con số 0 giả mạo hoặc số ngẫu nhiên.
3. **Quản trị Quota AI:** Khi model trả về mã lỗi HTTP 429, giao diện lập tức cập nhật trạng thái `QUOTA_EXHAUSTED`, hiển thị thời gian chờ đề xuất và gợi ý chuyển sang model dự phòng (fallback).
4. **Bảo vệ khóa bí mật (Secret Privacy):** API key sau khi lưu chỉ hiển thị dạng masked `sk-proj-****...1234`, không cho phép copy lại nguyên văn khóa từ UI.

---

## 8. Quy Chuẩn Responsive & Điểm Ngắt (Breakpoints)

| Breakpoint | Kích thước | Hành vi giao diện |
| :--- | :--- | :--- |
| **Mobile (`sm`)** | `< 768px` | Sidebar chuyển thành Drawer trượt; Video Studio chuyển sang cơ chế Tab: `[Kịch bản] - [Xem trước 9:16] - [Thuộc tính]`. |
| **Tablet (`md`)** | `768px - 1023px`| Sidebar dạng rút gọn (Icon rail 64px); Video Studio hiển thị dạng 2 cột (Kịch bản + Xem trước). |
| **Desktop (`lg`)** | `1024px - 1439px`| Sidebar mở rộng chuẩn 240px; Video Studio đầy đủ 3 cột với thanh cuộn độc lập từng phân vùng. |
| **Wide (`xl`)** | `≥ 1440px` | Mở rộng không gian hiển thị danh sách cảnh và tăng tỷ lệ hiển thị chi tiết của khung 9:16. |

---
*Tài liệu này là quy chuẩn thiết kế duy nhất cho toàn bộ giao diện của dự án.*
