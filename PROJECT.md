# PROJECT.md
# AI VIDEO SHORTS AUTOMATION & MCN PLATFORM
## Đặc tả sản phẩm, kiến trúc kỹ thuật và tiêu chuẩn triển khai hoàn chỉnh

**Phiên bản:** 2.0  
**Trạng thái:** Master Specification — tài liệu nguồn chính thức của dự án  
**Phương pháp triển khai:** Antigravity AI-assisted development, chia giai đoạn, kiểm thử và nghiệm thu liên tục  
**Mục tiêu chi phí:** Ưu tiên dịch vụ AI miễn phí; không tự ý phát sinh chi phí  
**Định hướng:** Xây dựng mới hoàn toàn, không kế thừa code hoặc kiến trúc từ dự án khác

---

# PHẦN I. NGUYÊN TẮC CỐT LÕI

## 1. Vai trò của tài liệu

File này là nguồn đặc tả chính thức cho toàn bộ dự án.

Antigravity phải đọc tài liệu này trước khi thực hiện bất kỳ thay đổi kỹ thuật nào. Các quyết định kiến trúc quan trọng phải được ghi lại trong tài liệu kỹ thuật tương ứng và không được tự ý thay đổi chỉ vì một phương án khác dễ code hơn.

Thứ tự ưu tiên khi có xung đột:

1. Yêu cầu bảo mật, pháp lý, quyền riêng tư và an toàn dữ liệu.
2. Các quyết định được đánh dấu MUST trong file này.
3. Hợp đồng API, mô hình dữ liệu và kiến trúc đã được phê duyệt.
4. Tiêu chí nghiệm thu của từng module.
5. Các yêu cầu SHOULD và MAY.
6. Lựa chọn triển khai của AI coding agent.

Nếu phát hiện yêu cầu mâu thuẫn, thiếu thông tin hoặc không thể thực hiện, phải ghi rõ vấn đề và đề xuất phương án. Không được âm thầm bỏ tính năng hoặc tự thay đổi yêu cầu.

## 2. Định nghĩa MUST, SHOULD và MAY

- **MUST:** Bắt buộc phải thực hiện để được nghiệm thu.
- **SHOULD:** Nên thực hiện, chỉ được hoãn khi có lý do kỹ thuật rõ ràng.
- **MAY:** Có thể triển khai sau khi nền tảng chính đã ổn định.

Một tính năng MUST chưa hoàn thành thì không được báo cáo giai đoạn chứa tính năng đó là hoàn tất.

## 3. Quy tắc phát triển bắt buộc

1. Xây dựng dự án từ đầu trong một repository mới.
2. Không sao chép hoặc phụ thuộc vào code của các dự án trước đây.
3. Không tự ý thay đổi kiến trúc, framework hoặc cấu trúc dữ liệu cốt lõi.
4. Không cài đặt thư viện mới nếu chưa đánh giá mức độ cần thiết, giấy phép, khả năng bảo trì và ảnh hưởng đến hệ thống.
5. Không để API key, access token, cookie, mật khẩu hoặc thông tin xác thực xuất hiện trong source code, log, ảnh chụp màn hình hay báo cáo.
6. Không tạo dữ liệu giả để làm giao diện trông như đã hoạt động thật. Dữ liệu demo phải được đánh dấu rõ.
7. Không giả lập kết quả API thực tế trong các bài kiểm thử được tuyên bố là live test.
8. Mọi chức năng phải có tiêu chí nghiệm thu cụ thể.
9. Mọi pipeline dài phải hỗ trợ theo dõi trạng thái, retry có kiểm soát và tiếp tục từ bước đã hoàn thành khi có thể.
10. Mọi thay đổi database phải được quản lý bằng migration.
11. Không tự động sử dụng API trả phí hoặc chuyển sang gói trả phí khi quota miễn phí hết.
12. Không tự ý push code, triển khai production, xóa dữ liệu thật hoặc thay đổi thông tin xác thực khi chưa có sự đồng ý của người vận hành.
13. Ưu tiên tính đúng đắn, khả năng phục hồi và tính minh bạch hơn số lượng tính năng.
14. Không khẳng định “100% chính xác”, “không bao giờ lỗi” hoặc “tự động hoàn toàn” khi chưa có bằng chứng đủ mạnh.

---

# PHẦN II. TỔNG QUAN SẢN PHẨM

## 4. Tên dự án

**AI Video Shorts Automation & MCN Platform**

Tên hiển thị tiếng Việt:

**Hệ thống tự động hóa sản xuất và quản trị mạng lưới video ngắn bằng AI.**

## 5. Mục tiêu sản phẩm

Xây dựng một nền tảng web quản lý và tự động hóa quy trình sản xuất video ngắn từ đầu đến cuối.

Hệ thống phải hỗ trợ:

- Tìm kiếm tin tức, xu hướng và chủ đề theo từng ngách nội dung.
- Thu thập, lưu trữ và đối chiếu nhiều nguồn thông tin.
- Dùng AI tổng hợp nội dung và viết kịch bản video.
- Tự động tạo storyboard theo từng cảnh.
- Tìm kiếm tư liệu ảnh, video và nhân vật minh họa.
- Đánh giá mức độ phù hợp, chất lượng và quyền sử dụng tư liệu.
- Tạo giọng đọc AI và đồng bộ lời đọc với thời gian từng từ.
- Tự động dựng, render và kiểm tra video.
- Cho phép người dùng xem trước, chỉnh sửa, thay thế tư liệu và duyệt video.
- Quản lý nhiều kênh, tài khoản và nhóm chủ đề.
- Lập lịch và đăng video thông qua phương thức được nền tảng hỗ trợ.
- Theo dõi lịch sử đăng bài, trạng thái và số liệu hiệu suất.
- Sử dụng nhiều nhà cung cấp AI miễn phí thông qua một hệ thống định tuyến thống nhất.
- Tự bổ sung provider và model mới mà không cần sửa code cốt lõi mỗi lần.
- Tiếp tục xử lý công việc khi một model hoặc dịch vụ tạm thời không khả dụng.

Mục tiêu cuối cùng là giảm tối đa thao tác thủ công, nhưng vẫn bảo đảm người vận hành có thể kiểm soát chất lượng, chi phí, nội dung và hoạt động xuất bản.

## 6. Phạm vi sử dụng

Sản phẩm trước tiên phục vụ người vận hành cá nhân hoặc một nhóm nhỏ quản lý nhiều kênh video.

Hệ thống được thiết kế theo hướng có thể mở rộng về sau thành nền tảng quản trị mạng lưới kênh.

Không mặc định phải hỗ trợ hàng nghìn người dùng ngay từ phiên bản đầu tiên. Tuy nhiên, kiến trúc phải tránh các quyết định khiến việc mở rộng worker, storage, provider AI và số lượng tài khoản trở nên khó khăn.

## 7. Nền tảng xuất bản mục tiêu

- YouTube Shorts.
- TikTok.
- Facebook Reels.
- Instagram Reels.

Việc hỗ trợ nền tảng nào được quyết định theo khả năng API thực tế, quyền truy cập của tài khoản, khu vực, loại ứng dụng và chính sách hiện hành.

Không được coi tất cả nền tảng có cùng khả năng đăng video hoặc cùng quyền truy cập số liệu.

## 8. Định dạng video chuẩn

Cấu hình mặc định:

- Tỷ lệ: 9:16.
- Độ phân giải: 1080 × 1920.
- Container: MP4.
- Video codec: H.264.
- Audio codec: AAC.
- Frame rate: cấu hình được, mặc định 30 FPS.
- Thời lượng mục tiêu: khoảng 60 giây.
- Độ dài lời thoại mục tiêu: khoảng 130–160 từ tiếng Việt, có thể thay đổi theo tốc độ đọc.
- Hỗ trợ cấu hình video ngắn hơn hoặc dài hơn tùy nền tảng.
- Phải kiểm tra giới hạn định dạng, kích thước, codec và thời lượng của từng nền tảng tại thời điểm xuất bản.

Không được cắt lời thoại hoặc kết thúc video đột ngột chỉ để đạt thời lượng cố định.

---

# PHẦN III. KIẾN TRÚC TỔNG THỂ

## 9. Quyết định kiến trúc

Sử dụng kiến trúc web application có backend API, frontend độc lập và các worker xử lý tác vụ nền.

Luồng tổng quát:

Browser Dashboard
→ Frontend Web
→ Backend API
→ Database và Object Storage
→ Job Queue
→ Pipeline Workers
→ AI Router / Media Services / Video Engine
→ Video Artifacts
→ Approval
→ Publishing Adapters
→ Social Platforms
→ Analytics

Các thành phần phải giao tiếp thông qua hợp đồng API hoặc interface được định nghĩa rõ ràng.

## 10. Công nghệ nền tảng

Đây là stack mặc định. Antigravity không được tự ý thay thế công nghệ cốt lõi mà không nêu lý do và được phê duyệt.

### 10.1. Backend

- Python.
- FastAPI.
- Pydantic cho validation và schema.
- SQLAlchemy 2.x cho ORM.
- Alembic cho database migration.
- REST API có version, mặc định `/api/v1`.
- WebSocket hoặc Server-Sent Events cho cập nhật tiến trình nếu cần.

### 10.2. Frontend

- React.
- TypeScript.
- Vite.
- Tailwind CSS.
- Thư viện component có khả năng bảo trì tốt.
- TanStack Query hoặc giải pháp tương đương cho server state.
- React Hook Form và schema validation nếu phù hợp.
- Biểu đồ phục vụ dashboard.
- Giao diện responsive cho desktop và tablet; các tác vụ chính cần sử dụng được trên màn hình nhỏ.

Không sử dụng Next.js nếu chưa có yêu cầu cụ thể cần SSR. Phiên bản đầu tiên ưu tiên frontend SPA và backend API độc lập.

### 10.3. Database

- PostgreSQL làm cơ sở dữ liệu chính.
- Redis cho queue, cache và các cơ chế điều phối phù hợp.
- Object Storage tương thích S3 hoặc MinIO cho media và artifact.
- Filesystem local chỉ được sử dụng như storage backend dành cho môi trường phát triển hoặc triển khai đơn máy.

Không lưu video, audio và file media lớn trực tiếp trong cột database.

### 10.4. Queue và worker

- Celery với Redis hoặc broker tương thích được đánh giá trước khi triển khai.
- Tác vụ nền phải có retry policy, timeout, trạng thái và khả năng quan sát.
- Worker xử lý riêng các nhóm tác vụ nặng như tải media, TTS, render và xuất bản.
- Không chạy công việc render video dài trực tiếp trong request HTTP.

### 10.5. Video engine

- FFmpeg và ffprobe làm nền tảng xử lý media.
- MoviePy hoặc thư viện phụ trợ chỉ được sử dụng khi mang lại lợi ích rõ ràng.
- Remotion là lựa chọn mở rộng nếu cần template motion graphics phức tạp; không bắt buộc trong MVP.
- Ưu tiên pipeline render có thể tái lập, có log, có thể chạy lại và kiểm tra đầu ra.

### 10.6. Môi trường phát triển

Phải hỗ trợ môi trường Windows và môi trường Linux/container khi khả thi.

Tất cả lệnh cài đặt, chạy, test và build phải được ghi trong tài liệu README.

Không phụ thuộc vào GPU nếu pipeline mặc định có thể chạy bằng CPU. Các tính năng cần GPU phải được đánh dấu riêng và có phương án thay thế khi phù hợp.

---

# PHẦN IV. CẤU TRÚC SOURCE CODE

## 11. Cấu trúc repository mục tiêu

```text
ai-video-shorts/
├── PROJECT.md
├── README.md
├── CHANGELOG.md
├── .env.example
├── .gitignore
├── docker-compose.yml
├── docs/
│   ├── ARCHITECTURE.md
│   ├── DATA_MODEL.md
│   ├── API_SPEC.md
│   ├── AI_ROUTER.md
│   ├── MEDIA_RIGHTS.md
│   ├── SECURITY.md
│   ├── TESTING.md
│   ├── DEPLOYMENT.md
│   ├── OPERATIONS.md
│   └── ROADMAP.md
├── backend/
│   ├── pyproject.toml
│   ├── alembic.ini
│   ├── alembic/
│   ├── app/
│   │   ├── main.py
│   │   ├── core/
│   │   ├── api/
│   │   ├── db/
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── repositories/
│   │   ├── services/
│   │   ├── workers/
│   │   ├── pipeline/
│   │   ├── ai_router/
│   │   ├── providers/
│   │   ├── media/
│   │   ├── video_engine/
│   │   ├── publishing/
│   │   ├── analytics/
│   │   └── security/
│   └── tests/
├── frontend/
│   ├── package.json
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   ├── features/
│   │   ├── hooks/
│   │   ├── lib/
│   │   ├── routes/
│   │   ├── types/
│   │   └── styles/
│   └── tests/
├── scripts/
├── storage/
│   └── .gitkeep
└── .github/
    └── workflows/
```

Đây là cấu trúc định hướng, không phải yêu cầu tạo toàn bộ file rỗng ngay lập tức.

Chỉ tạo module khi chuẩn bị triển khai module đó. Không tạo các file chỉ chứa TODO để làm báo cáo trông như đã hoàn thành.

## 12. Nguyên tắc phân lớp

- API layer chỉ xử lý HTTP, authentication, validation và điều phối request.
- Service layer chứa logic nghiệp vụ.
- Repository layer xử lý truy cập dữ liệu khi cần.
- Provider adapters đóng gói giao tiếp với dịch vụ ngoài.
- Pipeline điều phối các bước sản xuất video.
- Worker thực hiện tác vụ nền.
- Video engine không phụ thuộc trực tiếp vào frontend.
- Frontend không chứa API secret hoặc logic bí mật.
- Không để một module gọi trực tiếp vào implementation nội bộ của nhiều module khác nếu có thể sử dụng interface ổn định.

---

# PHẦN V. HỆ THỐNG AI ROUTER ĐA PROVIDER

## 13. Mục tiêu AI Router

AI Router là một thành phần nền tảng, không phải tính năng phụ.

Mục tiêu là sử dụng các model AI miễn phí hoặc được cấp quyền sử dụng miễn phí từ nhiều nhà cung cấp để hạn chế gián đoạn quy trình sản xuất.

Hệ thống phải cho phép:

1. Thêm provider mới qua giao diện quản trị.
2. Thêm API key hoặc thông tin xác thực tương ứng.
3. Cấu hình API base URL và model ID.
4. Tự khám phá model khi provider có API catalog phù hợp.
5. Thêm model thủ công nếu provider không hỗ trợ khám phá.
6. Kiểm tra kết nối và kiểm tra khả năng thật của từng model.
7. Gán model cho các nhóm tác vụ khác nhau.
8. Theo dõi quota, rate limit, lỗi và thời gian phản hồi.
9. Chuyển sang provider/model dự phòng khi gặp lỗi có thể phục hồi.
10. Đưa công việc vào hàng đợi khi không còn provider phù hợp.
11. Lưu thống kê sử dụng và ước lượng chi phí.
12. Thêm provider mà không phải sửa logic nghiệp vụ của toàn bộ ứng dụng.

**Không hardcode danh sách model vào các module viết kịch bản, Vision, TTS hoặc các pipeline nghiệp vụ.**

Tất cả các module phải gọi AI Router thông qua interface thống nhất.

## 14. Phân loại năng lực AI

Mỗi model phải có các capability được khai báo và kiểm chứng riêng.

Các capability mục tiêu:

- `text_generation`: tạo và tổng hợp văn bản.
- `structured_output`: trả dữ liệu có cấu trúc.
- `tool_calling`: gọi công cụ nếu được hỗ trợ.
- `vision`: phân tích ảnh.
- `video_understanding`: hiểu video.
- `image_generation`: tạo ảnh.
- `image_editing`: chỉnh sửa ảnh.
- `text_to_speech`: chuyển văn bản thành giọng đọc.
- `speech_to_text`: chuyển âm thanh thành văn bản.
- `forced_alignment`: xác định timestamp từ/câu.
- `embeddings`: tạo vector.
- `reranking`: xếp hạng kết quả tìm kiếm.
- `moderation`: kiểm tra nội dung.

Không được suy luận rằng model hỗ trợ một capability chỉ vì tên model hoặc tên nhà cung cấp có nhắc đến capability đó.

Capability phải lấy từ metadata chính thức khi có, sau đó kiểm tra bằng thử nghiệm thực tế.

## 15. Provider và model registry

Mỗi provider cần có tối thiểu:

- ID nội bộ.
- Tên hiển thị.
- Loại provider.
- API base URL.
- Loại authentication.
- Thông tin tham chiếu đến secret được lưu an toàn.
- Trạng thái: `ACTIVE`, `DEGRADED`, `DISABLED`.
- Thời điểm kiểm tra gần nhất.
- Kết quả kiểm tra gần nhất.
- Hạn mức hoặc thông tin quota đã xác minh.
- Nguồn và thời điểm cập nhật thông tin quota.
- Danh sách model.
- Chính sách retry.
- Ưu tiên sử dụng.
- Ghi chú điều khoản sử dụng.

Mỗi model cần có:

- Provider ID.
- Model ID chính xác do provider cung cấp.
- Tên hiển thị.
- Capability.
- Trạng thái hoạt động.
- Loại endpoint.
- Context limit nếu đã xác minh.
- Giới hạn input/output nếu có.
- Hỗ trợ streaming hay không.
- Hỗ trợ structured output hay không.
- Hỗ trợ hình ảnh, audio hoặc video nếu có.
- Giới hạn tốc độ và quota đã xác minh.
- Giá hoặc trạng thái miễn phí đã xác minh.
- Ngày kiểm tra gần nhất.
- Kết quả smoke test.
- Ghi chú lỗi đã biết.

Trạng thái miễn phí được phân loại:

- `FREE_CONFIRMED`: đã xác minh điều kiện sử dụng miễn phí hiện tại.
- `FREE_LIMITED`: miễn phí có giới hạn.
- `TRIAL`: chỉ miễn phí trong thời gian hoặc số lượt thử.
- `PAID`: cần trả phí.
- `UNKNOWN`: chưa xác minh.
- `DISCONTINUED`: dịch vụ hoặc model không còn khả dụng.

Không đưa model `TRIAL`, `PAID` hoặc `UNKNOWN` vào đường chạy mặc định của chế độ miễn phí.

## 16. Danh sách provider khởi điểm cần khảo sát

Các provider dưới đây là danh sách cần kiểm tra và tích hợp theo thứ tự ưu tiên, không phải tuyên bố rằng tất cả đều đang miễn phí hoặc chắc chắn hoạt động.

### Nhóm A — Ưu tiên tích hợp

1. **Google Gemini API**
   - Mục tiêu: viết kịch bản, tổng hợp nguồn, structured output, Vision.
   - Phải xác minh model, quota, giới hạn theo project và điều khoản sử dụng.
   - Không hardcode hạn mức theo tài liệu cũ.

2. **Groq**
   - Mục tiêu: suy luận văn bản nhanh, xử lý các tác vụ LLM phù hợp.
   - Phải lấy danh sách model hiện hành và quota theo tài khoản.
   - Không mặc định tất cả model đều có cùng rate limit.

3. **OpenRouter**
   - Mục tiêu: truy cập nhiều model thông qua một giao diện API thống nhất.
   - Phải phân biệt model miễn phí với model trả phí.
   - Model miễn phí có thể thay đổi, ngừng cung cấp hoặc có giới hạn dùng chung.
   - Phải hỗ trợ catalog refresh và fallback phù hợp.

4. **Cloudflare Workers AI**
   - Mục tiêu: bổ sung các model và tác vụ được hỗ trợ trong hạn mức tài khoản.
   - Phải xác minh tài khoản, quyền truy cập, model, quota và giới hạn gói.
   - Không coi mọi model trong catalog đều miễn phí.

### Nhóm B — Khảo sát mở rộng

5. NVIDIA NIM.
6. Mistral API.
7. Cerebras.
8. Hugging Face Inference Providers.
9. Cohere.
10. Z.ai hoặc các provider mới có API hợp lệ.
11. Các provider tương thích OpenAI API khác.

Các provider trong nhóm B chỉ được bật khi kiểm tra được khả năng truy cập, điều khoản sử dụng, quota và chi phí.

Không phụ thuộc vào các chương trình dùng thử, ưu đãi ngắn hạn hoặc provider không công bố rõ điều kiện sử dụng để bảo đảm toàn bộ hệ thống chạy miễn phí lâu dài.

### Nhóm C — Dịch vụ chuyên biệt

- Image generation.
- TTS.
- Speech-to-text.
- Forced alignment.
- Embedding.
- Media search.
- Background removal.

Mỗi nhóm có thể sử dụng provider khác nhau. Không yêu cầu một nhà cung cấp phải thực hiện tất cả tác vụ.

## 17. Giao diện cấu hình provider

Dashboard phải có trang **AI Provider Manager**.

Các chức năng bắt buộc:

- Xem danh sách provider.
- Thêm provider.
- Chỉnh sửa cấu hình.
- Bật/tắt provider.
- Nhập hoặc thay đổi API key.
- Không hiển thị lại toàn bộ key sau khi lưu.
- Kiểm tra kết nối.
- Lấy danh sách model.
- Làm mới model catalog.
- Thêm model thủ công.
- Kiểm tra model.
- Chọn capability.
- Thiết lập ưu tiên.
- Cấu hình fallback.
- Xem quota và giới hạn đã xác minh.
- Xem lỗi gần nhất.
- Xem lịch sử kiểm tra.
- Xem mức sử dụng.
- Xuất báo cáo sử dụng không chứa secret.

Nút “Test model” phải thực sự gửi một request phù hợp đến provider nếu có thông tin xác thực hợp lệ.

Nếu không thể test do thiếu quyền, thiếu key hoặc quota, UI phải thể hiện trạng thái chính xác, không hiển thị PASS giả.

## 18. Custom OpenAI-compatible provider

Phải hỗ trợ thêm provider tùy chỉnh thông qua:

- Base URL.
- API key.
- Authentication header nếu cần.
- Model ID.
- Chat/completions endpoint hoặc adapter phù hợp.
- Model catalog endpoint tùy chọn.
- Capability được cấu hình thủ công và xác minh.
- Timeout.
- Retry policy.
- Health check.

Không được giả định mọi endpoint mang tên OpenAI-compatible đều tương thích hoàn toàn. Adapter phải xử lý khác biệt về payload, streaming, response và error format.

Không hỗ trợ nhập URL tùy ý mà không có biện pháp chống SSRF. Chỉ cho phép URL HTTPS hợp lệ hoặc các địa chỉ local được whitelist trong môi trường phát triển. Chặn truy cập đến cloud metadata, loopback và mạng nội bộ không được phép.

## 19. Cơ chế tự khám phá model

Khi người dùng thêm provider:

1. Kiểm tra cấu hình và thông tin xác thực.
2. Gọi model catalog endpoint nếu provider hỗ trợ.
3. Chuẩn hóa kết quả thành schema nội bộ.
4. Đối chiếu với model registry.
5. Thêm model mới hoặc cập nhật metadata.
6. Đánh dấu model không còn xuất hiện là `UNVERIFIED` hoặc `DISCONTINUED` sau khi có đủ bằng chứng; không xóa lịch sử.
7. Cho phép người dùng kiểm tra model mới trước khi kích hoạt.
8. Chạy smoke test theo capability phù hợp.
9. Cập nhật thời điểm xác minh và kết quả.

Nếu provider không có catalog endpoint, cho phép nhập model ID thủ công.

Tự khám phá catalog không đồng nghĩa với tự động bật mọi model. Các model chưa xác minh không được đưa vào production routing.

## 20. Task-aware routing

Mỗi tác vụ phải khai báo yêu cầu trước khi chọn model.

Ví dụ:

- Viết kịch bản: cần `text_generation`, ưu tiên chất lượng, khả năng tiếng Việt và structured output.
- Phân tích ảnh: cần `vision`.
- Tạo hình minh họa: cần `image_generation`.
- Đọc lời thoại: cần `text_to_speech`, ưu tiên tiếng Việt và giọng đọc phù hợp.
- Đồng bộ từ: cần `forced_alignment` hoặc pipeline tương đương.
- Tổng hợp nguồn: cần context phù hợp và khả năng giữ nguồn trích dẫn.

Router phải lọc model theo capability trước, sau đó mới xếp hạng.

Các tiêu chí xếp hạng:

1. Capability hợp lệ.
2. Model đang hoạt động.
3. Quyền sử dụng hợp lệ.
4. Quota khả dụng hoặc chưa bị đánh dấu cạn.
5. Chất lượng đã đánh giá.
6. Độ trễ.
7. Giới hạn output và context.
8. Chi phí.
9. Độ ổn định.
10. Mức ưu tiên do người vận hành thiết lập.

Mặc định sử dụng chế độ `FREE_ONLY`.

Các chế độ có thể hỗ trợ:

- `FREE_ONLY`: chỉ chọn model đã xác minh miễn phí.
- `MANUAL_PRIORITY`: ưu tiên theo thứ tự người dùng thiết lập.
- `QUALITY_FIRST`: ưu tiên chất lượng trong nhóm model được phép.
- `LATENCY_FIRST`: ưu tiên tốc độ.
- `CUSTOM`: áp dụng policy tùy chỉnh.

Không được chuyển sang model trả phí khi chế độ `FREE_ONLY` đang hoạt động.

## 21. Quota Manager

Phải quản lý hạn mức ở mức phù hợp với cách provider áp dụng giới hạn.

Các thông tin theo dõi:

- Requests per minute.
- Requests per day.
- Input/output tokens.
- Tokens per minute/day.
- Audio seconds.
- Image generation count.
- Giới hạn theo project, organization, model hoặc key nếu xác định được.
- Thời điểm reset nếu được provider công bố.
- Thời điểm gần nhất nhận lỗi rate limit.
- Thời gian chờ đề xuất.
- Mức độ tin cậy của dữ liệu quota.

Không được giả định rằng quota là riêng cho từng API key. Một số provider áp dụng hạn mức chung theo project hoặc organization.

Khi quota chưa thể xác minh, trạng thái phải là `UNKNOWN`, không tự tạo ra con số quota.

## 22. Fallback và retry

### Lỗi HTTP 429 — Rate limit/quota

- Đọc `Retry-After` nếu có.
- Ghi nhận model/provider và phạm vi quota có liên quan.
- Tạm ngừng chọn model bị giới hạn trong khoảng thời gian phù hợp.
- Chuyển sang model khác có capability tương đương.
- Không lặp request liên tục vào model đã bị giới hạn.

### Lỗi HTTP 401/403

- Đánh dấu credential hoặc quyền truy cập cần kiểm tra.
- Không retry vô hạn.
- Không đưa API key vào log.
- Thông báo người vận hành cần xử lý.

### Lỗi HTTP 5xx, timeout hoặc lỗi mạng

- Retry có giới hạn.
- Sử dụng exponential backoff có jitter.
- Nếu còn lựa chọn hợp lệ, chuyển provider.
- Nếu hết lựa chọn, đưa job về trạng thái chờ hoặc lỗi có thể phục hồi.

### Lỗi payload hoặc schema

- Phân loại lỗi đầu vào, lỗi tương thích hay lỗi model.
- Chỉ thử lại bằng model khác khi request hợp lệ và có khả năng xử lý.
- Không retry mù quáng một payload sai.

### Lỗi nội dung

- Kiểm tra kết quả bằng schema và quy tắc nghiệp vụ.
- Nếu output không hợp lệ, có thể thử sửa hoặc gọi model khác trong giới hạn cấu hình.
- Lưu thông tin lỗi không chứa dữ liệu bí mật.

### Khi toàn bộ provider thất bại

- Không xóa job.
- Lưu checkpoint và kết quả của các bước đã hoàn thành.
- Chuyển job sang `WAITING_FOR_PROVIDER` hoặc trạng thái tương đương.
- Hiển thị lý do và các provider đã thử.
- Cho phép chạy lại khi dịch vụ phục hồi.

Fallback chỉ giúp giảm gián đoạn, không bảo đảm luôn có model thay thế nếu mọi provider đều hết quota hoặc ngừng hoạt động.

## 23. Circuit breaker và health check

Mỗi provider/model phải có trạng thái:

- `HEALTHY`.
- `DEGRADED`.
- `OPEN_CIRCUIT`.
- `DISABLED`.
- `UNKNOWN`.

Khi gặp nhiều lỗi liên tiếp, circuit breaker tạm ngừng gọi model đó. Sau khoảng nghỉ, thực hiện thử nghiệm giới hạn để xác định có thể sử dụng lại hay không.

Health check phải:

- Có timeout.
- Có giới hạn tần suất.
- Không sử dụng lượng token lớn.
- Không tiêu hao quota không cần thiết.
- Phân biệt lỗi xác thực, lỗi mạng, rate limit và lỗi model.

## 24. Usage ledger và chi phí

Mỗi request AI phải ghi nhận khi có thể:

- Job ID.
- Pipeline step.
- Provider ID.
- Model ID.
- Capability.
- Thời điểm bắt đầu/kết thúc.
- Trạng thái.
- Input/output token nếu provider trả về.
- Đơn vị sử dụng tương ứng.
- Chi phí nếu có dữ liệu đáng tin cậy.
- Số lần retry.
- Model fallback.
- Lý do thất bại.
- Thời gian phản hồi.

Không ghi prompt chứa dữ liệu nhạy cảm vào log mặc định.

Nếu provider không trả về usage, đánh dấu số liệu là `UNKNOWN`; không tự bịa số token hoặc chi phí.

---

# PHẦN VI. MODULE 1 — THU THẬP TIN TỨC VÀ SĂN XU HƯỚNG

## 25. Mục tiêu

Tìm kiếm và tổng hợp chủ đề có tiềm năng sản xuất video, theo dõi nguồn và tránh phụ thuộc vào một website duy nhất.

## 26. Nguồn dữ liệu

Hỗ trợ theo thứ tự ưu tiên:

1. RSS feed.
2. API chính thức của nguồn dữ liệu.
3. API tìm kiếm được cấp quyền.
4. Website cho phép truy cập theo điều khoản.
5. Các nguồn mạng xã hội thông qua API hoặc phương thức được phép.

Có thể khảo sát Google News, báo chí, YouTube, TikTok, Facebook và X. Tuy nhiên, từng connector phải được đánh giá riêng về quyền truy cập, quota, độ ổn định và điều khoản.

Không mặc định có thể đọc dữ liệu của mọi Facebook Group, TikTok account hoặc X account.

Không thiết kế hệ thống dựa trên việc vượt CAPTCHA, vượt cơ chế xác thực, đánh cắp cookie hoặc né giới hạn truy cập.

## 27. Cấu hình niche

Mỗi niche gồm:

- Tên chủ đề.
- Mô tả.
- Từ khóa chính.
- Từ khóa loại trừ.
- Ngôn ngữ.
- Quốc gia/khu vực mục tiêu.
- Danh sách nguồn.
- Lịch thu thập.
- Ngưỡng điểm xu hướng.
- Prompt định hướng nội dung.
- Phong cách kể chuyện.
- Nhóm kênh liên quan.
- Quy tắc fact-checking.
- Quy tắc hạn chế nội dung.

Ví dụ niche:

- Công nghệ.
- Tài chính.
- Khoa học.
- Lịch sử.
- Thể thao.
- Tin tức quốc tế.

Các chủ đề nhạy cảm cần quy tắc biên tập và kiểm chứng chặt chẽ hơn.

## 28. Trend scoring

Tạo điểm xu hướng dựa trên dữ liệu có sẵn:

- Mức độ mới.
- Số nguồn độc lập cùng đề cập.
- Tốc độ tăng số lần xuất hiện.
- Lượt tương tác khi nguồn thực sự cung cấp dữ liệu.
- Độ phù hợp với niche.
- Độ tin cậy nguồn.
- Mức độ trùng lặp với nội dung đã sản xuất.
- Khả năng tìm tư liệu hợp pháp.
- Rủi ro sai lệch hoặc nội dung chưa xác minh.

Trọng số phải cấu hình được và có thể điều chỉnh dựa trên dữ liệu thật.

Nếu không lấy được lượt tương tác, hệ thống không được tự gán số giả. Phải tính điểm trên các tín hiệu còn lại và thể hiện độ tin cậy thấp hơn.

## 29. Thu thập và lưu nguồn

Mỗi source item cần:

- URL gốc.
- Tiêu đề.
- Nguồn xuất bản.
- Thời gian xuất bản nếu có.
- Thời gian thu thập.
- Nội dung trích xuất được trong phạm vi cho phép.
- Tóm tắt.
- Ngôn ngữ.
- Tác giả nếu có.
- Dữ liệu tương tác nếu nguồn cung cấp.
- Trạng thái truy cập.
- Hash nội dung chuẩn hóa để phát hiện trùng lặp.
- Nguồn gốc và thông tin quyền sử dụng khi có.

Không lưu toàn bộ nội dung có bản quyền dài hạn nếu không có quyền phù hợp. Có thể lưu metadata, URL và trích đoạn cần thiết để kiểm chứng.

## 30. Nghiệm thu Module 1

- Tạo và chỉnh sửa được niche.
- Thêm được nguồn hợp lệ.
- Thu thập được ít nhất một nguồn thực tế trong môi trường thử nghiệm.
- Xử lý được nguồn không khả dụng mà không làm hỏng toàn bộ job.
- Phát hiện được URL hoặc nội dung trùng lặp.
- Điểm xu hướng có giải thích.
- Lưu được nguồn gốc cho nội dung thu thập.
- Không giả lập dữ liệu tương tác khi không có.
- Có test cho timeout, lỗi mạng, dữ liệu thiếu và nguồn không hợp lệ.

---

# PHẦN VII. MODULE 2 — BIÊN TẬP KỊCH BẢN VÀ STORYBOARD

## 31. Mục tiêu

Từ một chủ đề và các nguồn được lưu, hệ thống tạo kịch bản video có cấu trúc, có nguồn tham chiếu và có thể chỉnh sửa.

## 32. Quy trình viết kịch bản

1. Nhận topic và niche.
2. Lấy danh sách source items.
3. Chuẩn hóa và loại bỏ nguồn trùng lặp.
4. Trích xuất các dữ kiện chính.
5. Phân biệt dữ kiện, nhận định và giả thuyết.
6. Kiểm tra sự nhất quán giữa các nguồn.
7. Xác định thông tin còn thiếu hoặc mâu thuẫn.
8. Tạo outline.
9. Tạo hook mở đầu.
10. Viết phần nội dung chính.
11. Tạo phần kết.
12. Ước tính thời lượng theo giọng đọc.
13. Sinh storyboard JSON.
14. Kiểm tra schema và tính hợp lệ.
15. Cho phép người dùng xem trước và chỉnh sửa.

## 33. Quy tắc nội dung

- Không bịa sự kiện, con số, lời trích dẫn hoặc phát ngôn.
- Không biến suy đoán thành sự thật.
- Không tạo nguồn tham chiếu giả.
- Các tuyên bố quan trọng phải liên kết với một hoặc nhiều nguồn.
- Nếu các nguồn mâu thuẫn, phải thể hiện sự không chắc chắn.
- Nội dung tin tức cần giữ ngày tháng và bối cảnh.
- Không sao chép nguyên văn toàn bộ bài báo.
- Kịch bản phải được viết lại với cấu trúc và cách diễn đạt độc lập.
- Đối với tài chính, sức khỏe, pháp luật và nội dung nhạy cảm, phải tăng yêu cầu kiểm chứng và duyệt thủ công.
- Có thể tạo phong cách kể chuyện khác nhau theo niche nhưng không được làm sai lệch dữ kiện.

## 34. Cấu trúc storyboard JSON

Một storyboard phải có version schema và danh sách scenes.

Ví dụ minh họa:

```json
{
  "schema_version": "1.0",
  "language": "vi",
  "title": "Tiêu đề video",
  "hook": "Câu mở đầu",
  "estimated_duration_seconds": 60,
  "sources": [
    {
      "source_item_id": "source-id",
      "claims_supported": ["claim-1"]
    }
  ],
  "claims": [
    {
      "id": "claim-1",
      "text": "Nội dung cần kiểm chứng",
      "source_ids": ["source-id"],
      "verification_status": "verified"
    }
  ],
  "scenes": [
    {
      "id": "scene-001",
      "order": 1,
      "text": "Lời bình cho cảnh này.",
      "estimated_duration_seconds": 4,
      "search_keywords": [
        "từ khóa tiếng Việt",
        "English search keyword"
      ],
      "cutout_entity": null,
      "layout_type": "fullscreen",
      "transition_sfx": "whoosh",
      "visual_intent": "Mô tả hình ảnh mong muốn",
      "caption_emphasis": ["từ khóa"],
      "source_claim_ids": ["claim-1"]
    }
  ]
}
```

Schema chính thức phải được định nghĩa bằng Pydantic và version hóa.

Các giá trị enum phải được kiểm tra. Không chấp nhận JSON thiếu trường bắt buộc, sai kiểu dữ liệu hoặc chứa ID không tồn tại.

## 35. Trạng thái kiểm chứng

Mỗi claim có một trong các trạng thái:

- `UNVERIFIED`.
- `SUPPORTED`.
- `CONFLICTING_SOURCES`.
- `INSUFFICIENT_EVIDENCE`.
- `VERIFIED_BY_REVIEW`.

AI không được tự gán `VERIFIED_BY_REVIEW`. Trạng thái này chỉ do người dùng có quyền xác nhận hoặc một quy trình kiểm chứng độc lập đã được phê duyệt.

## 36. Nghiệm thu Module 2

- Sinh được kịch bản theo niche.
- Có hook, phần thân và kết luận.
- Sinh storyboard đúng schema.
- Mỗi claim quan trọng có liên kết nguồn hoặc được đánh dấu chưa xác minh.
- Có thể chỉnh sửa script và scene.
- Có thể tạo lại một scene mà không ghi đè toàn bộ nội dung người dùng đã chỉnh sửa.
- Lưu phiên bản script và lịch sử thay đổi.
- Kiểm thử được trường hợp model trả JSON lỗi, nội dung rỗng hoặc vượt giới hạn.

---

# PHẦN VIII. MODULE 3 — TÌM KIẾM VÀ XỬ LÝ TƯ LIỆU

## 37. Mục tiêu

Tìm ảnh/video phù hợp với từng scene, đánh giá chất lượng và quyền sử dụng trước khi đưa vào timeline.

## 38. Nguồn media

Ưu tiên:

- Kho media do người dùng tải lên.
- Media được cấp phép rõ ràng.
- Nguồn stock có API và giấy phép phù hợp.
- Wikimedia Commons hoặc nguồn tương đương sau khi xác minh giấy phép từng tài sản.
- Nguồn do đối tác hoặc người dùng cung cấp quyền sử dụng.
- API tìm kiếm hình ảnh/video được cấp phép.
- Tư liệu công khai chỉ khi điều kiện sử dụng thực sự cho phép.

Không mặc định rằng hình ảnh hoặc video tìm được trên Google Images, YouTube, TikTok hay website báo chí được phép tải xuống, tái sử dụng hoặc sử dụng thương mại.

Không tải và tái xuất bản nội dung có bản quyền nếu không có quyền sử dụng hợp lệ.

## 39. Media rights management

Mỗi media asset cần lưu:

- Nguồn gốc.
- URL nguồn.
- Người tải lên.
- Thời điểm thu thập.
- Giấy phép.
- Chủ sở hữu hoặc tác giả nếu xác định được.
- Phạm vi sử dụng.
- Có cho phép thương mại hay không.
- Có yêu cầu attribution hay không.
- Thời hạn giấy phép nếu có.
- Bằng chứng hoặc ghi chú xác minh.
- Trạng thái quyền sử dụng.

Các trạng thái:

- `UNKNOWN`.
- `NEEDS_REVIEW`.
- `LICENSED`.
- `USER_OWNED`.
- `PUBLIC_DOMAIN_VERIFIED`.
- `RESTRICTED`.
- `REJECTED`.

Asset có trạng thái `UNKNOWN`, `RESTRICTED` hoặc `REJECTED` không được tự động xuất bản theo policy mặc định.

## 40. Media search và candidate scoring

Mỗi scene có thể tạo nhiều candidate media.

Điểm đánh giá gồm:

- Mức độ phù hợp với lời thoại.
- Độ phân giải.
- Chất lượng hình ảnh.
- Mức độ liên quan đến nhân vật hoặc đối tượng.
- Khả năng crop 9:16.
- Chuyển động nếu là video.
- Chất lượng ánh sáng.
- Mức độ trùng lặp.
- Quyền sử dụng.
- Độ tin cậy của nguồn.

Vision model chỉ là công cụ hỗ trợ ra quyết định, không phải hệ thống chứng minh quyền tác giả hoặc bản quyền.

Có thể dùng ba mức:

- `GREEN`: phù hợp, quyền sử dụng đã được xác minh.
- `YELLOW`: có khả năng phù hợp nhưng cần người duyệt.
- `RED`: không phù hợp hoặc không đủ điều kiện sử dụng.

Chỉ `GREEN` mới được tự động đi tiếp nếu policy cho phép.

## 41. Trích đoạn video

Khi cần lấy clip từ video dài:

- Phải xác minh quyền sử dụng trước.
- Lưu timestamp bắt đầu và kết thúc.
- Ưu tiên trích đoạn gắn với nội dung scene.
- Không tạo timestamp vượt quá thời lượng nguồn.
- Kiểm tra video đầu ra không bị đen hoặc lỗi decode.
- Ghi lại source asset và thông tin clip gốc.

Không thiết kế quy trình lấy video dài từ nền tảng khác chỉ để tái sử dụng hàng loạt nhằm né hệ thống phát hiện nội dung trùng lặp.

## 42. Xóa nền và smart crop

Tính năng:

- Face detection.
- Subject detection.
- Smart crop 9:16.
- Blurred background.
- Split screen.
- Background removal.
- Viền hoặc đổ bóng cho ảnh nhân vật.
- Fallback crop khi không nhận diện được khuôn mặt.

Không giả định mọi ảnh đều có khuôn mặt hoặc model nhận diện luôn chính xác.

Nếu không xác định được chủ thể đáng tin cậy, sử dụng crop an toàn hoặc yêu cầu duyệt thủ công.

## 43. Nghiệm thu Module 3

- Tìm và nhập được media candidate.
- Lưu được source và license metadata.
- Không tự động coi tài sản chưa rõ quyền sử dụng là hợp lệ.
- Vision scoring có lý do và điểm số.
- Có thể thay thế asset trong giao diện.
- Có thể xem trước crop.
- Xử lý được file hỏng, định dạng không hỗ trợ, URL chết và timeout.
- Phát hiện được media trùng lặp ở mức phù hợp.
- Có test bảo đảm asset bị hạn chế không thể đi vào đường xuất bản tự động.

---

# PHẦN IX. MODULE 4 — TTS VÀ ĐỒNG BỘ LỜI ĐỌC

## 44. Mục tiêu

Tạo giọng đọc tự nhiên, quản lý cấu hình giọng đọc theo kênh và tạo timestamp đủ chính xác để dựng phụ đề.

## 45. TTS provider

Thiết kế adapter độc lập cho:

- Các API TTS có quyền truy cập hợp lệ.
- Provider TTS tiếng Việt.
- Provider tương thích OpenAI audio API nếu phù hợp.
- Engine local có giấy phép và hiệu năng phù hợp.
- Provider mới được thêm thông qua hệ thống registry.

Không mặc định bất kỳ dịch vụ nào luôn có gói miễn phí.

Phải hiển thị rõ giới hạn sử dụng, điều kiện thương mại và quota nếu đã xác minh.

## 46. Cấu hình giọng đọc

Theo từng kênh hoặc video:

- Provider.
- Voice ID.
- Ngôn ngữ.
- Tốc độ đọc.
- Pitch nếu hỗ trợ.
- Style nếu hỗ trợ.
- Format audio.
- Mức âm lượng.
- Tùy chọn phát âm từ viết tắt và tên riêng.
- Quy tắc đọc số, ngày tháng và đơn vị.
- Cấu hình giọng đọc mặc định.

## 47. Forced alignment

Quy trình:

1. Tạo audio từ script.
2. Kiểm tra audio hợp lệ.
3. Lấy duration thực tế bằng ffprobe.
4. Chạy forced alignment hoặc giải pháp timestamp tương đương.
5. Kiểm tra thứ tự timestamp.
6. Kiểm tra timestamp không âm và không vượt duration.
7. Lưu timestamp ở mức từ và câu nếu engine hỗ trợ.
8. Cho phép chỉnh sửa khi alignment không đáng tin cậy.

Nếu forced alignment không khả dụng, có thể dùng ASR để ước lượng timestamp, nhưng phải ghi rõ độ tin cậy và nguồn timestamp.

Không được tạo timestamp giả chỉ bằng cách chia đều số giây cho số từ rồi tuyên bố đó là đồng bộ chính xác.

## 48. Định dạng timestamp

```json
{
  "audio_duration_ms": 58200,
  "segments": [
    {
      "text": "Xin",
      "start_ms": 0,
      "end_ms": 280,
      "confidence": 0.97
    },
    {
      "text": "chào",
      "start_ms": 281,
      "end_ms": 610,
      "confidence": 0.95
    }
  ]
}
```

Đây chỉ là ví dụ schema. Timestamp thật phải lấy từ audio đã tạo.

## 49. Nghiệm thu Module 4

- Tạo được audio từ script trong một provider đã cấu hình.
- Có thể chọn voice theo kênh.
- Lưu file và metadata.
- Timestamp nằm trong duration.
- Có xử lý tên riêng, số và dấu câu.
- Có phương án khi TTS thất bại.
- Có phương án khi alignment không khả dụng.
- Không tạo lại audio nếu không cần thiết khi chỉ thay đổi watermark.
- Có test cho audio hỏng, thiếu timestamp, timeout và provider hết quota.

---

# PHẦN X. MODULE 5 — VIDEO ENGINE

## 50. Mục tiêu

Tự động dựng video từ storyboard, media, audio và cấu hình thương hiệu.

## 51. Video template

Phải có hệ thống template cấu hình được, tối thiểu:

- News Explainer.
- Fast News.
- Documentary.
- Tech Review.
- Top List.
- Interview/Quote.
- Generic Vertical Video.

Mỗi template xác định:

- Layout.
- Font.
- Màu sắc.
- Kích thước phụ đề.
- Vị trí title.
- Quy tắc chuyển cảnh.
- Watermark.
- Nhạc nền.
- Hiệu ứng âm thanh.
- Vị trí visual.
- Cấu hình thumbnail.

Không hardcode toàn bộ thiết kế video vào một hàm render duy nhất.

## 52. Thumbnail

- Hiển thị tiêu đề dễ đọc trên màn hình nhỏ.
- Dùng ảnh hoặc đồ họa có quyền sử dụng.
- Không tạo tiêu đề gây hiểu lầm.
- Tự kiểm tra vùng an toàn.
- Không để chữ bị cắt hoặc che khuất.
- Cho phép người dùng sửa tiêu đề và lựa chọn ảnh.
- Có thể sử dụng frame đầu tiên làm thumbnail trong video; thumbnail upload riêng phụ thuộc API từng nền tảng.

## 53. Layout và chuyển cảnh

Hỗ trợ:

- Fullscreen.
- Split screen.
- Blurred background.
- Smart crop.
- Ảnh nhân vật tách nền.
- Zoom in/out.
- Pan.
- Fade.
- Slide.
- Một số hiệu ứng chuyển cảnh có thể cấu hình.

Tần suất chuyển cảnh mặc định có thể khoảng 3–5 giây, nhưng phải điều chỉnh theo nội dung và nhịp kể.

Không ép mọi video dùng hiệu ứng giống nhau nếu làm giảm khả năng đọc hoặc gây khó chịu.

## 54. Phụ đề karaoke

- Hiển thị cụm từ ngắn.
- Highlight từ đang được đọc.
- Có thể chọn màu nhấn vàng hoặc đỏ.
- Font hỗ trợ đầy đủ tiếng Việt.
- Tự xuống dòng.
- Tránh che mặt nhân vật hoặc vùng UI quan trọng.
- Có cấu hình vị trí và kích thước.
- Đồng bộ theo timestamp thực.
- Hỗ trợ phụ đề thông thường khi không có word-level alignment.

## 55. Audio mixing

Mức âm lượng mục tiêu ban đầu:

- Voiceover: tham chiếu chính.
- Nhạc nền: khoảng 10–15% trong cấu hình tuyến tính ban đầu.
- SFX: khoảng 40% trong cấu hình tuyến tính ban đầu.

Các giá trị phần trăm chỉ là mức khởi tạo, không phải chuẩn âm học tuyệt đối.

Hệ thống phải hỗ trợ:

- Gain.
- Fade in/out.
- Ducking nhạc nền khi có lời đọc.
- Tránh clipping.
- Kiểm tra audio rỗng.
- Giữ độ rõ của lời thoại.
- Chuẩn hóa loudness theo cấu hình có thể điều chỉnh.

## 56. Watermark và thương hiệu

Mỗi kênh có thể cấu hình:

- Logo.
- Tên kênh.
- Vị trí watermark.
- Kích thước.
- Độ mờ.
- Font.
- Màu sắc.
- Intro/outro nếu có.

Watermark dùng để nhận diện thương hiệu, không được dùng làm cơ chế giả mạo quyền sở hữu hoặc né hệ thống phát hiện nội dung trùng lặp.

## 57. Video variation và nội dung trùng lặp

Hệ thống có thể tạo các phiên bản hợp lệ theo từng kênh bằng cách thay đổi:

- Tiêu đề.
- Cách kể chuyện.
- Thứ tự các phân cảnh khi phù hợp.
- Lựa chọn tư liệu có quyền sử dụng.
- Template.
- Branding.
- Caption và hashtag.
- Ngôn ngữ hoặc bản địa hóa.

Không coi việc đổi MD5, đổi tốc độ 1–2%, chỉnh màu rất nhẹ hoặc thêm watermark là bằng chứng cho thấy nội dung đã trở thành tác phẩm mới.

Không xây dựng cơ chế nhằm né phát hiện bản quyền, né hạn chế tài khoản hoặc vượt hệ thống chống spam của nền tảng.

Hệ thống phải ưu tiên giá trị biên tập thực sự, tư liệu hợp lệ và nội dung có tính nguyên bản.

## 58. Render pipeline

1. Validate storyboard.
2. Validate media.
3. Validate license policy.
4. Validate audio.
5. Tạo timeline.
6. Tạo thumbnail.
7. Ghép hình ảnh/video.
8. Render subtitles.
9. Mix audio.
10. Render file MP4.
11. Chạy ffprobe.
12. Kiểm tra duration, resolution, codec và audio stream.
13. Kiểm tra file có thể decode.
14. Kiểm tra các frame đen bất thường nếu phù hợp.
15. Lưu artifact.
16. Tạo preview.
17. Chuyển sang trạng thái chờ duyệt hoặc sẵn sàng xuất bản.

## 59. Render artifact và cache

Mỗi artifact cần lưu:

- Project ID.
- Pipeline version.
- Input version.
- Template version.
- Render configuration.
- Output path.
- File size.
- Duration.
- Resolution.
- Codec.
- Hash nội dung.
- Thời gian tạo.
- Trạng thái validation.

Nếu chỉ thay đổi caption hoặc metadata đăng bài, không được tự động render lại toàn bộ video khi không cần thiết.

Nếu thay đổi asset, script, audio hoặc template ảnh hưởng đầu ra, hệ thống phải xác định các bước phụ thuộc cần chạy lại.

## 60. Nghiệm thu Module 5

- Render được video MP4 hợp lệ.
- Đúng kích thước mặc định 1080 × 1920.
- Có audio và hình ảnh.
- Phụ đề hiển thị đúng.
- Không có timestamp vượt duration.
- Không đánh dấu READY nếu file hỏng hoặc không đạt kiểm tra bắt buộc.
- Lưu được artifact và thông tin nguồn.
- Có thể render lại sau khi thay đổi nội dung.
- Có thể phục hồi từ lỗi render mà không phải chạy lại mọi bước trước đó.
- Có test file rỗng, audio thiếu, media hỏng, thiếu font và lỗi FFmpeg.

---

# PHẦN XI. MODULE 6 — QUẢN TRỊ KÊNH VÀ XUẤT BẢN

## 61. Mục tiêu

Quản lý nhiều tài khoản mạng xã hội, lịch xuất bản, duyệt bài và kết quả đăng.

## 62. Quản lý tài khoản

Mỗi social account có:

- Platform.
- Tên hiển thị.
- External account ID nếu có.
- Niche.
- Branding.
- Voice profile.
- Posting policy.
- Timezone.
- Lịch đăng.
- Trạng thái kết nối.
- Trạng thái quyền truy cập.
- Ngày kiểm tra gần nhất.
- Thông tin token được lưu an toàn.
- Ghi chú.

Trạng thái:

- `ACTIVE`.
- `PAUSED`.
- `AUTH_REQUIRED`.
- `RESTRICTED`.
- `DISABLED`.
- `UNKNOWN`.

Không đánh dấu tài khoản bị cấm chỉ vì một request thất bại. Phải phân biệt lỗi xác thực, quota, mạng, quyền và trạng thái do nền tảng xác nhận.

## 63. Quản lý lịch đăng

Cho phép:

- Cấu hình số video mục tiêu mỗi ngày.
- Chọn giờ đăng.
- Chọn timezone.
- Cấu hình ngày trong tuần.
- Tạm dừng lịch.
- Giới hạn số bài đăng đồng thời.
- Đặt khoảng cách tối thiểu giữa các bài.
- Chọn kênh nhận video.
- Ưu tiên video.
- Đặt hạn chót.
- Chuyển sang duyệt thủ công khi có lỗi.

Không tự động đăng nhiều bài chỉ để bù cho lịch bị bỏ lỡ nếu điều đó có thể vi phạm giới hạn nền tảng hoặc policy người vận hành.

## 64. Publishing adapters

Mỗi nền tảng phải có adapter độc lập.

Interface mục tiêu:

- `validate_connection()`
- `validate_media()`
- `upload_media()`
- `create_post()`
- `publish_post()`
- `get_post_status()`
- `get_post_metrics()`
- `reconcile_unknown_result()`

Không được giả định tất cả nền tảng có cùng quy trình upload hoặc publish.

Ưu tiên Official API và quy trình được nền tảng cho phép.

Browser automation chỉ được cân nhắc nếu phù hợp với điều khoản và quyền sử dụng của nền tảng. Không xây dựng cơ chế vượt CAPTCHA, né phát hiện automation, xoay danh tính để né giới hạn hoặc tự động hóa đăng nhập trái phép.

Proxy không phải thành phần bắt buộc của MVP. Nếu sau này có yêu cầu mạng hợp lệ, phải đánh giá bảo mật, tính cần thiết và điều khoản nền tảng riêng.

## 65. Human-in-the-loop

Hai chế độ:

### Chế độ A — Bán tự động

- Tự động thu thập.
- Tự động viết script.
- Tự động chọn media.
- Tự động tạo voiceover.
- Tự động render.
- Hiển thị bản xem trước.
- Người dùng sửa hoặc duyệt.
- Sau khi duyệt, hệ thống mới xuất bản.

### Chế độ B — Full-auto có kiểm soát

- Tự động chạy pipeline.
- Chỉ sử dụng nguồn và asset đáp ứng policy.
- Chỉ xuất bản khi các bước kiểm tra bắt buộc đạt.
- Có thể đặt điều kiện yêu cầu duyệt thủ công.
- Tự động tạm dừng khi có lỗi nghiêm trọng, thiếu quyền hoặc kết quả không chắc chắn.
- Gửi thông báo về trạng thái.

Full-auto không được đồng nghĩa với bỏ qua kiểm tra chất lượng hoặc bản quyền.

## 66. Idempotency và chống đăng trùng

Mỗi post job cần một idempotency key nội bộ ổn định.

Trước khi retry sau timeout đăng bài:

1. Kiểm tra request trước đã được nền tảng tiếp nhận hay chưa.
2. Nếu API có post ID hoặc status endpoint, dùng nó để đối chiếu.
3. Nếu kết quả không rõ, đặt trạng thái `PUBLISH_RESULT_UNKNOWN`.
4. Thử reconcile trước khi gửi lại.
5. Không tự động đăng lại nếu có nguy cơ tạo bài trùng.

Không thể bảo đảm tuyệt đối chống trùng nếu nền tảng không cung cấp cơ chế idempotency hoặc API tra cứu tương ứng. Trong trường hợp đó phải thể hiện giới hạn và có bước xác nhận phù hợp.

## 67. Caption và hashtag

Mỗi nền tảng có thể dùng metadata riêng:

- Title.
- Caption.
- Description.
- Hashtags.
- Visibility.
- Category.
- Thumbnail.
- Audience setting.
- Các trường riêng theo API.

LLM có thể hỗ trợ tạo nội dung, nhưng phải kiểm tra giới hạn ký tự, trường bắt buộc và policy nền tảng trước khi gửi.

Không dùng hashtag spam hoặc tạo mô tả sai lệch để tăng tương tác.

## 68. Nghiệm thu Module 6

- Quản lý được social account.
- Quản lý được lịch đăng.
- Có trạng thái quyền truy cập.
- Có adapter tách biệt theo nền tảng.
- Có cơ chế duyệt bài.
- Có xử lý lỗi upload và publish.
- Có lịch sử đăng bài.
- Có cơ chế reconcile khi kết quả đăng chưa rõ.
- Có test không đăng trùng trong các tình huống có thể kiểm soát.
- Có test quyền truy cập và token hết hạn.
- Không tuyên bố đăng thành công nếu nền tảng chưa xác nhận.

---

# PHẦN XII. DATABASE VÀ DATA MODEL

## 69. Nguyên tắc thiết kế dữ liệu

Database phải được thiết kế cho pipeline có lịch sử, khả năng tiếp tục và quan hệ nhiều-nhiều giữa video, nguồn, media và kênh.

Không giới hạn hệ thống ở năm bảng cơ bản của bản nháp ban đầu. Schema dưới đây là mục tiêu nghiệp vụ, các bảng được triển khai theo giai đoạn.

Dùng UUID hoặc ID phù hợp nhất quán. Các bảng có timestamps cần `created_at` và `updated_at` khi thích hợp.

Các trường JSON chỉ được dùng cho dữ liệu thực sự linh hoạt; các quan hệ và trạng thái quan trọng nên có schema rõ ràng.

## 70. Nhóm người dùng và cấu hình

### `users`

- `id`
- `email`
- `password_hash` hoặc external identity
- `role`
- `status`
- `created_at`
- `updated_at`

### `system_settings`

- `id`
- `key`
- `value_json`
- `is_secret_reference`
- `updated_at`

Không lưu API key dạng plaintext trong `value_json`.

### `audit_logs`

- `id`
- `actor_id`
- `action`
- `resource_type`
- `resource_id`
- `metadata_json`
- `created_at`

Không ghi token, cookie hoặc secret vào metadata.

## 71. Nhóm nội dung

### `niches`

- `id`
- `name`
- `description`
- `keywords_json`
- `excluded_keywords_json`
- `scrape_config_json`
- `system_prompt`
- `language`
- `status`
- `created_at`
- `updated_at`

### `source_connectors`

- `id`
- `name`
- `connector_type`
- `config_json`
- `status`
- `last_success_at`
- `last_error_code`
- `created_at`

### `source_items`

- `id`
- `connector_id`
- `niche_id`
- `url`
- `title`
- `publisher`
- `published_at`
- `collected_at`
- `content_excerpt`
- `summary`
- `content_hash`
- `engagement_json`
- `verification_status`
- `metadata_json`

### `trend_topics`

- `id`
- `niche_id`
- `title`
- `summary`
- `trend_score`
- `confidence`
- `first_seen_at`
- `last_seen_at`
- `status`

### `trend_source_links`

- `trend_topic_id`
- `source_item_id`
- `relevance_score`

## 72. Nhóm video và storyboard

### `video_projects`

- `id`
- `niche_id`
- `title`
- `topic`
- `language`
- `target_duration_seconds`
- `status`
- `current_stage`
- `created_by`
- `created_at`
- `updated_at`

### `script_versions`

- `id`
- `video_project_id`
- `version_number`
- `script_text`
- `structured_content_json`
- `generation_metadata_json`
- `created_at`

### `script_claims`

- `id`
- `script_version_id`
- `claim_text`
- `verification_status`
- `confidence`
- `created_at`

### `claim_sources`

- `claim_id`
- `source_item_id`
- `support_type`
- `notes`

### `storyboards`

- `id`
- `video_project_id`
- `script_version_id`
- `schema_version`
- `storyboard_json`
- `status`
- `created_at`

### `storyboard_scenes`

- `id`
- `storyboard_id`
- `scene_order`
- `spoken_text`
- `estimated_duration_ms`
- `layout_type`
- `visual_intent`
- `transition_config_json`
- `status`

## 73. Nhóm media và audio

### `media_assets`

- `id`
- `asset_type`
- `source_url`
- `storage_key`
- `mime_type`
- `file_size`
- `width`
- `height`
- `duration_ms`
- `content_hash`
- `rights_status`
- `license_metadata_json`
- `created_at`

### `scene_media_candidates`

- `id`
- `scene_id`
- `media_asset_id`
- `relevance_score`
- `quality_score`
- `rights_status`
- `review_status`
- `selected`

### `audio_assets`

- `id`
- `video_project_id`
- `provider_id`
- `model_id`
- `voice_id`
- `storage_key`
- `duration_ms`
- `alignment_status`
- `created_at`

### `word_timestamps`

- `id`
- `audio_asset_id`
- `word_text`
- `start_ms`
- `end_ms`
- `confidence`
- `sequence_number`

## 74. Nhóm AI Router

### `ai_providers`

- `id`
- `name`
- `provider_type`
- `base_url`
- `auth_config_reference`
- `status`
- `priority`
- `last_health_check_at`
- `metadata_json`

### `ai_models`

- `id`
- `provider_id`
- `model_identifier`
- `display_name`
- `capabilities_json`
- `free_status`
- `quota_metadata_json`
- `context_limit`
- `status`
- `last_verified_at`
- `last_test_result`
- `metadata_json`

### `ai_usage_events`

- `id`
- `provider_id`
- `model_id`
- `job_id`
- `capability`
- `request_status`
- `input_tokens`
- `output_tokens`
- `usage_units_json`
- `estimated_cost`
- `retry_count`
- `latency_ms`
- `created_at`

### `provider_health_events`

- `id`
- `provider_id`
- `model_id`
- `event_type`
- `error_code`
- `details_json`
- `created_at`

Không lưu API key thực tế trong `ai_providers` hoặc `ai_models`.

## 75. Nhóm pipeline và render

### `pipeline_jobs`

- `id`
- `video_project_id`
- `job_type`
- `status`
- `current_step`
- `progress_percent`
- `retry_count`
- `error_code`
- `error_summary`
- `started_at`
- `finished_at`
- `created_at`
- `updated_at`

### `pipeline_step_runs`

- `id`
- `pipeline_job_id`
- `step_name`
- `status`
- `input_reference_json`
- `output_reference_json`
- `attempt_number`
- `started_at`
- `finished_at`
- `error_code`

### `render_artifacts`

- `id`
- `video_project_id`
- `artifact_type`
- `storage_key`
- `content_hash`
- `duration_ms`
- `width`
- `height`
- `codec_metadata_json`
- `validation_status`
- `created_at`

## 76. Nhóm kênh và xuất bản

### `social_accounts`

- `id`
- `platform`
- `account_name`
- `external_account_id`
- `niche_id`
- `timezone`
- `status`
- `credential_reference`
- `branding_config_json`
- `created_at`
- `updated_at`

### `schedules`

- `id`
- `account_id`
- `videos_per_day`
- `post_times_json`
- `timezone`
- `auto_approve`
- `enabled`
- `created_at`
- `updated_at`

### `post_queues`

- `id`
- `video_project_id`
- `account_id`
- `artifact_id`
- `caption`
- `hashtags_json`
- `scheduled_time`
- `posted_time`
- `post_url`
- `external_post_id`
- `status`
- `idempotency_key`
- `created_at`
- `updated_at`

### `publishing_attempts`

- `id`
- `post_queue_id`
- `attempt_number`
- `request_status`
- `external_post_id`
- `error_code`
- `error_summary`
- `started_at`
- `finished_at`

### `analytics_snapshots`

- `id`
- `post_queue_id`
- `collected_at`
- `views`
- `likes`
- `comments`
- `shares`
- `retention_json`
- `metrics_json`

Chỉ lưu các chỉ số mà API hoặc nguồn dữ liệu thực tế cung cấp. Chỉ số không được cung cấp phải để trống hoặc đánh dấu không khả dụng, không được điền số giả.

## 77. Ràng buộc database

- Foreign key phải đầy đủ.
- Các trường trạng thái phải có enum hoặc validation rõ ràng.
- Có unique constraint cho các khóa chống trùng phù hợp.
- Có index cho các trường truy vấn thường xuyên.
- Có index cho lịch đăng, trạng thái job và thời gian tạo.
- Có transaction cho các thao tác nhiều bước cần tính nhất quán.
- Không lưu đường dẫn file tùy ý có thể dẫn đến truy cập ngoài storage root.
- Migration phải có kiểm thử và hướng dẫn rollback khi khả thi.
- Dữ liệu xóa mềm chỉ được dùng khi có lý do nghiệp vụ rõ ràng.

---

# PHẦN XIII. PIPELINE ENGINE VÀ QUẢN LÝ CÔNG VIỆC

## 78. Pipeline tiêu chuẩn

`DISCOVER`
→ `COLLECT_SOURCES`
→ `ANALYZE_TREND`
→ `GENERATE_SCRIPT`
→ `VERIFY_CLAIMS`
→ `GENERATE_STORYBOARD`
→ `SEARCH_MEDIA`
→ `VERIFY_MEDIA_RIGHTS`
→ `SCORE_MEDIA`
→ `GENERATE_AUDIO`
→ `ALIGN_AUDIO`
→ `BUILD_TIMELINE`
→ `RENDER_VIDEO`
→ `VALIDATE_ARTIFACT`
→ `WAITING_FOR_APPROVAL`
→ `READY_TO_PUBLISH`
→ `PUBLISH`
→ `COLLECT_ANALYTICS`

Tùy cấu hình, một số bước có thể được bỏ qua nếu không cần thiết, nhưng các kiểm tra bắt buộc không được bỏ qua.

## 79. Trạng thái job

- `QUEUED`.
- `RUNNING`.
- `RETRYING`.
- `WAITING_FOR_PROVIDER`.
- `WAITING_FOR_APPROVAL`.
- `READY`.
- `SUCCEEDED`.
- `FAILED`.
- `CANCELLED`.
- `NEEDS_ATTENTION`.

Mỗi trạng thái phải có định nghĩa và quy tắc chuyển trạng thái.

Không được để job ở `RUNNING` vô thời hạn sau khi worker chết.

## 80. Checkpoint và resume

Mỗi pipeline step phải lưu:

- Input reference.
- Output reference.
- Version của input.
- Version của code hoặc pipeline khi phù hợp.
- Trạng thái.
- Số lần chạy.
- Thời điểm bắt đầu/kết thúc.
- Error code.
- Khả năng retry.

Khi worker bị dừng:

1. Xác định bước cuối cùng đã hoàn tất.
2. Kiểm tra output của bước đó còn tồn tại và hợp lệ.
3. Tiếp tục từ bước phù hợp.
4. Không tạo lại tài nguyên đắt tiền nếu output vẫn hợp lệ.
5. Không lặp lại hành động bên ngoài có nguy cơ tạo tác dụng phụ, đặc biệt là publish.

## 81. Retry policy

Retry phải cấu hình theo từng loại lỗi.

- Lỗi mạng tạm thời: retry giới hạn.
- Rate limit: tuân thủ thời gian chờ.
- API key không hợp lệ: dừng và yêu cầu xử lý.
- Dữ liệu đầu vào sai: không retry vô ích.
- File hỏng: chuyển sang bước khắc phục hoặc yêu cầu thay asset.
- Provider không khả dụng: thử fallback hoặc đưa job vào trạng thái chờ.
- Lỗi publish chưa rõ kết quả: reconcile trước khi retry.

## 82. Hủy và ưu tiên job

Người dùng phải có thể:

- Hủy job chưa chạy.
- Yêu cầu hủy job đang chạy nếu bước hiện tại hỗ trợ.
- Ưu tiên job.
- Tạm dừng pipeline mới.
- Xem hàng đợi.
- Xem job bị lỗi.
- Chạy lại job.
- Chạy lại từ một bước được hỗ trợ.
- Xem log và artifact.

Hủy job không được xóa các artifact hoặc dữ liệu lịch sử trừ khi người dùng thực hiện thao tác xóa riêng.

---

# PHẦN XIV. GIAO DIỆN DASHBOARD

## 83. Nguyên tắc UX/UI

- Giao diện hiện đại, dễ hiểu, phù hợp sử dụng hàng ngày.
- Ưu tiên thao tác thực tế hơn hiệu ứng trang trí.
- Trạng thái phải nhất quán giữa các trang.
- Hiển thị loading, empty, error, success và disabled states.
- Không dùng số liệu giả trong dashboard production.
- Hỗ trợ tìm kiếm, lọc, phân trang và thao tác hàng loạt khi cần.
- Hỗ trợ responsive.
- Có thông báo thành công/thất bại rõ ràng.
- Có xác nhận với hành động phá hủy hoặc có tác dụng phụ.
- Có khả năng truy cập bằng bàn phím cho các thao tác chính.
- Không dùng màu sắc làm tín hiệu duy nhất cho trạng thái.

## 84. Các trang bắt buộc

### 84.1. Dashboard Overview

Hiển thị:

- Tổng số video projects.
- Job đang chạy.
- Job chờ duyệt.
- Video đã render.
- Lịch đăng sắp tới.
- Bài đăng thành công/thất bại.
- Provider AI đang hoạt động.
- Cảnh báo quota và lỗi.
- Thống kê sử dụng thực tế.
- Hoạt động gần đây.

### 84.2. Niches

- Danh sách niche.
- Thêm/sửa/xóa.
- Từ khóa.
- Nguồn.
- Lịch thu thập.
- Prompt.
- Nhóm kênh liên quan.
- Trạng thái hoạt động.

### 84.3. Trend Explorer

- Danh sách topic.
- Điểm xu hướng.
- Nguồn liên quan.
- Thời gian cập nhật.
- Độ tin cậy.
- Trạng thái xác minh.
- Tạo video từ topic.

### 84.4. Video Projects

- Danh sách video.
- Trạng thái pipeline.
- Niche.
- Ngày tạo.
- Thời lượng.
- Preview.
- Lỗi gần nhất.
- Nút chạy lại hoặc mở chi tiết.

### 84.5. Script & Storyboard Editor

- Chỉnh sửa kịch bản.
- Xem nguồn.
- Hiển thị claim chưa xác minh.
- Chỉnh sửa từng scene.
- Tìm media cho scene.
- Thay thế media.
- Thay đổi layout.
- Lưu phiên bản.
- Tạo lại phần được chọn.

### 84.6. Media Library

- Thumbnail.
- Loại file.
- Nguồn.
- License status.
- Độ phân giải.
- Thời lượng.
- Scene đang sử dụng.
- Bộ lọc.
- Preview.
- Thao tác xác minh quyền sử dụng.

### 84.7. AI Provider Manager

Theo PHẦN V.

### 84.8. Video Renderer

- Chọn template.
- Chọn branding.
- Chọn voice.
- Preview.
- Tiến trình render.
- Validation result.
- Download artifact nếu có quyền.
- Render lại.

### 84.9. Social Accounts

- Danh sách tài khoản.
- Kết nối.
- Trạng thái token.
- Niche.
- Lịch đăng.
- Branding.
- Kiểm tra kết nối.
- Tạm dừng tài khoản.

### 84.10. Content Calendar

- Lịch theo ngày/tuần/tháng.
- Video chờ duyệt.
- Video đã lên lịch.
- Trạng thái đăng.
- Kênh nhận video.
- Chỉnh sửa lịch.
- Phát hiện xung đột lịch.

### 84.11. Publishing Queue

- Danh sách post jobs.
- Thời gian đăng.
- Trạng thái.
- Lịch sử thử.
- Post URL.
- Lý do lỗi.
- Chạy lại an toàn.
- Reconcile trạng thái chưa rõ.

### 84.12. Analytics

- Views.
- Likes.
- Comments.
- Shares.
- Retention nếu có.
- Hiệu suất theo niche.
- Hiệu suất theo template.
- Hiệu suất theo kênh.
- Hiệu suất theo khung giờ.
- Thời điểm lấy dữ liệu.
- Nguồn dữ liệu và trạng thái API.

Không hiển thị biểu đồ giả khi chưa có dữ liệu thật. Có thể hiển thị empty state với hướng dẫn kết nối nguồn.

### 84.13. Settings

- Timezone.
- Storage.
- Queue.
- Video defaults.
- Default language.
- Default template.
- Approval policy.
- AI routing policy.
- Notifications.
- Retention policy.
- Logging.
- Backup.

---

# PHẦN XV. API DESIGN

## 85. Quy tắc API

- Prefix mặc định `/api/v1`.
- Dùng Pydantic schema cho request/response.
- Response format nhất quán.
- Validation lỗi có mã rõ ràng.
- Phân trang cho danh sách lớn.
- Có filter và sort được whitelist.
- Có authentication và authorization.
- Có rate limiting cho endpoint nhạy cảm.
- Có request ID để theo dõi log.
- Không trả secret trong response.
- Tài liệu OpenAPI phải được sinh từ implementation và kiểm tra.
- Không để frontend truy cập trực tiếp database.

## 86. Nhóm endpoint mục tiêu

### System

- `GET /api/v1/health`
- `GET /api/v1/ready`
- `GET /api/v1/system/status`

### Niches và trends

- `GET /api/v1/niches`
- `POST /api/v1/niches`
- `PATCH /api/v1/niches/{id}`
- `DELETE /api/v1/niches/{id}`
- `GET /api/v1/trends`
- `POST /api/v1/trends/collect`

### Video projects

- `GET /api/v1/videos`
- `POST /api/v1/videos`
- `GET /api/v1/videos/{id}`
- `PATCH /api/v1/videos/{id}`
- `POST /api/v1/videos/{id}/generate-script`
- `POST /api/v1/videos/{id}/generate-storyboard`
- `POST /api/v1/videos/{id}/render`
- `POST /api/v1/videos/{id}/cancel`
- `POST /api/v1/videos/{id}/retry`

### Media

- `GET /api/v1/media`
- `POST /api/v1/media/upload`
- `GET /api/v1/media/{id}`
- `PATCH /api/v1/media/{id}/rights`
- `POST /api/v1/scenes/{id}/search-media`
- `POST /api/v1/scenes/{id}/select-media`

### AI providers

- `GET /api/v1/ai/providers`
- `POST /api/v1/ai/providers`
- `PATCH /api/v1/ai/providers/{id}`
- `POST /api/v1/ai/providers/{id}/test`
- `POST /api/v1/ai/providers/{id}/refresh-models`
- `GET /api/v1/ai/models`
- `POST /api/v1/ai/models`
- `POST /api/v1/ai/models/{id}/test`
- `GET /api/v1/ai/usage`
- `GET /api/v1/ai/health`

### Social publishing

- `GET /api/v1/social/accounts`
- `POST /api/v1/social/accounts`
- `POST /api/v1/social/accounts/{id}/test`
- `GET /api/v1/schedules`
- `POST /api/v1/schedules`
- `GET /api/v1/publishing/queue`
- `POST /api/v1/publishing/{id}/approve`
- `POST /api/v1/publishing/{id}/publish`
- `POST /api/v1/publishing/{id}/reconcile`

### Analytics

- `GET /api/v1/analytics/overview`
- `GET /api/v1/analytics/posts`
- `GET /api/v1/analytics/niches`

Các endpoint trên là hợp đồng mục tiêu. Chỉ được báo endpoint đã hoạt động khi đã triển khai và test.

---

# PHẦN XVI. BẢO MẬT

## 87. Authentication và authorization

- Phải có hệ thống xác thực phù hợp với phạm vi triển khai.
- Password phải được hash bằng thuật toán phù hợp.
- Phân quyền theo vai trò.
- Kiểm tra quyền ở backend, không chỉ ẩn nút trên frontend.
- Có session/token expiration.
- Có cơ chế thu hồi session hoặc credential khi cần.
- Bảo vệ endpoint thay đổi provider, account và publishing settings.

Vai trò tối thiểu:

- `ADMIN`: quản lý hệ thống.
- `EDITOR`: tạo và chỉnh sửa nội dung.
- `OPERATOR`: quản lý lịch và xuất bản.
- `VIEWER`: chỉ xem dữ liệu được phép.

Trong MVP cá nhân có thể dùng một tài khoản admin, nhưng cấu trúc phân quyền không được thiết kế theo giả định mọi endpoint đều công khai.

## 88. Secret management

- API key được lưu trong secret store hoặc mã hóa bằng khóa nằm ngoài database.
- Không commit `.env`.
- Có `.env.example` chỉ chứa tên biến và giá trị mẫu không nhạy cảm.
- Không trả API key đầy đủ về frontend.
- Không log request headers chứa authorization.
- Có thể thay key mà không phải xóa cấu hình provider.
- Có quy trình revoke và rotate key.
- Khi backup, secret phải được xử lý theo policy riêng.

## 89. SSRF và file security

- Validate URL nguồn.
- Chặn URL trỏ tới mạng nội bộ hoặc metadata service khi không được phép.
- Kiểm tra redirect.
- Giới hạn kích thước tải xuống.
- Giới hạn timeout.
- Không tin MIME type do client cung cấp.
- Xác minh loại file thực tế.
- Đặt giới hạn độ dài tên file.
- Ngăn path traversal.
- Không thực thi file người dùng tải lên.
- Chạy FFmpeg với tham số an toàn, không ghép command từ input chưa được escape.
- Giới hạn tài nguyên render và tải media.

## 90. Audit và quyền riêng tư

Các thao tác quan trọng phải có audit log:

- Thay đổi provider.
- Thay đổi secret reference.
- Thay đổi quyền tài khoản.
- Duyệt video.
- Publish.
- Hủy job.
- Xóa media.
- Thay đổi license status.
- Thay đổi policy tự động.

Không lưu dữ liệu nhạy cảm lâu hơn mức cần thiết.

Có policy về thời hạn lưu file, log, dữ liệu nguồn và dữ liệu analytics.

---

# PHẦN XVII. LOGGING, MONITORING VÀ THÔNG BÁO

## 91. Logging

Log phải có cấu trúc và tối thiểu hỗ trợ:

- Timestamp.
- Level.
- Service.
- Request ID.
- Job ID.
- Pipeline step.
- Provider/model khi phù hợp.
- Error code.
- Thời gian xử lý.

Không log:

- API key.
- Password.
- Cookie.
- Access token.
- Nội dung xác thực.
- Dữ liệu cá nhân không cần thiết.

## 92. Monitoring

Theo dõi:

- API availability.
- Database connectivity.
- Queue backlog.
- Worker heartbeat.
- Job duration.
- Job failure rate.
- Provider error rate.
- Rate-limit events.
- Storage usage.
- Render duration.
- Publishing failure rate.

## 93. Notifications

Có thể tích hợp Telegram hoặc notification trong dashboard.

Thông báo cho:

- Video đã render xong.
- Cần duyệt video.
- Job thất bại.
- Provider hết quota hoặc mất kết nối.
- Token hết hạn.
- Bài đăng thành công.
- Kết quả publish chưa xác định.
- Dung lượng lưu trữ gần giới hạn.

Không đưa secret hoặc thông tin nhạy cảm vào thông báo.

---

# PHẦN XVIII. TESTING VÀ CHẤT LƯỢNG

## 94. Các lớp kiểm thử

### Unit tests

Kiểm tra logic độc lập:

- Router selection.
- Quota tracking.
- Retry policy.
- Storyboard schema.
- Trend scoring.
- Rights policy.
- Timeline calculations.
- Status transitions.
- Idempotency.

### Integration tests

Kiểm tra:

- Database.
- Migration.
- Redis.
- Worker.
- Storage.
- FFmpeg.
- Provider adapter.
- API.
- Publishing adapter bằng sandbox hoặc mock có phân biệt rõ.

### End-to-end tests

Kiểm tra luồng:

Tạo topic
→ Thu thập nguồn
→ Sinh script
→ Sinh storyboard
→ Chọn media
→ Tạo audio
→ Render
→ Validate
→ Duyệt
→ Xuất bản trong sandbox hoặc tài khoản thử nghiệm được phép.

### Live tests

Chỉ dùng khi có credential hợp lệ và đã được cho phép.

Báo cáo phải phân biệt:

- Unit test.
- Mock integration test.
- Sandbox test.
- Live provider test.
- Live publishing test.

Không dùng kết quả mock để tuyên bố live integration đã thành công.

## 95. Quality gates

Một giai đoạn chỉ được PASS khi:

- Tất cả test bắt buộc đạt.
- Không có lỗi nghiêm trọng chưa xử lý.
- Không có secret bị lộ.
- Migration và rollback được đánh giá.
- Tài liệu được cập nhật.
- Chức năng được kiểm tra bằng đúng phương thức phù hợp.
- Không có TODO được trình bày như tính năng đã hoàn thành.
- Có bằng chứng cho các tuyên bố quan trọng.

## 96. Test tình huống lỗi

Bắt buộc kiểm thử:

- Provider trả 429.
- Provider trả 401/403.
- Provider trả 5xx.
- Timeout.
- Network unavailable.
- Model catalog không khả dụng.
- Model không hỗ trợ capability yêu cầu.
- JSON output sai schema.
- Storage hết dung lượng.
- Worker bị dừng giữa job.
- Database tạm thời mất kết nối.
- Media hỏng.
- Audio hỏng.
- FFmpeg thất bại.
- Social token hết hạn.
- Publish timeout nhưng kết quả không rõ.
- Người dùng nhấn publish nhiều lần.
- Hai worker cùng xử lý một job.
- Media chưa xác minh quyền sử dụng.
- Một source trả dữ liệu không hợp lệ.

---

# PHẦN XIX. ROADMAP TRIỂN KHAI

Không cố định rằng toàn bộ dự án sẽ hoàn thành trong một số tuần nhất định. Thời gian phụ thuộc vào API access, quota, độ phức tạp media và kết quả kiểm thử thực tế.

Các phase được nghiệm thu độc lập.

## PHASE 0 — SPECIFICATION & TECHNICAL FOUNDATION

Mục tiêu:

- Đọc và hiểu PROJECT.md.
- Chốt kiến trúc.
- Thiết kế data model.
- Thiết kế API contracts.
- Thiết kế AI Router interface.
- Định nghĩa trạng thái pipeline.
- Định nghĩa security policy.
- Tạo cấu trúc repository.
- Thiết lập môi trường phát triển.
- Thiết lập lint, type checks và test framework.

Deliverables:

- `ARCHITECTURE.md`.
- `DATA_MODEL.md`.
- `API_SPEC.md`.
- `AI_ROUTER.md`.
- `SECURITY.md`.
- `TESTING.md`.
- Initial database migration.
- Health endpoint.
- Basic frontend shell.
- CI workflow nếu môi trường hỗ trợ.

Acceptance:

- Backend chạy được.
- Frontend chạy được.
- Database migration chạy được.
- Health endpoint trả kết quả đúng.
- Test nền tảng đạt.
- Không có secret.
- Kiến trúc được mô tả rõ.

## PHASE 1 — AI ROUTER CORE

Mục tiêu:

Xây nền tảng AI Router trước khi tích hợp AI vào các module nghiệp vụ.

Phạm vi:

- Provider registry.
- Model registry.
- Secret management.
- Custom OpenAI-compatible adapter.
- Provider-specific adapter đầu tiên.
- Model discovery.
- Manual model entry.
- Capability registry.
- Health check.
- Quota Manager.
- Routing policy.
- Retry và fallback.
- Circuit breaker.
- Usage ledger.
- UI Provider Manager.

Acceptance:

- Thêm và chỉnh sửa provider.
- Kiểm tra được kết nối.
- Có thể thêm model thủ công.
- Có thể khám phá catalog khi provider hỗ trợ.
- Có thể chọn model theo capability.
- Có thể chuyển model khi provider gặp lỗi phù hợp.
- Có thể xử lý 429 mà không retry liên tục.
- Có thể đưa job về trạng thái chờ khi hết lựa chọn.
- Không chuyển sang model trả phí trong `FREE_ONLY`.
- Không để lộ secret.
- Test có cả tình huống thành công và lỗi.

## PHASE 2 — MVP VIDEO GENERATOR

Mục tiêu:

Tạo một video hoàn chỉnh từ một chủ đề hoặc URL nguồn hợp lệ.

Phạm vi:

- Nhập chủ đề hoặc nguồn.
- Thu thập và lưu metadata nguồn.
- Sinh script.
- Sinh storyboard.
- Media search.
- Rights check.
- Chọn hoặc tải media hợp lệ.
- TTS.
- Alignment.
- Render video.
- Validation.
- Preview.

Acceptance:

- Có thể tạo video từ đầu đến cuối.
- Kết quả được tạo bằng dịch vụ hoặc engine thật đã cấu hình.
- Video MP4 đạt tiêu chuẩn đã chọn.
- Có audio và subtitle.
- Có metadata và nguồn.
- Không sử dụng asset bị policy chặn.
- Có thể xem log và kết quả từng bước.
- Có thể tiếp tục sau một lỗi có thể phục hồi.

## PHASE 3 — DASHBOARD VÀ EDITOR

Mục tiêu:

Người dùng có thể quản lý quy trình mà không cần sửa file hoặc database thủ công.

Phạm vi:

- Dashboard Overview.
- Niche Manager.
- Trend Explorer.
- Video Projects.
- Script Editor.
- Storyboard Editor.
- Media Library.
- Render preview.
- Job monitoring.
- Approval workflow.
- Notification cơ bản.

Acceptance:

- Các thao tác CRUD hoạt động thật.
- Dữ liệu giao diện lấy từ backend.
- Trạng thái loading/error/empty đầy đủ.
- Có thể sửa script và media.
- Không mất chỉnh sửa khi tạo lại một phần nội dung.
- Có test cho các luồng quan trọng.

## PHASE 4 — STABILITY, CHECKPOINTS VÀ COST CONTROL

Mục tiêu:

Làm cho hệ thống có khả năng vận hành bền vững hơn.

Phạm vi:

- Job recovery.
- Checkpoint.
- Idempotency.
- Retry policy.
- Queue monitoring.
- Provider circuit breaker.
- Usage reporting.
- Storage cleanup policy.
- Audit logs.
- Backup/restore.
- Resource limits.

Acceptance:

- Job không mất trạng thái sau khi worker restart.
- Có thể phục hồi các job đủ điều kiện.
- Không chạy lặp vô hạn.
- Có báo cáo provider usage.
- Không tự phát sinh chi phí ngoài policy.
- Có quy trình backup và kiểm tra restore.

## PHASE 5 — SOCIAL ACCOUNT MANAGEMENT

Mục tiêu:

Quản lý tài khoản và lịch đăng trước khi triển khai xuất bản tự động hàng loạt.

Phạm vi:

- Social account registry.
- Credential handling.
- Connection test.
- Timezone.
- Schedule.
- Content calendar.
- Caption/hashtag generation.
- Approval workflow.
- Publishing queue.

Acceptance:

- Quản lý được tài khoản.
- Quản lý được lịch.
- Có kiểm tra quyền truy cập.
- Chưa tự động đăng khi chưa có adapter đã xác minh.
- Lịch không tạo ra post job trùng.

## PHASE 6 — PUBLISHING ADAPTER ĐẦU TIÊN

Mục tiêu:

Triển khai một nền tảng trước, lựa chọn dựa trên API access và điều kiện sử dụng thực tế.

Phạm vi:

- Adapter cho nền tảng được chọn.
- Upload.
- Publish.
- Status reconciliation.
- Error handling.
- Post history.
- Live test được cho phép.

Acceptance:

- Kết nối hợp lệ.
- Upload đúng định dạng.
- Có trạng thái publish rõ ràng.
- Có xử lý token hết hạn.
- Không tự đăng trùng khi kết quả chưa rõ.
- Có bằng chứng live test khi được phép thực hiện.

Không triển khai đồng thời mọi nền tảng nếu adapter đầu tiên chưa đạt acceptance.

## PHASE 7 — MỞ RỘNG NỀN TẢNG XUẤT BẢN

Mục tiêu:

Thêm các nền tảng còn lại qua adapter độc lập.

Phạm vi:

- TikTok nếu có quyền API phù hợp.
- YouTube Shorts.
- Facebook Reels.
- Instagram Reels.

Acceptance:

- Mỗi adapter có test riêng.
- Tài liệu về quyền và giới hạn API.
- Có xử lý lỗi đặc thù từng nền tảng.
- Không giả định endpoint hoặc permission chưa được cấp.

## PHASE 8 — ANALYTICS VÀ FEEDBACK LOOP

Mục tiêu:

Theo dõi hiệu suất và hỗ trợ tối ưu nội dung.

Phạm vi:

- Thu thập metrics từ API khả dụng.
- Analytics dashboard.
- So sánh template.
- So sánh niche.
- Theo dõi hiệu suất theo thời gian.
- Gợi ý cải thiện dựa trên dữ liệu.
- Đánh dấu dữ liệu thiếu hoặc stale.

Acceptance:

- Chỉ dùng dữ liệu thực.
- Có timestamp lấy dữ liệu.
- Phân biệt số liệu không có và số 0.
- Không tuyên bố quan hệ nhân quả chỉ từ tương quan.
- Có thể xác định nguồn của từng chỉ số.

## PHASE 9 — FULL AUTOMATION CÓ KIỂM SOÁT

Mục tiêu:

Tự động hóa tối đa những bước đã được kiểm chứng.

Phạm vi:

- Scheduled discovery.
- Automated script generation.
- Media selection theo policy.
- TTS và render tự động.
- Auto-approval theo rule được cấu hình.
- Scheduled publishing.
- Provider health monitoring.
- Alerts.
- Retry và recovery.

Acceptance:

- Không bỏ qua rights check.
- Không bỏ qua validation.
- Không tự đăng khi có claim hoặc media bị đánh dấu cần duyệt.
- Có thể tắt automation toàn hệ thống.
- Có thể tạm dừng một niche hoặc account.
- Có audit log.
- Có thể tiếp tục khi provider phục hồi.
- Đã kiểm thử các trường hợp lỗi nghiêm trọng.

---

# PHẦN XX. CÁC CHÍNH SÁCH VẬN HÀNH

## 97. Chính sách miễn phí

Mục tiêu là tận dụng các dịch vụ miễn phí hợp lệ, không phải vượt giới hạn dịch vụ.

- Ưu tiên provider có free tier được xác minh.
- Theo dõi quota và điều khoản.
- Không tự bật billing.
- Không tự nâng cấp gói.
- Không dùng nhiều tài khoản để né hạn mức.
- Không mặc định model miễn phí hôm nay sẽ miễn phí mãi mãi.
- Có thể tạm dừng pipeline khi hết nguồn lực miễn phí.
- Cho phép người dùng tự thêm key hoặc provider mới.
- Có chế độ chỉ sử dụng provider đã được xác minh là miễn phí.

Danh sách model và quota phải được cập nhật theo dữ liệu chính thức tại thời điểm kiểm tra. PROJECT.md không phải danh sách quota cố định.

## 98. Chính sách dữ liệu và bản quyền

- Ưu tiên nguồn có quyền sử dụng rõ ràng.
- Lưu lại nguồn và license metadata.
- Không tự động tái xuất bản media không rõ quyền.
- Không giả mạo nguồn hoặc tác giả.
- Không xóa dấu hiệu bản quyền của người khác để sử dụng lại nội dung.
- Hỗ trợ nội dung do người dùng sở hữu hoặc có giấy phép phù hợp.
- Có cơ chế loại bỏ asset khỏi các video chưa xuất bản.
- Có quy trình xử lý khi phát hiện quyền sử dụng bị thay đổi.

## 99. Chính sách an toàn nội dung

Các nội dung về sức khỏe, tài chính, pháp luật, khủng hoảng và sự kiện nhạy cảm phải có kiểm tra tăng cường.

Hệ thống phải hỗ trợ:

- Flag claim chưa xác minh.
- Flag nguồn mâu thuẫn.
- Cảnh báo thông tin thiếu bối cảnh.
- Duyệt thủ công.
- Ghi lại người duyệt.
- Lưu phiên bản trước và sau khi sửa.

Không dùng tự động hóa để tạo nội dung lừa đảo, mạo danh hoặc gây hiểu lầm có chủ đích.

## 100. Chính sách backup

Phải xác định:

- Dữ liệu nào được backup.
- Tần suất backup.
- Thời gian lưu.
- Nơi lưu backup.
- Cách bảo vệ backup.
- Cách phục hồi database.
- Cách phục hồi media.
- Cách kiểm tra backup có thể sử dụng.

Một bản backup chưa từng được thử phục hồi không được coi là đã xác minh.

---

# PHẦN XXI. QUY TRÌNH LÀM VIỆC VỚI ANTIGRAVITY

## 101. Vai trò của Antigravity

Antigravity là coding agent thực hiện nhiệm vụ theo đặc tả. Nó không được tự ý mở rộng phạm vi hoặc báo cáo thành công khi chưa có bằng chứng.

Mỗi nhiệm vụ phải xác định:

- Mục tiêu.
- Phạm vi file.
- Các yêu cầu MUST.
- Những gì không được thay đổi.
- Các bước triển khai.
- Test phải chạy.
- Tiêu chí nghiệm thu.
- Kết quả cần báo cáo.

## 102. Quy trình bắt buộc cho mỗi nhiệm vụ

### Bước 1 — Inspect

- Đọc tài liệu liên quan.
- Kiểm tra code hiện có.
- Kiểm tra dependency.
- Xác định module phụ thuộc.
- Xác định rủi ro.
- Không sửa file ngay khi chưa hiểu cấu trúc.

### Bước 2 — Plan

Tạo kế hoạch ngắn, nêu:

- File dự kiến thêm/sửa.
- Các thay đổi logic.
- Migration cần thiết.
- Test cần thêm.
- Rủi ro tương thích.

Với nhiệm vụ nhỏ có thể lập kế hoạch ngay trong báo cáo thay vì tạo file riêng.

### Bước 3 — Implement

- Thực hiện đúng phạm vi.
- Không tạo abstraction không cần thiết.
- Không lặp code.
- Không để secret.
- Không bỏ validation.
- Không nuốt lỗi một cách im lặng.
- Không để TODO thay cho chức năng MUST.

### Bước 4 — Verify

Chạy các lệnh phù hợp:

- Lint.
- Type checking.
- Unit tests.
- Integration tests.
- Build.
- Migration check.
- Smoke test.
- Live test khi có quyền và khi cần.

Không được ghi PASS cho test chưa chạy.

### Bước 5 — Audit

Kiểm tra:

- Chức năng mới có thực sự hoạt động không.
- Có regression không.
- Có log hoặc secret bị lộ không.
- Có lỗi xử lý trạng thái không.
- Có tài liệu cần cập nhật không.
- Có tác dụng phụ ngoài phạm vi không.

### Bước 6 — Report

Báo cáo theo mẫu:

```text
TASK REPORT

Status: PASS / PARTIAL / FAIL / BLOCKED

1. Objective
2. Files created
3. Files modified
4. Implementation details
5. Tests executed
6. Actual test results
7. Live verification evidence
8. Known limitations
9. Remaining issues
10. Recommended next task
```

Phân biệt rõ:

- `PASS`: tất cả acceptance criteria bắt buộc đạt.
- `PARTIAL`: có phần hoàn thành nhưng còn tiêu chí chưa đạt.
- `FAIL`: đã kiểm tra và phát hiện lỗi hoặc tiêu chí không đạt.
- `BLOCKED`: chưa thể kiểm tra hoặc triển khai do thiếu quyền, key, dịch vụ, thông tin hoặc điều kiện cần thiết.

## 103. Quy tắc Git

- Dùng Git ngay từ đầu.
- Commit theo các mốc logic.
- Không commit secret hoặc file media lớn không cần thiết.
- Không xóa lịch sử hoặc force push nếu chưa được cho phép.
- Không tự push lên remote khi chưa được đồng ý.
- Không tự triển khai production.
- Giữ working tree dễ kiểm tra.
- Ghi nội dung commit rõ ràng.

## 104. Quy tắc chống làm việc hình thức

Antigravity không được:

- Tạo hàng chục file rỗng để báo cáo đã tạo kiến trúc.
- Thay API thật bằng mock nhưng giữ tên tính năng như production.
- Thêm nút không có handler.
- Thêm endpoint chỉ trả dữ liệu hardcode.
- Dùng dữ liệu demo trong dashboard mà không đánh dấu.
- Bỏ test vì test đang fail.
- Hạ tiêu chuẩn acceptance chỉ để chuyển phase.
- Ghi “hoàn thành” nếu mới chỉ có UI.
- Tự thêm thư viện hoặc đổi framework chỉ vì thuận tiện.
- Bỏ qua lỗi bản quyền hoặc bảo mật để pipeline chạy nhanh hơn.

---

# PHẦN XXII. ĐIỀU KIỆN NGHIỆM THU TOÀN DỰ ÁN

## 105. Functional acceptance

Dự án chỉ được coi là hoàn thành bản production mục tiêu khi:

- Có thể cấu hình niche và nguồn.
- Có thể thu thập dữ liệu hợp lệ.
- Có thể tạo kịch bản và storyboard.
- Có thể kiểm tra claim và nguồn.
- Có thể tìm và lựa chọn media.
- Có kiểm tra quyền sử dụng.
- Có thể tạo giọng đọc.
- Có timestamp phụ đề hoặc fallback được đánh dấu đúng.
- Có thể render video.
- Có kiểm tra file đầu ra.
- Có thể xem và sửa video trước khi xuất bản.
- Có thể quản lý tài khoản và lịch.
- Có ít nhất một publishing adapter hoạt động thật theo quyền API được cấp.
- Có lịch sử đăng và trạng thái.
- Có analytics khi nguồn API hỗ trợ.
- Có AI Router cho phép thêm provider và model.
- Có quota handling và fallback.
- Có checkpoint và recovery.
- Có audit log và secret management.
- Có tài liệu cài đặt, vận hành và phục hồi.

## 106. Reliability acceptance

- Không mất job chỉ vì một request AI thất bại.
- Không retry vô hạn.
- Không coi rate limit là lỗi nội dung.
- Không tạo lại mọi artifact khi chỉ một bước không liên quan thay đổi.
- Không publish khi validation bắt buộc thất bại.
- Không tự động publish asset bị policy chặn.
- Không đánh dấu publish thành công khi chưa có xác nhận phù hợp.
- Không tạo post trùng trong các trường hợp hệ thống có đủ thông tin để ngăn.
- Không để worker restart làm mất toàn bộ tiến trình.
- Có cảnh báo khi không còn provider khả dụng.

## 107. Security acceptance

- Không có secret trong Git.
- Không trả secret đầy đủ qua API.
- Không có endpoint quản trị công khai ngoài ý muốn.
- Có authorization ở backend.
- Có validation input.
- Có bảo vệ SSRF cho URL tùy chỉnh.
- Có giới hạn upload.
- Có kiểm tra file media.
- Có audit log cho thao tác quan trọng.
- Có quy trình backup và phục hồi được kiểm thử.

## 108. Documentation acceptance

Phải có:

- `README.md`: hướng dẫn cài đặt và chạy.
- `PROJECT.md`: đặc tả gốc.
- `ARCHITECTURE.md`: kiến trúc thực tế.
- `DATA_MODEL.md`: database và quan hệ.
- `API_SPEC.md`: API contracts.
- `AI_ROUTER.md`: provider, model, quota và fallback.
- `MEDIA_RIGHTS.md`: chính sách tư liệu.
- `SECURITY.md`: bảo mật.
- `TESTING.md`: hướng dẫn test.
- `DEPLOYMENT.md`: triển khai.
- `OPERATIONS.md`: giám sát và xử lý sự cố.
- `ROADMAP.md`: tiến độ và phần còn lại.

Tài liệu phải phản ánh implementation thực tế. Nếu có sự khác biệt giữa tài liệu và code, phải ghi nhận và cập nhật.

---

# PHẦN XXIII. VIỆC ĐẦU TIÊN PHẢI LÀM

## 109. Nhiệm vụ khởi động cho Antigravity

Khi bắt đầu dự án, Antigravity phải thực hiện theo thứ tự sau:

1. Đọc toàn bộ `PROJECT.md`.
2. Tóm tắt yêu cầu sản phẩm và các MUST.
3. Liệt kê các quyết định kiến trúc.
4. Kiểm tra môi trường phát triển và công cụ hiện có.
5. Đề xuất cấu trúc repository.
6. Xây dựng sơ đồ kiến trúc.
7. Xây dựng data model và API contracts sơ bộ.
8. Xác định rủi ro kỹ thuật, quota, API access và bản quyền.
9. Đề xuất thứ tự triển khai và acceptance criteria cho Phase 0.
10. Chờ xác nhận trước các quyết định làm thay đổi kiến trúc hoặc phát sinh chi phí.

Trong bước đầu tiên, không triển khai toàn bộ hệ thống cùng lúc.

Không tích hợp hàng loạt provider trước khi AI Router có hợp đồng ổn định.

Không làm giao diện hoàn chỉnh trước khi xác định dữ liệu và API chính.

Không triển khai auto-posting trước khi pipeline tạo video và cơ chế duyệt đã đạt yêu cầu.

## 110. Deliverables đầu tiên

Antigravity phải trả về:

- Bản tóm tắt yêu cầu.
- Sơ đồ kiến trúc đề xuất.
- Danh sách module và quan hệ phụ thuộc.
- Data model ban đầu.
- API contracts ban đầu.
- Danh sách rủi ro và cách kiểm chứng.
- Kế hoạch Phase 0.
- Danh sách acceptance criteria.
- Danh sách thông tin còn thiếu cần người dùng quyết định.

Sau khi kế hoạch được xác nhận, mới triển khai Phase 0.

---

# PHẦN XXIV. ĐỊNH HƯỚNG PHÁT TRIỂN SAU MVP

Các tính năng dưới đây chỉ được xem xét sau khi pipeline cốt lõi ổn định.

## 111. Mở rộng AI

- Tự động đánh giá chất lượng model theo bộ test nội bộ.
- So sánh model theo tác vụ.
- Tự điều chỉnh routing dựa trên latency và failure rate.
- Tối ưu prompt theo niche.
- Model evaluation dashboard.
- Embedding-based search.
- Semantic duplicate detection.
- Provider usage forecasting.

Không tự động thay đổi model mặc định nếu chưa có policy và bằng chứng đủ tin cậy.

## 112. Mở rộng sản xuất video

- Nhiều ngôn ngữ.
- Voice profile riêng.
- Template editor nâng cao.
- Motion graphics.
- B-roll matching tốt hơn.
- Auto reframing nâng cao.
- Batch production.
- Video series.
- Reusable intro/outro.
- Content repurposing.
- Tạo nhiều định dạng từ cùng một project.

## 113. Mở rộng MCN

- Quản trị nhiều nhóm kênh.
- Quyền truy cập theo nhóm.
- Báo cáo hiệu suất.
- Phân tích nội dung.
- Quản lý tài sản thương hiệu.
- Quản lý lịch chiến dịch.
- Báo cáo chi phí.
- Export dữ liệu.
- Quản lý workflow cộng tác.

## 114. Quy tắc mở rộng

Không thêm tính năng chỉ vì AI có thể code được.

Mọi tính năng mới phải trả lời:

1. Giải quyết vấn đề gì?
2. Có phụ thuộc module nào?
3. Có ảnh hưởng dữ liệu hiện tại không?
4. Có làm tăng chi phí hoặc quota không?
5. Có tăng rủi ro bảo mật hoặc bản quyền không?
6. Có tiêu chí nghiệm thu cụ thể không?
7. Có thể triển khai mà không phá vỡ tính ổn định hiện tại không?

---

# PHẦN XXV. HỆ THỐNG AUTONOMOUS TASK ORCHESTRATION & DAG ENGINE

## 115. Mục tiêu & Nguyên tắc điều phối tự chủ

Autonomous Task Orchestrator là trái tim điều hành của toàn bộ nền tảng, chịu trách nhiệm tự động hóa quy trình sản xuất video từ đầu vào (mục tiêu hoặc URL bài báo) đến thành phẩm xuất bản mà không đòi hỏi thao tác thủ công từng bước.

Nguyên tắc cốt lõi:
1. **Phân rã kế hoạch thành Đồ thị có hướng không chu trình (DAG - Directed Acyclic Graph):**
   - Khi tiếp nhận một mục tiêu (Goal) hoặc URL bài báo, Orchestrator tự phân tích và sinh danh sách các nhiệm vụ (`orchestration_tasks`) có ID, độ ưu tiên, đầu vào, đầu ra dự kiến và tập hợp quan hệ phụ thuộc (`task_dependencies`).
   - Tự động kiểm tra tính hợp lệ của đồ thị (Cycle Detection / Topological Sorting).
   - Chỉ cho phép chạy song song những nhiệm vụ hoàn toàn độc lập (ví dụ: tạo thumbnail và phân tích audio có thể xử lý song song sau khi có kịch bản).
2. **Nguyên tắc Idempotency & Chống trùng lặp:**
   - Mỗi task gắn liền với một khóa `idempotency_key` duy nhất dựa trên input hash và plan ID.
   - Khi backend khởi động lại hoặc tác vụ được thử lại (retry), Orchestrator tuyệt đối không tạo task hoặc artifact trùng lặp.

## 116. Vòng đời nhiệm vụ (Task Lifecycle & State Machine)

Mọi nhiệm vụ trong hệ thống phải tuân thủ nghiêm ngặt máy trạng thái bền vững (Persistent State Machine) được lưu trực tiếp vào cơ sở dữ liệu:

- `pending`: Nhiệm vụ mới khởi tạo, đang chờ các nhiệm vụ tiền đề hoàn tất.
- `queued`: Tất cả dependency đã hoàn tất thành công, nhiệm vụ được đẩy vào hàng đợi worker (Redis/Celery).
- `running`: Worker đang tích cực thực thi nhiệm vụ.
- `retrying`: Gặp lỗi tạm thời (mạng, rate-limit), đang chờ thực hiện lại theo exponential backoff có jitter.
- `blocked`: Nhiệm vụ bị chặn do dependency thất bại hoặc vi phạm Quality Gate bắt buộc.
- `completed`: Hoàn thành xuất sắc, đã vượt qua Quality Gate và tạo checkpoint output hợp lệ.
- `failed`: Thất bại hoàn toàn sau khi đã dùng hết số lần retry cho phép hoặc gặp lỗi không thể phục hồi (invalid input, 401 unrecoverable).
- `cancelled`: Bị hủy bởi người vận hành hoặc do plan tổng thể bị dừng.

## 117. Điểm kiểm soát bền vững & Tự phục hồi (Checkpoint & Recovery)

1. **Lưu trữ Checkpoint:**
   - Mỗi khi một task chuyển sang `completed`, hệ thống bắt buộc lưu một bản ghi `task_checkpoints` bao gồm đường dẫn artifact, mã băm (content hash), siêu dữ liệu đầu ra và kết quả kiểm định.
2. **Khôi phục sau sự cố (Crash Recovery):**
   - Khi backend khởi động lại, Orchestrator tự động quét cơ sở dữ liệu tìm các plan đang `running`.
   - Với mỗi task bị đứt đoạn, Orchestrator kiểm tra checkpoint của các bước trước đó và tái kích hoạt luồng từ bước gần nhất mà không cần tạo lại kịch bản, audio hoặc video tốn kém tài nguyên.

## 118. Cổng kiểm định chất lượng (Quality Gates)

Mỗi bước trong DAG trước khi bàn giao dữ liệu cho bước kế tiếp phải vượt qua Quality Gate tương ứng:
- **Kịch bản (Script):** Đúng cấu trúc JSON, có hook, đủ số cảnh, độ dài từ 130-160 từ tiếng Việt, các sự kiện quan trọng có nguồn đối chiếu.
- **Tư liệu (Media):** Trạng thái bản quyền đạt yêu cầu (`LICENSED`, `PUBLIC_DOMAIN_VERIFIED`), kích thước và độ phân giải tương thích crop 9:16.
- **Âm thanh (Audio & Alignment):** Tệp âm thanh không rỗng, duration > 0, timestamp phụ đề không âm và không vượt tổng duration của audio.
- **Video Render:** Kiểm tra bằng ffprobe xác nhận container MP4, codec H.264, âm thanh AAC, đúng tỷ lệ 1080x1920, không bị frame đen bất thường.
- Nếu kiểm tra thất bại: Tự động kích hoạt cơ chế sửa chữa trong giới hạn (Self-correction max 2 lần, ví dụ đổi media candidate dự phòng hoặc điều chỉnh crop) trước khi đánh dấu lỗi.

## 119. Điều độ & Ranh giới tài nguyên (Scheduler & Resource Bounds)

Hệ thống điều phối phải có các giới hạn bảo vệ:
- **Giới hạn số tác vụ đồng thời:** Cấu hình trần `MAX_CONCURRENT_TASKS` để tránh làm quá tải CPU/RAM trong quá trình render video.
- **Giới hạn lưu trữ:** Tự động dọn dẹp các tệp tạm thời sau khi artifact cuối cùng đã được kiểm định và lưu trữ an toàn.
- **Chính sách duyệt xuất bản (Human-in-the-loop Gate):** Cho dù toàn bộ quy trình sản xuất video diễn ra tự động 100%, bước xuất bản ra mạng xã hội công khai phải tuân thủ cờ `require_human_approval` của từng kênh. Không tự ý đăng bài công khai nếu người dùng chưa phê duyệt theo cấu hình.

---

# KẾT LUẬN

Mục tiêu của AI Video Shorts Automation & MCN Platform không chỉ là tạo ra một video bằng AI, mà là xây dựng một hệ thống sản xuất nội dung có khả năng vận hành lặp lại, theo dõi được, phục hồi được, quản lý được chi phí và mở rộng được.

Ba ưu tiên nền tảng:

1. **AI Router mở rộng:** thêm provider/model dễ dàng, chọn model đúng tác vụ, kiểm soát quota và fallback an toàn.
2. **Pipeline bền vững:** mỗi bước có trạng thái, checkpoint, artifact và khả năng phục hồi.
3. **Chất lượng đầu ra có kiểm chứng:** kịch bản có nguồn, media có quyền sử dụng, video được validate và bài đăng có trạng thái xác nhận.

Không coi số lượng model, số lượng file code hoặc số tính năng giao diện là thước đo duy nhất của tiến độ.

Thước đo cuối cùng là hệ thống thực sự hoàn thành được quy trình đầu cuối, xử lý được lỗi, giữ được dữ liệu, không phát sinh chi phí ngoài ý muốn và có bằng chứng kiểm thử rõ ràng.

**Đây là tài liệu gốc của dự án. Mọi triển khai phải tuân theo tài liệu này, ghi nhận các thay đổi được phê duyệt và cập nhật tài liệu khi implementation thay đổi.**