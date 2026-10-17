# BÁO CÁO KIỂM TOÁN ĐỘC LẬP LƯỢT 2 (SECOND-PASS AUDIT REPORT)
**Dự án:** StoryMXH / AuraShorts OS  
**Thời gian kiểm toán:** 16/10/2026 - 17/10/2026 (Local: 00:15)  
**Môi trường:** Windows • Python 3.14.6 • Node.js / Vite React 19 • FFmpeg 9.0.2  
**Trạng thái máy chủ:** Backend (:8000) & Frontend (:5173) hoạt động liên tục, bảo toàn các tiến trình hệ thống khác (`oracle`, `cloudflared`).

---

## 1. ĐỐI CHIẾU & ĐÁNH GIÁ CÁC TUYÊN BỐ CỦA BÁO CÁO LƯỢT 1

| STT | Tuyên bố của báo cáo cũ (`BUG_AUDIT_REPORT.md`) | Kết quả kiểm toán Lượt 2 | Đánh giá độc lập | Chi tiết bằng chứng & Phát hiện thực tế |
|:---:|:---|:---:|:---:|:---|
| 1 | **Âm thanh thiếu nhạc nền (BGM):** Tạo file `storage/media/bgm_cinematic.mp3` 120s và ducking tự động (-22dB). | **PARTIALLY_VERIFIED** *(Trước sửa)*<br>➜ **VERIFIED** *(Sau sửa)* | Ban đầu, file BGM chỉ tồn tại do script thủ công tạo ra trong thư mục untracked `storage/media/`. Mã nguồn không có cơ chế tự sinh (`ensure_bgm`), khiến môi trường mới (clean checkout) vẫn bị mất BGM. File cũ thực chất là Mono (`channels=1`). Đã bổ sung module [`bgm_helper.py`](file:///c:/Users/ADMIN/Desktop/storymxh/backend/app/services/media/bgm_helper.py) tự động tổng hợp Stereo 44.1kHz 192kbps khi thiếu. |
| 2 | **Lỗi sập dây chuyền (Cascade failure) do crawler 404:** Cơ chế tự phục hồi dữ kiện (Self-Healing Fallback). | **FAILED** *(Nguyên bản)*<br>➜ **VERIFIED** *(Sau sửa)* | Bản sửa lượt 1 chứa lỗ hổng logic: tự tiện lấy slug từ URL bất kỳ (kể cả URL rác như `127.0.0.1:54321/nonexistent.htm` ➜ title "Nonexistent") và báo thành công (`extracted`). Lỗi này che giấu thất bại thực tế (False Success). Đã sửa lại: chỉ self-heal khi caller/trend cung cấp facts hợp lệ; nếu URL chết và không có facts, phải báo lỗi `CONNECTION_ERROR` để kích hoạt retry/cascade fail đúng chuẩn. |
| 3 | **Cơ chế Retry & Failure State trong Orchestrator:** Bounded retry và cascade failure ghi nhận vào DB. | **FAILED** *(Treo vô hạn)*<br>➜ **VERIFIED** *(Sau sửa)* | Phát hiện lỗi nghiêm trọng: `pipeline_runner.py` gọi `TaskStateMachine.calculate_backoff_delay`, nhưng hàm trong `state_machine.py` tên là `calculate_backoff_seconds`. Lỗi `AttributeError` này không được bắt, khiến worker crash ngầm khi retry lần 1, không ghi nhận DB và treo vĩnh viễn tiến trình. Đã sửa alias và phương thức, xác nhận 3 lần retry hoàn tất trong DB và set `PlanStatus.FAILED`. |
| 4 | **Hình ảnh theo chuyên mục (Niche separation):** Chống tái sử dụng ảnh sai chủ đề, tách pool Unsplash/Bing. | **VERIFIED** | Đã kiểm thử độc lập 4 chủ đề ngách (Hạ tầng, Công nghệ vi mạch, Lịch sử, Pháp luật). Mỗi chủ đề trích xuất đúng ảnh từ báo chí/editorial thực tế, không dùng ảnh cũ chéo project. |
| 5 | **Frontend Video Studio Lockup:** Gỡ cờ `hasRenderedCurrentProject`, kiểm tra trực tiếp `video_url`. | **VERIFIED** | Video Player nhận đúng `video_url`, tự động mount và unlock video. `npm run build` biên dịch 1931 modules với 0 lỗi TypeScript. |
| 6 | **Windows Console Unicode/Charmap Crash:** Tránh `UnicodeEncodeError` khi in log ra console. | **VERIFIED** | Mã hóa an toàn chuỗi tiếng Việt và emoji hoạt động ổn định trên PowerShell/CMD. |

---

## 2. CÁC LỖI MỚI PHÁT HIỆN TRONG LƯỢT 2 VÀ CÁCH SỬA TẬN GỐC

### Lỗi A: Thiếu tính tự chủ BGM (Fragile Asset Dependency)
- **Mức độ:** Nghiêm trọng (Chất lượng âm thanh).
- **Nguyên nhân:** File `storage/media/bgm_cinematic.mp3` nằm trong thư mục local không commit Git. Nếu chạy trên Docker, CI/CD hoặc máy mới, file không tồn tại và cả `studio.py` lẫn `task_handlers.py` đều lặng lẽ bỏ qua nhạc nền.
- **Sửa tận gốc:** Tạo [`backend/app/services/media/bgm_helper.py`](file:///c:/Users/ADMIN/Desktop/storymxh/backend/app/services/media/bgm_helper.py) với hàm `ensure_bgm_cinematic()`. Nếu file chưa có trên đĩa, tự động dùng FFmpeg tổng hợp 120s nhạc nền Ambient Lo-Fi chuẩn Stereo 44.1kHz 192kbps chỉ trong 0.18 giây. Tích hợp lệnh gọi này vào đầu quy trình render của Studio và DAG Orchestrator.

### Lỗi B: Báo thành công giả mạo (False Success) khi crawler gặp link chết
- **Mức độ:** Nghiêm trọng (Sai lệch dữ liệu & vi phạm Quality Gate).
- **Nguyên nhân:** Khi URL không truy cập được, mã nguồn cũ tự chế ra tiêu đề từ URL slug (ví dụ link `.../404-not-found` thành bài viết về "404 Not Found") và đánh dấu task là `extracted`.
- **Sửa tận gốc:** Trong [`backend/app/services/orchestrator/task_handlers.py`](file:///c:/Users/ADMIN/Desktop/storymxh/backend/app/services/orchestrator/task_handlers.py#L286-L310), chỉ áp dụng self-healing khi `input_payload` có chứa dữ kiện tin cậy (`title` do Trend Explorer hoặc người dùng cung cấp). Nếu người dùng nhập link báo hỏng và không có dữ kiện, hệ thống ném ngoại lệ `TaskHandlerError(CONNECTION_ERROR)`, ghi nhận đúng thất bại nghiệp vụ.

### Lỗi C: Worker treo vĩnh viễn do sai tên hàm Backoff (`calculate_backoff_delay`)
- **Mức độ:** Khóa chết hệ thống (Blocker).
- **Nguyên nhân:** `pipeline_runner.py` gọi `TaskStateMachine.calculate_backoff_delay(task.current_attempt)` nhưng `TaskStateMachine` trong `state_machine.py` chỉ có `calculate_backoff_seconds`. Khi xảy ra lỗi retryable lần đầu tiên, ngoại lệ `AttributeError` ném ra làm gãy luồng thực thi trước khi kịp cập nhật trạng thái FAILED vào database, khiến kế hoạch DAG bị kẹt vĩnh viễn ở trạng thái `RUNNING`.
- **Sửa tận gốc:** Bổ sung alias `calculate_backoff_delay = calculate_backoff_seconds` vào [`backend/app/services/orchestrator/state_machine.py`](file:///c:/Users/ADMIN/Desktop/storymxh/backend/app/services/orchestrator/state_machine.py#L60-L64) và đồng bộ trong `pipeline_runner.py`.

### Lỗi D: Xung đột vòng lặp sự kiện (Event Loop Binding) trong `PipelineRunner`
- **Mức độ:** Trung bình (Ảnh hưởng kiểm thử tự động và đa luồng).
- **Nguyên nhân:** `PipelineRunner` khởi tạo `asyncio.Semaphore` và `asyncio.Event` trong module scope, gắn cố định vào event loop ban đầu. Khi chạy qua `anyio.run` hoặc worker loop mới, các tác vụ bị khóa do Future gắn vào loop đã đóng.
- **Sửa tận gốc:** Trong [`backend/app/services/orchestrator/pipeline_runner.py`](file:///c:/Users/ADMIN/Desktop/storymxh/backend/app/services/orchestrator/pipeline_runner.py#L45-L70), thuộc tính `semaphore` và `get_pause_event` tự động đối chiếu với `asyncio.get_running_loop()`, tái tạo primitive an toàn tương thích với loop hiện hành.

---

## 3. KẾT QUẢ THỰC THI KIỂM THỬ THỰC TẾ

### 3.1. Toàn bộ Backend Pytest Suite
- **Lệnh thực thi:** `python -m pytest backend/tests/ -v`
- **Exit Code:** `0`
- **Số lượng:** **56 Passed**, 0 Failed, 0 Skipped, 1 Warning (trong 18.84 giây).
- **Chi tiết các nhóm test:**
  - `test_ai_router_and_real_pipeline.py`: 9 passed (Circuit breaker, fallback, API key masking, voiceover ffprobe, composite).
  - `test_autonomous_fixes.py`: 5 passed (Self-healing with facts, hard failure without facts, Windows unicode encoding, DB failure & bounded retry, BGM auto-provisioning).
  - `test_integration_orchestrator.py`: 12 passed (Database persistence, parallel fork, crash recovery, pause/resume).
  - `test_orchestrator.py`: 9 passed (DAG cycle detection, topological scheduling, quality gates).
  - `test_phase5_publishing.py`: 8 passed (Multi-account masking, approval, AI metadata).
  - `test_phase6_youtube_adapter.py`: 9 passed (YouTube OAuth, resumable upload protocol, shorts enforcement).
  - `test_trends_api.py`: 4 passed (RSS scanning, niche filters, plan conversion).

### 3.2. Frontend Typecheck, Lint & Build
- **Linter:** `npm run lint` (`oxlint`)
  - **Exit Code:** `0` (0 errors, 12 non-blocking React hooks warnings).
- **Build & Typecheck:** `npm run build` (`tsc -b && vite build`)
  - **Exit Code:** `0`
  - **Kết quả:** 1931 modules compiled thành công trong 706ms, xuất gói bundle tối ưu tại `dist/`.

### 3.3. Kịch bản E2E Render Video Thực tế (`POST /api/v1/studio/render-video`)
- **Dự án kiểm thử độc lập:** `audit_sp_proj_1792166559` (Chủ đề: "Đại đô thị thông minh và kỷ nguyên số Việt Nam", 3 phân cảnh kịch bản, giọng Nam Minh).
- **HTTP Response:** `200 OK` (thời gian render: 38.16s).
- **Phân tích file vật lý qua FFprobe:**
  - File: `storage/artifacts/rendered_audit_sp_proj_1792166559.mp4` (Dung lượng: 29.47 MB).
  - Video stream: Codec `h264`, Độ phân giải `1080x1920` (9:16), Tốc độ khung hình `25.0 FPS`.
  - Audio stream: Codec `aac`, Tần số `44100 Hz`, Số kênh `2 (Stereo)`.
  - Thời lượng & Độ lệch: Video `12.680s`, Audio `12.697s` ➜ **Drift: 0.0166s** (Dưới 17 mili-giây, đạt chuẩn < 0.04s).
  - Mức âm lượng: `mean_volume: -24.2 dB`, `max_volume: -8.5 dB` (Không bị tắt tiếng, không bị clipping vỡ tiếng).
  - Trích xuất khung hình: Đã trích 3 ảnh tại 1.0s, 6.3s, 11.7s xác nhận phụ đề ASS hiển thị chuẩn xác ở vùng an toàn (`MarginV=380`), hình ảnh rõ nét.

### 3.4. Kiểm thử Retry & Ghi nhận Trạng thái Thất bại vào Database
- **Kịch bản:** URL không tồn tại và không có facts kèm theo (`http://127.0.0.1:54321/nonexistent.htm`).
- **Kết quả thực tế:**
  - `CRAWL_SOURCE` thực hiện 3 lần retry có backoff.
  - Sau lần 3, task chuyển sang `TaskStatus.FAILED`.
  - Các task phụ thuộc (`EXTRACT_FACTS`, `GENERATE_SCRIPT`, ...) tự động chuyển `TaskStatus.BLOCKED`.
  - Database cập nhật `PlanStatus.FAILED`, `failed_tasks = 1`, không tạo duplicate task, không xảy ra deadlock.

---

## 4. GIỚI HẠN MÔI TRƯỜNG VÀ HẠNG MỤC CHƯA THỰC HIỆN

- **Browser Automation (Playwright / Puppeteer):** Môi trường máy tính hiện tại không cài đặt thư viện browser automation headless (Playwright/Puppeteer/Selenium không có trong global npm hoặc python virtualenv).
  - **Phân loại:** `NOT_RUN` (Browser E2E Automation).
  - **Bù đắp thay thế:** Kiểm thử toàn diện qua HTTP API thực tế, Vite build, TypeScript typecheck (`tsc -b`), và kiểm tra mã nguồn React hook dependency. Giao diện người dùng đã được mở cổng và kết nối trực tiếp với backend qua reverse proxy trong `vite.config.ts`.

---

## 5. DANH SÁCH FILE ĐÃ SỬA ĐỔI

1. [`backend/app/services/media/bgm_helper.py`](file:///c:/Users/ADMIN/Desktop/storymxh/backend/app/services/media/bgm_helper.py): Module tự tạo BGM chuẩn Stereo 44.1kHz khi phát hiện file thiếu.
2. [`backend/app/services/orchestrator/task_handlers.py`](file:///c:/Users/ADMIN/Desktop/storymxh/backend/app/services/orchestrator/task_handlers.py): Sửa logic self-healing không tạo dữ liệu giả từ URL slug; tích hợp `ensure_bgm_cinematic`.
3. [`backend/app/api/v1/studio.py`](file:///c:/Users/ADMIN/Desktop/storymxh/backend/app/api/v1/studio.py): Tích hợp `ensure_bgm_cinematic` trước khi trộn âm thanh.
4. [`backend/app/services/orchestrator/state_machine.py`](file:///c:/Users/ADMIN/Desktop/storymxh/backend/app/services/orchestrator/state_machine.py): Thêm alias `calculate_backoff_delay = calculate_backoff_seconds` khắc phục lỗi treo retry.
5. [`backend/app/services/orchestrator/pipeline_runner.py`](file:///c:/Users/ADMIN/Desktop/storymxh/backend/app/services/orchestrator/pipeline_runner.py): Liên kết an toàn Semaphore/Event với running loop.
6. [`backend/tests/test_autonomous_fixes.py`](file:///c:/Users/ADMIN/Desktop/storymxh/backend/tests/test_autonomous_fixes.py): Mở rộng bộ test kiểm tra hard failure, BGM auto-provisioning, và plan failure state cascade.
7. [`verify_audit_second_pass.py`](file:///c:/Users/ADMIN/Desktop/storymxh/verify_audit_second_pass.py): Script độc lập kiểm toán end-to-end cho video render, crawler, orchestrator và images.
