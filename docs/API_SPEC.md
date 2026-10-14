# API_SPEC.md
# Đặc Tả Giao Diện Lập Trình (API Specification) — Autonomous Task Orchestrator

**Phiên bản:** 1.0.0  
**Tình trạng:** Master API Contract Specification  
**Prefix:** `/api/v1`  
**Tiêu chuẩn:** RESTful, Pydantic Schema Validation, JSON Response, OpenAPI 3.1  
**Căn cứ đặc tả:** `PROJECT.md` (Phần XV, XXV)

---

## 1. Tổng Quan Hợp Đồng API

Tất cả các response đều tuân thủ cấu trúc chuẩn:
```json
{
  "success": true,
  "data": { ... },
  "error": null,
  "request_id": "req-9843-f12a",
  "timestamp": "2026-10-15T00:35:00Z"
}
```

Trường hợp lỗi:
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "TASK_DEPENDENCY_CYCLE_DETECTED",
    "message": "Không thể tạo kế hoạch DAG vì phát hiện quan hệ phụ thuộc vòng lặp giữa các task.",
    "details": { "cycle": ["task_a", "task_b", "task_a"] }
  },
  "request_id": "req-9843-f12a",
  "timestamp": "2026-10-15T00:35:00Z"
}
```

---

## 2. Nhóm Endpoint Điều Phối Kế Hoạch (Orchestration Plans)

### 2.1. Tạo Kế Hoạch Tự Động (Create Plan)
- **Phương thức:** `POST /api/v1/orchestrator/plans`
- **Mô tả:** Tiếp nhận yêu cầu tạo video từ URL bài báo hoặc đề tài xu hướng; phân rã thành đồ thị DAG gồm các nhiệm vụ độc lập và phụ thuộc.

#### Request Body:
```json
{
  "plan_type": "URL_TO_VIDEO",
  "source_url": "https://vnexpress.net/oto-dien-pin-the-ran-chay-1000km-4792101.html",
  "target_duration_seconds": 60,
  "aspect_ratio": "9:16",
  "niche": "tech",
  "voice_id": "vi_female_north",
  "auto_start": true,
  "require_human_approval": true
}
```

#### Response (201 Created):
```json
{
  "success": true,
  "data": {
    "plan_id": "plan-7f28a9b1",
    "plan_type": "URL_TO_VIDEO",
    "status": "running",
    "total_tasks": 8,
    "completed_tasks": 0,
    "tasks": [
      {
        "id": "task-craw-01",
        "task_name": "Crawl & Clean Article Content",
        "task_type": "CRAWL_SOURCE",
        "status": "running",
        "priority": 1,
        "dependencies": []
      },
      {
        "id": "task-ext-02",
        "task_name": "Extract Fact Claims",
        "task_type": "EXTRACT_FACTS",
        "status": "pending",
        "priority": 2,
        "dependencies": ["task-craw-01"]
      },
      {
        "id": "task-scr-03",
        "task_name": "Generate Vietnamese Video Script",
        "task_type": "GENERATE_SCRIPT",
        "status": "pending",
        "priority": 3,
        "dependencies": ["task-ext-02"]
      },
      {
        "id": "task-tts-04",
        "task_name": "Generate Neural TTS Audio",
        "task_type": "TTS_AUDIO",
        "status": "pending",
        "priority": 4,
        "dependencies": ["task-scr-03"]
      },
      {
        "id": "task-med-05",
        "task_name": "Search & Verify 9:16 Media Assets",
        "task_type": "SEARCH_MEDIA",
        "status": "pending",
        "priority": 4,
        "dependencies": ["task-scr-03"]
      },
      {
        "id": "task-align-06",
        "task_name": "Word-Level Karaoke Alignment",
        "task_type": "ALIGN_AUDIO",
        "status": "pending",
        "priority": 5,
        "dependencies": ["task-tts-04"]
      },
      {
        "id": "task-rnd-07",
        "task_name": "Composite & Render MP4 Video (FFmpeg)",
        "task_type": "RENDER_FFMPEG",
        "status": "pending",
        "priority": 6,
        "dependencies": ["task-align-06", "task-med-05"]
      },
      {
        "id": "task-gate-08",
        "task_name": "Quality Gate ffprobe Verification",
        "task_type": "QUALITY_GATE_CHECK",
        "status": "pending",
        "priority": 7,
        "dependencies": ["task-rnd-07"]
      }
    ],
    "created_at": "2026-10-15T00:35:00Z"
  }
}
```

---

### 2.2. Lấy Chi Tiết Tiến Độ DAG (Get Plan Status & Progress)
- **Phương thức:** `GET /api/v1/orchestrator/plans/{id}`
- **Mô tả:** Lấy thông tin chi tiết của DAG, tiến độ %, trạng thái từng node và lý do bị chặn/lỗi nếu có.

#### Response (200 OK):
```json
{
  "success": true,
  "data": {
    "plan_id": "plan-7f28a9b1",
    "status": "running",
    "progress_percent": 62.5,
    "total_tasks": 8,
    "completed_tasks": 5,
    "failed_tasks": 0,
    "running_tasks": 1,
    "pending_tasks": 2,
    "execution_time_seconds": 24.8,
    "current_active_tasks": [
      {
        "task_id": "task-rnd-07",
        "task_name": "Composite & Render MP4 Video (FFmpeg)",
        "worker_id": "celery-render-worker-01",
        "started_at": "2026-10-15T00:35:20Z",
        "duration_ms": 14200
      }
    ]
  }
}
```

---

### 2.3. Các Lệnh Điều Khiển Kế Hoạch (Plan Execution Controls)
- `POST /api/v1/orchestrator/plans/{id}/pause`: Tạm dừng kế hoạch (các task đang running sẽ hoàn tất bước hiện tại, các task pending/queued sẽ đóng băng).
- `POST /api/v1/orchestrator/plans/{id}/resume`: Tiếp tục kế hoạch sau khi tạm dừng hoặc sau khi đã cấu hình lại provider AI.
- `POST /api/v1/orchestrator/plans/{id}/cancel`: Hủy bỏ kế hoạch an toàn, giải phóng worker slot và lưu giữ các checkpoint đã sinh.

---

## 3. Nhóm Endpoint Điều Khiển Nhiệm Vụ (Task Controls & Inspection)

### 3.1. Thử Lại Nhiệm Vụ Bị Lỗi (Retry Task)
- **Phương thức:** `POST /api/v1/orchestrator/tasks/{id}/retry`
- **Mô tả:** Chạy lại một nhiệm vụ cụ thể bị `failed` hoặc `blocked` sau khi người vận hành đã khắc phục nguyên nhân (ví dụ: bổ sung key hoặc thay đổi media).

#### Response (200 OK):
```json
{
  "success": true,
  "data": {
    "task_id": "task-rnd-07",
    "status": "queued",
    "attempt_number": 2,
    "message": "Nhiệm vụ đã được xếp lại vào hàng đợi worker để thực thi."
  }
}
```

---

### 3.2. Lấy Dữ Liệu Checkpoint (Get Task Checkpoint)
- **Phương thức:** `GET /api/v1/orchestrator/tasks/{id}/checkpoints`
- **Mô tả:** Truy vấn bản ghi checkpoint, đường dẫn file media đã xác thực và kết quả Quality Gate.

#### Response (200 OK):
```json
{
  "success": true,
  "data": {
    "checkpoint_id": "chk-8921-a1",
    "task_id": "task-scr-03",
    "step_name": "SCRIPT_JSON",
    "content_hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    "quality_gate_status": "PASSED",
    "metadata": {
      "word_count": 142,
      "scenes_count": 4,
      "claims_verified": 3
    },
    "created_at": "2026-10-15T00:35:12Z"
  }
}
```

---

### 3.3. Xem Nhật Ký Thực Thi (Get Task Logs)
- **Phương thức:** `GET /api/v1/orchestrator/tasks/{id}/logs?limit=50`
- **Mô tả:** Xem log có cấu trúc của task, thời gian xử lý từng pha và mã lỗi chi tiết.

#### Response (200 OK):
```json
{
  "success": true,
  "data": {
    "task_id": "task-rnd-07",
    "logs": [
      {
        "level": "INFO",
        "phase": "PREPARE_TIMELINE",
        "message": "Loaded 4 scenes and valid audio asset 58.2s.",
        "timestamp": "2026-10-15T00:35:20Z"
      },
      {
        "level": "INFO",
        "phase": "FFMPEG_ENCODE",
        "message": "Running FFmpeg with libx264 1080x1920 30fps...",
        "timestamp": "2026-10-15T00:35:22Z"
      }
    ]
  }
}
```

---
*Tài liệu đặc tả API này là hợp đồng giao tiếp giữa Frontend Control Room và Backend Autonomous Task Orchestrator.*
