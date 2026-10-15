# 🎬 AuraShorts OS (v2.0)
> **Autonomous Task Orchestration & Short-Form Video Production Engine for Modern Creator Networks (MCN)**

[![Backend CI / Unit Tests](https://img.shields.io/badge/Pytest-51%20Passed-emerald.svg)](backend/tests)
[![FastAPI](https://img.shields.io/badge/FastAPI-2.0.0-009688.svg?logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19.0-61DAFB.svg?logo=react)](frontend)
[![Vite](https://img.shields.io/badge/Vite-8.3-646CFF.svg?logo=vite)](frontend)
[![FFmpeg](https://img.shields.io/badge/FFmpeg-7.0-007808.svg?logo=ffmpeg)](https://ffmpeg.org)
[![License](https://img.shields.io/badge/License-Proprietary-blue.svg)]()

---

## 🌟 Giới Thiệu Tổng Quan (Overview)

**AuraShorts OS** là nền tảng tự động hóa toàn diện từ A - Z quy trình sản xuất video ngắn (TikTok, YouTube Shorts, Reels, Facebook Video). Hệ thống kết hợp kiến trúc **Directed Acyclic Graph (DAG) Orchestration**, định tuyến AI Router thông minh đa nhà cung cấp (Gemini, Groq, OpenRouter, OpenAI Custom), đường ống xử lý media phần cứng (FFmpeg, Whisper, EdgeTTS) và hệ thống phân phối nội dung tự động tới các kênh mạng xã hội.

---

## 🚀 Tính Năng Cốt Lõi (Core Features)

### 1. 🔄 Động Cơ Điều Phối DAG Tự Trị (Autonomous Task DAG Engine)
- **Kiến trúc đồ thị có hướng không chu trình (DAG)**: Tự động phân rã mục tiêu (Goal Decomposition) thành mạng lưới nhiệm vụ độc lập, thực thi song song (Parallel Fork/Join) như `TTS_AUDIO` và `SEARCH_MEDIA`.
- **Độ bền bỉ & Tự phục hồi sau sự cố (Crash Durability & Auto-Recovery)**: Lưu trữ Checkpoints trạng thái nhiệm vụ vào SQLite/PostgreSQL; tự động thu hồi và tái khởi động các tác vụ bị ngắt khi server khởi động lại.
- **Cổng kiểm định chất lượng (Quality Gates)**: Đảm bảo độ dài audio khớp video (<200ms lệch), xác minh tính hợp pháp của giấy phép tư liệu (Editorial vs Commercial), kiểm tra định dạng khung hình 9:16 (1080x1920) trước khi cho phép xuất bản.
- **Trực quan hóa đồ thị tương tác (Live DAG Visualizer)**: Giám sát tiến độ từng node, thời gian thực thi (latency), log kiểm toán chi tiết và khả năng Thử lại tác vụ (Retry / Resume) chỉ với 1 click.

### 2. ⚡ AI Router Đa Nhà Cung Cấp & Tối Ưu Chi Phí 0 Đồng
- **Tiered Failover thông minh**: Tự động chuyển đổi mượt mà giữa các nhà cung cấp theo thứ tự ưu tiên:
  1. `Gemini 1.5 Flash` (Google AI - Free Tier / Quota lớn, xử lý ngữ cảnh sâu 2M tokens)
  2. `Groq Cloud` (Llama 3.3 70B Versatile - Siêu tốc độ suy luận ~110ms)
  3. `OpenRouter Aggregator` (Hồ bơi mô hình miễn phí toàn cầu)
  4. `Custom OpenAI-Compatible API` (Tùy biến endpoint nội bộ / vLLM / Ollama)
- **Model Catalog Discovery & Health Probe**: Khám phá tự động danh mục model khả dụng và đo lường độ trễ mạng thực tế.

### 3. 🎙️ Đường Ống Xử Lý Media & Dựng Video Phần Cứng (Media Pipeline)
- **Web Crawler & Fact Extraction**: Bóc tách bài báo từ bất kỳ đường link URL nào (VnExpress, Tuổi Trẻ, Reuters...), trích xuất tiêu đề, nội dung và các luận điểm (Claims) độc lập.
- **Neural TTS Voiceover**: Tạo giọng đọc tự nhiên chuẩn tiếng Việt (Hoài My, Nam Minh...) qua Edge-TTS.
- **Typography & Karaoke Subtitles**: Tạo file phụ đề `.ass` với hiệu ứng nhảy chữ (Pop-in) từng từ hoặc cụm 3 từ chuẩn phong cách Shorts hiện đại.
- **FFmpeg 7.0 Rendering**: Tự động tổng hợp hình ảnh 9:16, nhạc nền tuyến tính (Voice 100%, Music 12%, SFX 40%), burn-in phụ đề và xuất video chuẩn 1080x1920 MP4.

### 4. 📲 Trình Dựng Video Studio & Dual-Mode Player
- **Interactive Studio Canvas**: Mô phỏng khung điện thoại thông minh 9:16 với Dynamic Island, Safe-Zone TikTok và hiển thị phụ đề thời gian thực theo 3 kiểu:
  - *⚡ 1 Từ (Shorts)*: Chữ to nổi bật giữa màn hình.
  - *Cụm 3 chữ*: Đọc nhịp nhàng theo câu.
  - *Cả đoạn*: Kiểu hiển thị karaoke cổ điển.
- **Rendered MP4 Preview**: Tích hợp trình phát video HTML5 xem trực tiếp video MP4 đã render từ backend kèm nút tải xuống file vật lý.

### 5. 📡 Hệ Thống Xuất Bản Đa Nền Tảng (Publishing & Distribution)
- **YouTube Shorts Publishing Adapter**: Triển khai giao thức **Resumable Upload** (Google Drive / YouTube Data API v3) chống gián đoạn mạng khi tải file dung lượng lớn.
- **Hàng đợi đăng bài thông minh (Post Queue)**: Hỗ trợ 2 chế độ:
  - *Semi-Auto (Bán tự động)*: Bắt buộc người dùng kiểm duyệt kịch bản và tư liệu trước khi đăng.
  - *Full-Auto (Hoàn toàn tự động)*: Tự động lên lịch theo khung giờ vàng (11:30, 20:00).
- **Idempotency & Reconcile Engine**: Ngăn chặn tình trạng đăng trùng lặp video bằng Idempotency Key, tự động rà soát trạng thái bài đăng trên mạng xã hội sau sự cố mất kết nối mạng.

---

## 📂 Cấu Trúc Dự Án (Repository Structure)

```
storymxh/
├── backend/
│   ├── app/
│   │   ├── api/v1/                  # FastAPI REST API Endpoints
│   │   │   ├── health.py            # System health & engine metrics
│   │   │   ├── orchestrator.py      # DAG Plans, Tasks, Checkpoints & Retries
│   │   │   ├── providers.py         # AI Router configuration & Model Catalog
│   │   │   ├── publishing.py        # Social Accounts, Post Queue & Reconcile
│   │   │   └── trends.py            # AI Trends Radar & One-Click Plan Conversion
│   │   ├── db/                      # SQLAlchemy Database models & Repository
│   │   ├── models/                  # Pydantic Domain models (DAG, Task, Gate)
│   │   ├── schemas/                 # API Request & Response Schemas
│   │   ├── services/
│   │   │   ├── ai/                  # AI Router & Adapters (Gemini, Groq, OpenRouter)
│   │   │   ├── media/               # Whisper, EdgeTTS & Audio/Video Adapters
│   │   │   ├── orchestrator/        # DAG Engine, Quality Gates & Pipeline Runner
│   │   │   └── publishing/          # Base Adapter, YouTube Adapter & Publisher Service
│   │   └── main.py                  # FastAPI Application Entrypoint & Static Storage
│   └── tests/                       # 51 Comprehensive Pytest Suites (100% Pass)
├── frontend/
│   ├── src/
│   │   ├── components/              # Layout, Header, Sidebar & DagVisualizer
│   │   ├── services/                # Axios/Fetch API Client (Orchestrator, Publishing, Trends, Studio)
│   │   ├── views/                   # Dashboard, UrlToVideo, VideoStudio, Trends, Publishing, AI Providers
│   │   ├── types/                   # TypeScript Shared Interfaces
│   │   └── App.tsx                  # Root Application Component
│   ├── index.html
│   ├── vite.config.ts
│   └── package.json
├── docs/                            # Kiến trúc chi tiết & Đặc tả kỹ thuật
├── storage/                         # Local storage for artifacts, media & rendered MP4s
└── start.bat                        # One-click Windows starter script
```

---

## 🛠️ Hướng Dẫn Cài Đặt & Khởi Chạy (Getting Started)

### Yêu Cầu Môi Trường (Prerequisites)
- **Python**: 3.10 trở lên (khuyên dùng Python 3.11 - 3.14)
- **Node.js**: 18.x trở lên
- **FFmpeg**: Đã cài đặt và có trong biến môi trường `PATH` (kiểm tra bằng `ffmpeg -version`)

### 1. Khởi Chạy Nhanh Bằng 1 Click (Windows)
Chỉ cần chạy file kịch bản:
```cmd
start.bat
```
Kịch bản sẽ tự động khởi động song song Backend API (Port 8000) và Frontend Vite Server (Port 5173).

---

### 2. Khởi Chạy Thủ Công (Manual Step-by-Step)

#### Khởi động Backend (FastAPI):
```bash
cd backend
# Cài đặt thư viện phụ thuộc (nếu chưa có)
pip install fastapi uvicorn sqlalchemy pydantic httpx pytest pillow edge-tts

# Khởi chạy server
uvicorn app.main:app --reload --port 8000
```
- **API Documentation (Swagger UI)**: `http://localhost:8000/docs`
- **Health Check Endpoint**: `http://localhost:8000/api/v1/health`

#### Khởi động Frontend (React + Vite):
```bash
cd frontend
# Cài đặt node modules
npm install

# Khởi chạy server phát triển
npm run dev
```
- **Giao diện người dùng**: Mở trình duyệt tại `http://localhost:5173`

---

## 🧪 Kiểm Thử Hệ Thống (Testing Suite)

Toàn bộ backend được bao phủ bởi 51 kịch bản kiểm thử tự động xác thực mọi khía cạnh:

```bash
cd backend
pytest -v
```

**Kết quả kiểm thử:**
- `tests/test_orchestrator.py` (9 tests - DAG decomposition, cycle detection, state machine)
- `tests/test_integration_orchestrator.py` (12 tests - SQLite persistence, crash durability, retry backoff)
- `tests/test_ai_router_and_real_pipeline.py` (9 tests - Multi-provider failover, EdgeTTS, real FFmpeg MP4 render)
- `tests/test_phase5_publishing.py` (8 tests - Schema validation, encryption, scheduled queue)
- `tests/test_phase6_youtube_adapter.py` (9 tests - Resumable upload, idempotency, attempt audit logs)
- `tests/test_trends_api.py` (4 tests - RSS radar, niche filtering, one-click plan conversion)

**Tổng cộng:** `51 passed in ~8s` ✅

---

## 📝 Bản Quyền & Giấy Phép (License)

Dự án được phát triển riêng cho hệ thống **AuraShorts OS**. Bảo lưu mọi quyền.
Mọi thắc mắc và đóng góp kỹ thuật xin vui lòng liên hệ đội ngũ phát triển.
