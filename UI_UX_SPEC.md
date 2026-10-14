# UI_UX_SPEC.md
# Đặc Tả Giao Diện & Trải Nghiệm Người Dùng (UI/UX Specification)
## Hệ Thống Tự Động Hóa Sản Xuất & Quản Trị Mạng Lưới Video Ngắn Bằng AI

**Phiên bản:** 1.0.0  
**Tình trạng:** Master Functional UI/UX Specification  
**Căn cứ đặc tả:** `PROJECT.md` (Phần II, V, VII, VIII, IX, X, XI, XIV, XV)  
**Phạm vi:** Sitemap, đặc tả từng màn hình, luồng tác vụ và xử lý tình huống bất thường

---

## 1. Kiến Trúc Thông Tin & Sơ Đồ Điều Hướng (Sitemap)

Hệ thống được tổ chức thành cấu trúc điều hướng dạng thanh bên cố định (Persistent Left Sidebar), chia thành 4 nhóm nghiệp vụ chính:

```
AuraShorts OS
├── 1. TỔNG QUAN & ĐIỀU HÀNH
│   ├── /dashboard                -> Bảng điều khiển tổng quan (Dashboard Overview)
│   ├── /niches                   -> Quản lý ngách nội dung (Niche Manager)
│   └── /trends                   -> Khảo sát xu hướng & Nguồn tin (Trend Explorer)
│
├── 2. SẢN XUẤT VIDEO (STUDIO)
│   ├── /videos                   -> Danh sách dự án video (Video Projects)
│   ├── /videos/:id/studio        -> Video Studio đa năng (Script, Media, Audio & Preview 9:16)
│   └── /media                    -> Thư viện tư liệu & Bản quyền (Media Library & Rights)
│
├── 3. HẠ TẦNG AI & TÀI NGUYÊN
│   ├── /ai-providers             -> Quản trị AI Provider & Models (AI Router Manager)
│   └── /ai-usage                 -> Nhật ký sử dụng Quota & Chi phí (Usage Ledger)
│
└── 4. PHÂN PHỐI & MẠNG LƯỚI (MCN)
    ├── /social-accounts          -> Tài khoản mạng xã hội (YouTube, TikTok, Facebook, IG)
    ├── /calendar                 -> Lịch xuất bản nội dung (Content Calendar)
    ├── /publishing-queue         -> Hàng đợi đăng bài & Phê duyệt (Publishing Queue)
    ├── /analytics                -> Báo cáo hiệu suất thực tế (Analytics Insights)
    └── /settings                 -> Cài đặt hệ thống & Chính sách bản quyền (Settings)
```

---

## 2. Đặc Tả Từng Màn Hình Cốt Lõi

### 2.1. Dashboard Overview (`/dashboard`)
*Mục đích:* Cung cấp cái nhìn toàn cảnh tức thời về năng lực sản xuất, tình trạng pipeline, cảnh báo quota AI và lịch trình đăng bài trong ngày.

#### A. Các khối chỉ số trọng yếu (KPI Widgets)
- **Tổng số Dự án Video:** Phân chia theo trạng thái: Đang dựng, Chờ duyệt, Sẵn sàng xuất bản.
- **Tình trạng Pipeline Workers:** Số lượng job đang chạy trong Celery/Redis; tỷ lệ thành công của các bước render FFmpeg.
- **AI Quota Health Meter:** Tình trạng kết nối các Provider ưu tiên (Google Gemini, Groq, OpenRouter, Cloudflare AI); cảnh báo ngay nếu có provider bị mã lỗi `HTTP 429` hoặc `OPEN_CIRCUIT`.
- **Lịch xuất bản hôm nay:** Số lượng video đã lên lịch; phân bổ theo kênh mục tiêu (Shorts, TikTok, Reels).

#### B. Khối hành động nhanh (Quick Action Bar)
- Nút `+ Tạo Video Mới Từ Xu Hướng`: Mở dialog chọn Niche và Topic có điểm xu hướng cao nhất.
- Nút `+ Thêm Provider AI Mới`: Chuyển nhanh tới cấu hình kết nối.
- Nút `Duyệt Nhanh Các Video Chờ (Batch Approval)`: Danh sách các video đã render xong cần xác nhận bản quyền và kịch bản.

#### C. Bảng Hàng đợi Tác vụ Gần đây (Recent Pipeline Jobs)
- Hiển thị danh sách 5 job gần nhất: Tên dự án, bước hiện tại (`GENERATE_SCRIPT`, `ALIGN_AUDIO`, `RENDER_VIDEO`), thanh tiến trình `%`, thời gian ước lượng và nút `Xem chi tiết/Hủy`.

---

### 2.2. Video Studio Đa Năng (`/videos/:id/studio`)
*Mục đích:* Đây là màn hình làm việc trung tâm quan trọng nhất của người vận hành. Cho phép kiểm soát toàn diện từ Kịch bản, Storyboard từng cảnh, Tư liệu hình ảnh/video, Giọng đọc AI, Phụ đề Karaoke tới Xem trước thành phẩm định dạng 9:16.

#### Bố cục 3 Phân vùng (3-Pane Workspace):

```
+-------------------------------------------------------------------------------------------------------+
| HEADER: Mã Dự Án | Tiêu đề | Niche: Công nghệ | Trạng thái: DRAFT / WAITING_APPROVAL | [Lưu] [Render Video]   |
+------------------------------------+------------------------------------+-----------------------------+
| CỘT TRÁI: KỊCH BẢN & PHÂN CẢNH    | CỘT GIỮA: PREVIEW CANVAS 9:16     | CỘT PHẢI: BẢN QUYỀN & TƯ LIỆU|
|                                    |                                    |                             |
| [Tab: Kịch bản] [Tab: Storyboard]  | +--------------------------------+ | [Phân cảnh đang chọn: Scene 02] |
|                                    | |   [Safe Zone TikTok/Shorts]    | |                             |
| - Scene 01 (00:00 - 00:04)         | |                                | | Tư liệu đang gán:           |
|   Lời bình: "Đây là con chip AI..."| |          [VIDEO FRAME]         | | - Tên: ai_chip_macro.mp4    |
|   Visual: Cận cảnh vi xử lý        | |                                | | - Nguồn: Wikimedia (CC-BY)  |
|   [Tạo lại cảnh này bằng AI]       | |                                | | - Bản quyền: [LICENSED]     |
|                                    | |                                | |                             |
| - Scene 02 (00:04 - 00:08) [Active]| |       "đây là con chip AI"     | | Ứng viên đề xuất (Candidates):|
|   Lời bình: "Nó sở hữu tốc độ..."  | |        [Karaoke Highlight]     | | [Ảnh 1 - CC0] (Điểm: 94)    |
|   Claims: #Claim-02 (Verified)     | |                                | | [Ảnh 2 - Needs Review]     |
|   Từ khóa: "neural processing unit"| +--------------------------------+ |                             |
|                                    | [Play] [Pause] 00:06 / 00:58       | Cấu hình giọng đọc (TTS):   |
| - Scene 03 (00:08 - 00:13)         | ====================|============= | - Voice: Tiếng Việt Nam (HN)|
|   ...                              | Timeline Audio & Subtitle Scrub    | - Tốc độ: 1.1x | Pitch: Chuẩn|
+------------------------------------+------------------------------------+-----------------------------+
```

#### Thành phần chi tiết:
1. **Phân cảnh (Scene Card):**
   - Đánh số thứ tự cảnh (`order`), thời lượng ước tính (`duration_ms`).
   - Ô nhập lời thoại kịch bản (cho phép chỉnh sửa trực tiếp không mất lịch sử).
   - Danh sách claims và liên kết nguồn dữ kiện đã thu thập (Fact-check reference).
   - Nút `Regenerate Scene`: Gửi yêu cầu AI Router sinh lại lời bình hoặc gợi ý visual riêng cho cảnh mà không làm xáo trộn các cảnh khác.
2. **Khung Preview Chuẩn 9:16:**
   - Khung hình tỷ lệ 1080 × 1920 được scale mượt mà theo độ phân giải màn hình.
   - Nút bật/tắt **Lưới vùng an toàn (Overlay Safe Zone Guide):** hiển thị viền mờ của các nút tương tác mạng xã hội (nút Like, Comment, Share bên phải của TikTok/Shorts; vùng tiêu đề phía dưới) nhằm tránh tình trạng phụ đề bị che khuất.
   - Hiển thị phụ đề động (Karaoke subtitle) đồng bộ chính xác theo từng từ (word-level timestamps).
3. **Thanh Timeline Đồng bộ:**
   - Dải waveform hiển thị sóng âm thanh lời đọc (TTS).
   - Các mốc ranh giới giữa các cảnh để kéo thả căn chỉnh thời gian.
4. **Bộ Phân tích Tư liệu & Bản quyền (Inspector):**
   - Hiển thị 3 mức phân loại quyền sử dụng theo `PROJECT.md`:
     - `GREEN (LICENSED / USER_OWNED / PUBLIC_DOMAIN_VERIFIED)`: An toàn cho xuất bản tự động.
     - `YELLOW (NEEDS_REVIEW)`: Yêu cầu người vận hành xác minh bằng tay.
     - `RED (RESTRICTED / REJECTED)`: Bị chặn tuyệt đối khỏi đường render tự động.
   - Nút `Tải lên tư liệu thay thế (Manual Upload)` hoặc `Tìm kiếm tư liệu bổ sung`.

---

### 2.3. AI Provider Manager (`/ai-providers`)
*Mục đích:* Quản lý toàn bộ các nhà cung cấp AI theo Phần V của `PROJECT.md`. Hỗ trợ thêm dịch vụ miễn phí, kiểm tra kết nối thật (live connection test), tự khám phá catalog và cấu hình fallback chống gián đoạn quy trình.

#### Thành phần chính:
1. **Thanh chế độ định tuyến (Routing Policy Selector):**
   - `FREE_ONLY` (Mặc định bắt buộc): Chỉ định tuyến công việc tới các model đã xác minh miễn phí. Tuyệt đối không tự nhảy sang model tính phí.
   - `MANUAL_PRIORITY`: Định tuyến theo danh sách thứ tự ưu tiên do người dùng thiết lập.
   - `QUALITY_FIRST`: Ưu tiên năng lực mô hình cao nhất trong tập danh sách cho phép.
2. **Danh sách Provider Cards:**
   - Mỗi thẻ nhà cung cấp (Google Gemini, Groq, OpenRouter, Cloudflare AI, Custom OpenAI-compatible):
     - **Tên & Loại kết nối:** Tên hiển thị, Base URL, loại xác thực.
     - **Trạng thái Circuit Breaker:** Badge `HEALTHY`, `DEGRADED`, hoặc `OPEN_CIRCUIT`.
     - **Chỉ số thời gian thực:** Độ trễ trung bình (Latency ms), Tỷ lệ lỗi gần nhất, Số request trong 24h.
     - **Quota Monitor:** requests/minute, tokens/day hoặc trạng thái `UNKNOWN` nếu provider không cung cấp header hạn mức.
     - **Hành động:**
       - Nút `Test Connection`: Gửi ping HTTP thực tế để kiểm tra khóa API.
       - Nút `Khám phá Model (Discover Catalog)`: Tự động gọi endpoint catalog để liệt kê các model mới nhất.
       - Nút `Thêm Model Thủ Công`: Dành cho các provider không hỗ trợ tự khám phá danh mục.
3. **Bảng Gán Năng lực AI theo Tác vụ (Task-to-Capability Routing Matrix):**
   - Viết kịch bản (Scripting): Chỉ định model hỗ trợ `text_generation` + `structured_output` (Ví dụ: `gemini-1.5-flash`).
   - Phân tích tư liệu hình ảnh: Chỉ định model có capability `vision`.
   - Giọng đọc AI: Chỉ định provider `text_to_speech`.
   - Đồng bộ từ (Forced Alignment): Chỉ định provider/engine chuyên biệt.

---

### 2.4. Khảo Sát Xu Hướng & Ngách (`/trends` & `/niches`)
*Mục đích:* Phát hiện các chủ đề nóng có tiềm năng chuyển đổi thành video ngắn triệu view mà không phụ thuộc vào một trang báo duy nhất.

- **Niche Selector:** Chọn danh mục nội dung (Công nghệ, Tài chính số, Khoa học, Khám phá bí ẩn, Lịch sử).
- **Trend Topic Cards:**
  - Tiêu đề chủ đề xu hướng.
  - Điểm xu hướng (`Trend Score` từ 0 - 100) kèm nhãn giải thích nguồn gốc tín hiệu (Số nguồn cùng đưa tin, tốc độ tăng trưởng).
  - Tình trạng kiểm chứng dữ kiện (`SUPPORTED`, `UNVERIFIED`, `CONFLICTING_SOURCES`).
  - Nguồn tin đối chiếu: Hiển thị favicon, tên báo chí/RSS và trích đoạn dẫn chứng.
  - Nút bấm trực tiếp: `Tạo Video từ Chủ đề này` (chuyển ngay sang Video Studio với kịch bản được nạp sẵn).

---

### 2.5. Hàng Đợi Xuất Bản & Quản Trị Kênh (`/publishing-queue` & `/social-accounts`)
*Mục đích:* Thực thi quy trình xuất bản đa nền tảng có kiểm soát bản quyền và chống đăng trùng.

- **Chế độ kiểm duyệt (Approval Gate):**
  - Danh sách video ở trạng thái `WAITING_FOR_APPROVAL`: Hiển thị video preview 9:16, danh sách kênh nhận bài, tiêu đề, caption, hashtags được AI gợi ý.
  - Nút `Phê Duyệt & Đăng Ngay (Approve & Publish)` kèm cảnh báo xác nhận.
- **Bảng Theo dõi Hàng Đợi (Publishing Queue Table):**
  - Dự án video liên kết.
  - Kênh đích (YouTube Shorts, TikTok, Facebook Reels).
  - Khóa Idempotency Key (chống gửi trùng lặp khi mạng chập chờn).
  - Trạng thái đăng: `QUEUED`, `UPLOADING`, `PUBLISHED`, `PUBLISH_RESULT_UNKNOWN` (chờ reconcile).
  - Nút `Reconcile Status`: Kiểm tra trạng thái bài đăng trên mạng xã hội trước khi cho phép thử lại.

---

## 3. Các Luồng Thao Tác Trọng Tâm (Core User Flows)

### 3.1. Luồng 1: Từ Xu Hướng Mới Đến Bản Dựng Hoàn Chỉnh
```
[Trend Explorer] -> Chọn chủ đề có điểm xu hướng cao
       │
       ▼
[Kiểm Tra Nguồn & Dữ Kiện] -> Hệ thống tổng hợp các nguồn RSS/Tin tức độc lập
       │
       ▼
[Khởi Tạo Kịch Bản & Storyboard] -> AI Router điều phối model sinh kịch bản tiếng Việt có cấu trúc
       │
       ▼
[Chuyển Sang Video Studio] -> Tự động nạp danh sách phân cảnh (Scenes)
       │
       ▼
[Kiểm Soát Quyền Tư Liệu] -> AI Vision quét và xếp hạng media:
       ├─ Xanh lá: Tự động gán vào Scene
       └─ Vàng/Đỏ: Người dùng thay thế bằng tư liệu kho cá nhân
       │
       ▼
[Tạo Audio & Khớp Từ] -> TTS phát âm chuẩn -> Forced alignment tạo timestamp
       │
       ▼
[Bấm 'Render Video'] -> Chuyển tác vụ sang Celery/FFmpeg Worker nền
```

---

### 3.2. Luồng 2: Cấu Hình Nhà Cung Cấp AI & Xử Lý Quota
```
[Vào AI Provider Manager] -> Bấm [+ Thêm Provider]
       │
       ▼
[Điền Thông Tin Kết Nối] -> Chọn kiểu (Gemini / Groq / OpenAI Compatible) + Nhập Base URL + API Key
       │
       ▼
[Bấm 'Test Kết Nối'] -> Hệ thống gửi request thật xác thực key (không hiển thị pass giả)
       │
       ▼
[Tự Khám Phá Catalog] -> Lấy danh sách model khả dụng từ provider
       │
       ▼
[Xác Minh Điều Kiện Miễn Phí] -> Đánh dấu FREE_CONFIRMED hoặc FREE_LIMITED
       │
       ▼
[Kích Hoạt Model & Dự Phòng] -> Thiết lập thứ tự fallback khi gặp mã lỗi 429
```

---

## 4. Xử Lý Tình Huống Bất Thường (Defensive UX States)

| Tình huống ngoại lệ | Hành vi giao diện & Cách phản hồi |
| :--- | :--- |
| **Model AI hết Quota (Mã 429)** | Hiển thị Banner màu hổ phách trên đỉnh màn hình Studio: *"Model `gemini-1.5-flash` đã đạt giới hạn rate-limit. Đã tự động kích hoạt fallback sang `groq-llama-3`. Công việc không bị gián đoạn."* |
| **Tư liệu có tranh chấp bản quyền** | Scene Card chuyển viền màu đỏ cam, nút `Render Video` bị vô hiệu hóa kèm tooltip: *"Cảnh 03 chứa tư liệu có trạng thái `RESTRICTED`. Hãy thay thế tư liệu hợp lệ trước khi render."* |
| **Đứt kết nối mạng khi đang render** | Trạng thái Job không bị mất; hệ thống lưu Checkpoint từng bước. Khi mở lại trang, xuất hiện nút: *"Tiếp tục render từ bước 4 (Subtitle Burn-in) mà không cần tạo lại Audio."* |
| **Đăng bài mạng xã hội bị timeout** | Trạng thái đặt là `PUBLISH_RESULT_UNKNOWN`. Giao diện vô hiệu hóa nút 'Đăng lại ngay' và hiển thị nút `Kiểm tra đối soát (Reconcile)` để tránh tạo bài trùng lặp trên kênh người dùng. |

---
*Tài liệu này là đặc tả chức năng giao diện chuẩn mực để triển khai prototype và hệ thống giao diện chính thức.*
