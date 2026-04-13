# ECHO - THE WHISPER WIDGET 🎙️

> *"Nghe thấy nhau ngay cả khi không chạm."*

Echo là một ứng dụng mạng xã hội ngách tập trung vào âm thanh, hoạt động như một "Locket phiên bản Audio". Dự án biến màn hình chính (Home Screen) thành một chiếc máy bộ đàm tinh tế, nơi những lời thì thầm và âm thanh của bạn bè được gửi đi và cảm nhận một cách riêng tư nhất.

---

## 🌟 Tính năng độc bản (USPs)

- **Máy thì thầm (Raise-to-Listen):** Tự động phát âm thanh qua loa trong khi đưa máy lên tai (sử dụng cảm biến tiệm cận).
- **Xúc giác (Haptic Heartbeat):** Thông báo tin nhắn mới bằng nhịp rung thay vì âm thanh ồn ào.
- **Bảng âm thanh (Soundboard):** Gửi nhanh các âm thanh meme hoặc tiếng động đặc trưng chỉ trong 0.5 giây.
- **Widget Tương tác:** Ghi âm và gửi ngay từ màn hình chính mà không cần mở ứng dụng.

---

## 📁 Cấu trúc dự án

- `echo-backend/`: API Backend xây dựng bằng FastAPI, tích hợp Supabase.
- `_old_web_mockup/`: Bản mẫu giao diện Web (React + Vite + Tailwind CSS).
- `idea.md`: Tài liệu chi tiết về tầm nhìn và logic sản phẩm.
- `echo-backend/supabase_setup.sql`: File script thiết lập cơ sở dữ liệu trên Supabase.

---

## 🛠️ Hướng dẫn cài đặt

### 1. Backend (FastAPI)

#### Yêu cầu hệ thống:
- Python 3.9+
- Tài khoản Supabase (để lưu trữ database và file audio)

#### Các bước thực hiện:
1. Truy cập thư mục backend:
   ```bash
   cd echo-backend
   ```
2. Cài đặt các thư viện cần thiết:
   ```bash
   pip install -r requirements.txt
   ```
3. Thiết lập biến môi trường:
   - Copy file `.env.example` thành `.env`.
   - Cập nhật các thông tin `SUPABASE_URL`, `SUPABASE_KEY` và các bí mật khác từ Dashboard của dự án Supabase.
4. Chạy server:
   ```bash
   uvicorn app.main:app --reload
   ```
   API sẽ mặc định chạy tại: `http://localhost:8000`. Bạn có thể xem tài liệu API (Swagger) tại `/docs`.

---

### 2. Database (Supabase)

Để thiết lập cơ sở dữ liệu:
1. Đăng nhập vào [Supabase Console](https://app.supabase.com/).
2. Mở **SQL Editor** trong dự án của bạn.
3. Copy nội dung từ file `echo-backend/supabase_setup.sql` và chạy (Run).
   - Script này sẽ tạo các bảng: `users`, `friends`, `groups`, `messages`, `stories`, `soundboard_items`.
   - Thiết lập các chính sách bảo mật (RLS) và Triggers tự động.

---

### 3. Web Mockup (React)

Bản mockup web dùng để mô phỏng giao diện và luồng hoạt động:
1. Truy cập thư mục mockup:
   ```bash
   cd _old_web_mockup
   ```
2. Cài đặt dependencies:
   ```bash
   npm install
   ```
3. Chạy ứng dụng:
   ```bash
   npm run dev
   ```
   Ứng dụng sẽ chạy tại: `http://localhost:3000`.

---

## 🔄 Luồng hoạt động cốt lõi

1. **Gửi:** Nhấn giữ nút Micro trên Widget để ghi âm (max 10s) -> Thả tay để gửi.
2. **Báo hiệu:** Người nhận nhận được độ rung Haptic đặc trưng.
3. **Nghe:** Người nhận đưa điện thoại lên tai -> Cảm biến tiệm cận kích hoạt -> Phát âm thanh qua loa trong (Earpiece).

---

## 📝 Ghi chú phát triển (MVP)

- **Giai đoạn 1:** Hoàn thiện Widget tương tác trên iOS/Android và hệ thống nhắn tin audio cơ bản.
- **Giai đoạn 2:** Tích hợp cảm biến tiệm cận cho tính năng "Áp tai để nghe".
- **Giai đoạn 3:** Thêm Voice Changer và kho Soundboard đa dạng.

---
*Dự án đang trong quá trình phát triển tích cực. Mọi đóng góp xin vui lòng liên hệ đội ngũ phát triển.*
