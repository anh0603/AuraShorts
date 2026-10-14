# ARCHITECTURE.md
# Kiến Trúc Kỹ Thuật Tổng Thể & Hệ Thống Autonomous Task Orchestrator

**Phiên bản:** 1.0.0  
**Tình trạng:** Master Technical Architecture Document  
**Căn cứ đặc tả:** `PROJECT.md` (Phần III, IV, XIII, XXV)

---

## 1. Sơ Đồ Khối Kiến Trúc Toàn Hệ Thống

Hệ thống được thiết kế theo kiến trúc hướng dịch vụ với backend API độc lập, bộ điều phối đồ thị nhiệm vụ tự chủ (Autonomous DAG Orchestrator), các worker hàng đợi phân tán, và frontend SPA tương tác thời gian thực:

```mermaid
graph TD
    Client["Browser SPA (React 19 / Tailwind / Vite)"] -->|REST API & SSE / WebSocket| APIGateway["FastAPI Backend (REST API /api/v1)"]

    subgraph Backend Core
        APIGateway --> Security["Security, Auth & SSRF Filter"]
        APIGateway --> OrchestratorCore["Autonomous Task Orchestrator (DAG Engine)"]
        OrchestratorCore --> PlanGenerator["DAG Plan Generator & Decomposer"]
        OrchestratorCore --> StateMachine["Persistent Task State Machine"]
        OrchestratorCore --> QualityGate["Quality Gate Verifier (ffprobe, schema)"]
        OrchestratorCore --> AIRouter["AI Router (Free-Tier Multi-Provider)"]
    end

    subgraph Persistence Layer
        OrchestratorCore --> PostgreSQL[("PostgreSQL 16: Plans, Tasks, Checkpoints, Logs")]
        OrchestratorCore --> RedisQueue[("Redis 7: Task Broker, Priority Queues, Cache")]
        QualityGate --> ObjectStorage[("Storage: Local FS / MinIO / S3 Artifacts")]
    end

    subgraph Distributed Workers (Celery)
        RedisQueue --> ScraperWorker["Worker 1: Scraper & Link Ingestion"]
        RedisQueue --> AIWorker["Worker 2: Scriptwriting & Vision Scoring"]
        RedisQueue --> AudioWorker["Worker 3: TTS & Forced Alignment"]
        RedisQueue --> RenderWorker["Worker 4: FFmpeg Render & Burn-in"]
        RedisQueue --> PublishWorker["Worker 5: Idempotent Social Publisher"]
    end

    subgraph External Integrations
        AIRouter --> GeminiAPI["Google Gemini 1.5 Flash (Free Tier)"]
        AIRouter --> GroqAPI["Groq Llama 3.3 70B (Fast Inference)"]
        AIRouter --> CloudflareAI["Cloudflare Workers AI (10k Neurons/d)"]
        AIRouter --> FallbackRouter["Circuit Breaker & Fallback Router"]
        PublishWorker --> SocialAPIs["YouTube Shorts / TikTok / Reels APIs"]
    end
```

---

## 2. Thiết Kế Chi Tiết Autonomous Task Orchestrator

### 2.1. Phân Rã Mục Tiêu Thành Đồ Thị Nhiệm Vụ (Goal Decomposition to DAG)
Khi người dùng hoặc bộ lập lịch (Scheduler) kích hoạt một mục tiêu sản xuất video (từ URL bài báo hoặc đề tài xu hướng), Orchestrator thực hiện phân rã thành **Đồ thị có hướng không chu trình (DAG)**:

```
[Task 1: CRAWL_SOURCE]
        │
        ▼
[Task 2: EXTRACT_FACTS]
        │
        ▼
[Task 3: GENERATE_SCRIPT]
        │
        ├──────────────────────────┐
        ▼                          ▼
[Task 4A: TTS_VOICEOVER]    [Task 4B: SEARCH_MEDIA_CANDIDATES]
        │                          │
        ▼                          ▼
[Task 5A: ALIGN_TIMESTAMPS] [Task 5B: VERIFY_MEDIA_RIGHTS]
        │                          │
        └──────────────┬───────────┘
                       │
                       ▼
        [Task 6: COMPOSITE_RENDER (FFmpeg)]
                       │
                       ▼
        [Task 7: QUALITY_GATE_VERIFICATION]
                       │
                       ▼
        [Task 8: HUMAN_APPROVAL_GATE]
                       │
                       ▼
        [Task 9: SAFE_PUBLISH_IDEMPOTENT]
```

### 2.2. Quy Tắc Chạy Song Song (Parallel Execution Rules)
- **Task độc lập:** `Task 4A` (Tạo giọng đọc audio) và `Task 4B` (Tìm kiếm tư liệu hình ảnh) chỉ phụ thuộc vào `Task 3` (Kịch bản). Do đó, sau khi Task 3 chuyển sang `completed`, cả 4A và 4B lập tức chuyển sang `queued` và được các worker xử lý song song trên các luồng/tiến trình riêng biệt.
- **Hội tụ (Barrier Synchronization):** `Task 6` (Render FFmpeg) khai báo dependencies gồm cả `[5A, 5B]`. Task 6 sẽ duy trì trạng thái `pending` cho tới khi tất cả các dependency tiên quyết đều đạt `completed` và có checkpoint hợp lệ.

### 2.3. Máy Trạng Thái Nhiệm Vụ (Task State Machine)

```
        ┌─────────────┐
        │   PENDING   │
        └──────┬──────┘
               │ (Mọi dependency completed)
               ▼
        ┌─────────────┐
        │   QUEUED    │
        └──────┬──────┘
               │ (Worker nhận job)
               ▼
        ┌─────────────┐
        │   RUNNING   ├──────────┐ (Lỗi tạm thời: 429/Timeout)
        └──────┬──────┘          │
               │                 ▼
               │          ┌─────────────┐
               │          │  RETRYING   │
               │          └──────┬──────┘
               │ (Pass Gate)     │ (Exponential backoff)
               ▼                 │
        ┌─────────────┐          │
        │  COMPLETED  │          │
        └─────────────┘          ▼ (Hết số lần retry / Lỗi vĩnh viễn)
                          ┌─────────────┐
                          │   FAILED    │
                          └──────┬──────┘
                                 │
                                 ▼
                          ┌─────────────┐
                          │   BLOCKED   │ (Các task phụ thuộc)
                          └─────────────┘
```

---

## 3. Cơ Chế Khôi Phục Sự Cố & Checkpoint (Crash Recovery)

1. **Ghi nhận Checkpoint:**
   - Mỗi task khi hoàn tất bắt buộc tạo bản ghi trong bảng `task_checkpoints` lưu: `plan_id`, `task_id`, `step_type`, `output_payload_json`, `artifact_storage_path`, `content_hash`, `validation_result_json`.
2. **Khởi động lại an toàn (Backend Restart Handling):**
   - Khi hệ thống khởi động: `OrchestratorRecoveryService` truy vấn tất cả các task có trạng thái `running` hoặc `retrying`.
   - Đối chiếu với storage và checkpoint: Nếu output của task đã tồn tại và vượt qua kiểm định, task được chuyển sang `completed`. Nếu dở dang, task được đưa về `queued` với attempt counter tăng thêm 1 (không vượt quá `max_retries`).
   - Các task đã `completed` tuyệt đối không bị chạy lại, bảo vệ ngân sách quota và thời gian render.

---

## 4. Cổng Kiểm Định Chất Lượng Tự Động (Quality Gates Protocol)

Mỗi Quality Gate là một hàm kiểm tra tất định (deterministic verifier):
1. **Script Quality Gate:** Kiểm tra schema Pydantic, số lượng scene >= 3, tổng số từ tiếng Việt trong khoảng 100 - 200 từ, không có trường rỗng.
2. **Audio Quality Gate:** Dùng `ffprobe` đo thời lượng file `.aac`/`.mp3` thực tế, xác nhận `duration_ms > 0`, kiểm tra waveform không bị im lặng toàn bộ (silence detection).
3. **Alignment Quality Gate:** Kiểm tra word timestamps: `start_ms <= end_ms`, thứ tự tăng dần đều, không có timestamp vượt quá tổng thời lượng audio.
4. **Video Artifact Quality Gate:** Dùng `ffprobe` kiểm tra video MP4:
   - Width: 1080px, Height: 1920px (Tỷ lệ 9:16).
   - Video Codec: h264, Audio Codec: aac.
   - Frame rate: 30 fps (hoặc 60 fps theo config).
   - Kiểm tra giải mã frame đầu và frame cuối tránh video bị đen hoặc hỏng container.

Nếu Gate thất bại: Hệ thống chuyển trạng thái sang `retrying` và kích hoạt tự sửa chữa (ví dụ: tự động căn chỉnh lại padding video, chọn ứng viên media dự phòng) tối đa 2 lần trước khi báo lỗi `failed`.

---

## 5. Ranh Giới Bảo Mật & Phân Quyền

- **Hành động nội bộ tự chủ (Autonomous Internal Actions):** Trích xuất link, đọc nội dung, gọi AI Router, tạo audio, render video, lưu checkpoint. Các thao tác này diễn ra tự động 100% không yêu cầu người dùng xác nhận.
- **Hành động ngoại vi có rủi ro (Restricted External Actions):** Đăng video lên mạng xã hội thật, xóa dự án vĩnh viễn, thay đổi API secret. Bắt buộc có cờ kiểm duyệt `require_human_approval` và ghi nhật ký kiểm toán trong `audit_logs`.

---
*Tài liệu kiến trúc này là quy chuẩn kỹ thuật bắt buộc cho toàn bộ module Backend và Orchestration Engine.*
