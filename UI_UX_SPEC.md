# UI_UX_SPEC.md
# Đặc Tả Giao Diện & Trải Nghiệm Người Dùng (UI/UX Specification v2.0)
## Hệ Thống Tự Động Hóa Sản Xuất & Quản Trị Mạng Lưới Video Ngắn Bằng AI

**Phiên bản:** 2.0.0 (Cập nhật giao diện thân thiện & Tách biệt module Trích xuất kịch bản từ Link bài viết)  
**Căn cứ đặc tả:** `PROJECT.md` & Yêu cầu nghiệp vụ người dùng

---

## 1. Sơ Đồ Điều Hướng Cập Nhật (Sitemap Architecture)

Hệ thống phân định rành mạch giữa **Nguồn Thủ Công (Manual Input)** và **Nguồn Tự Động (Automated Radar)**:

```
AuraShorts OS
├── 1. KHỞI TẠO NỘI DUNG (CONTENT SOURCES)
│   ├── /url-to-video            -> [CHỨC NĂNG MỚI] Tạo Video Từ Link Báo/Bài Viết (Thủ Công)
│   ├── /trends                  -> Săn Xu Hướng & Niche Tự Động (AI Radar)
│   └── /niches                  -> Quản lý chủ đề & Ngách nội dung
│
├── 2. SẢN XUẤT & BIÊN TẬP (STUDIO)
│   ├── /dashboard               -> Bảng điều khiển tổng quan
│   ├── /videos                  -> Danh sách dự án video
│   ├── /videos/:id/studio       -> Video Studio 9:16 (Phân cảnh, Karaoke, Quyền tư liệu)
│   └── /media                   -> Thư viện tư liệu bản quyền
│
├── 3. HẠ TẦNG AI ROUTER
│   └── /ai-providers            -> Quản lý AI Provider, Model, Quota & Fallback
│
└── 4. QUẢN TRỊ KÊNH & XUẤT BẢN (MCN)
    ├── /publishing-queue        -> Hàng đợi đăng bài (Idempotent safe-publish)
    ├── /social-accounts         -> Tài khoản YouTube, TikTok, Facebook, Instagram
    └── /analytics               -> Thống kê hiệu suất
```

---

## 2. Đặc Tả Chức Năng Mới: Tạo Video Từ Link Bài Viết (`/url-to-video`)

### 2.1. Mục Tiêu Nghiệp Vụ
Cho phép người dùng chủ động gửi bất kỳ đường link bài viết, trang báo điện tử (VnExpress, Tuổi Trẻ, Bloomberg, Reuters, TechCrunch...) hoặc tài liệu trực tuyến.
AI sẽ:
1. Đọc và trích xuất nội dung bài viết (bỏ qua quảng cáo, menu rác).
2. Lọc ra 3–5 sự kiện/luận điểm chính (Fact Claims) có dẫn chứng rõ ràng.
3. Chuyển đổi thành kịch bản video ngắn (Hook 3 giây mở đầu, thân bài súc tích 130–160 từ tiếng Việt, lời kêu gọi hành động cuối video).
4. Tự động sinh Storyboard theo từng cảnh chuẩn 9:16 và chuyển vào Video Studio để dựng.

**Lưu ý bắt buộc:** Chức năng này độc lập hoàn toàn với module quét xu hướng tự động (`/trends`). Người dùng hoàn toàn làm chủ nguồn tin đầu vào.

### 2.2. Bố Cục Giao Diện Màn Hình `/url-to-video`
- **Vùng 1: Hộp Nhập Link Trực Quan:**
  - Ô input lớn hỗ trợ dán nhanh từ clipboard.
  - Kiểm tra tính hợp lệ của URL (bảo vệ SSRF theo Mục 89 của `PROJECT.md`, chặn địa chỉ nội bộ).
  - Các gợi ý link tin tức mẫu để thử nghiệm nhanh (VnExpress Công Nghệ, Báo Điện Tử, Reuters...).
- **Vùng 2: Tùy Chọn Định Hướng Video:**
  - *Thời lượng mục tiêu:* 30 giây (Tin nóng) | 60 giây (Chuẩn Shorts) | 90 giây (Chuyên sâu).
  - *Phong cách kể chuyện:* Tin tức khách quan | Hào hứng kích thích | Kể chuyện bí ẩn | Phân tích chuyên gia.
  - *Giữ nguồn trích dẫn:* Bật/tắt hiển thị tên báo gốc trong watermark hoặc tiêu đề video.
- **Vùng 3: Khung Tiến Trình Phân Tích Thông Minh (Live Extraction Pipeline):**
  - Hiển thị từng bước AI xử lý trực quan:
    - `[1] Đọc & Làm Sạch Bài Viết`
    - `[2] Bóc Tách Luận Điểm Cốt Lõi (Fact Claims)`
    - `[3] Sinh Kịch Bản Tiếng Việt Chuẩn Ngữ Pháp & Giọng Điệu`
    - `[4] Phân Cảnh Storyboard & Gợi Ý Tư Liệu 9:16`
- **Vùng 4: Xem Trước Kịch Bản & Nút Chuyển Vào Studio:**
  - Xem trước kịch bản hoàn chỉnh kèm thời lượng ước tính.
  - Nút bấm nổi bật: **"Chuyển Vào Video Studio Để Dựng Ngay"** -> mở ngay giao diện Studio 9:16 với dữ liệu vừa trích xuất.

---

## 3. Cải Tiến Thẩm Mỹ & Trải Nghiệm (Visual & UX Overhaul)

1. **Giao diện hiện đại hơn, bớt cảm giác khô cứng:**
   - Dùng nền Obsidian sâu thẳm kết hợp kính mờ (Glassmorphism).
   - Màu sắc hài hòa, các thẻ bo tròn mềm mại 16px - 20px.
   - Thêm các icon sinh động, hướng dẫn thân thiện, không dùng từ ngữ kỹ thuật đánh đố người dùng.
2. **Video Studio Dễ Dùng Hơn:**
   - Khung điện thoại 9:16 được thiết kế như một chiếc iPhone hiện đại với viền bo tròn và dynamic island.
   - Phụ đề Karaoke hiển thị rõ nét, chữ to dễ đọc, từ đang đọc đổi màu vàng nổi bật.
   - Nút bật/tắt Safe-Zone giúp người dùng hình dung chính xác video khi lên TikTok/Shorts sẽ như thế nào.
3. **AI Provider Manager Trực Quan Hơn:**
   - Các thẻ provider hiển thị trạng thái "Miễn phí 100%" bằng huy hiệu xanh tươi sáng, giúp người dùng an tâm tuyệt đối về chi phí.

---
*Bản đặc tả v2.0 này đáp ứng chính xác nhu cầu sử dụng thực tế của người vận hành.*
