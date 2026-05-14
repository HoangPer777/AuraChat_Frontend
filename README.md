# AuraChat Frontend

Giao diện người dùng của **Aura Chat** — xây dựng bằng **React 18 + Vite + Tailwind CSS**.

## Tech Stack

| Thành phần | Công nghệ |
|---|---|
| UI Framework | React 18 |
| Build Tool | Vite 5 |
| Styling | Tailwind CSS 3 |
| State Management | Zustand |
| HTTP Client | Axios |
| WebSocket | STOMP.js + SockJS |
| Video/Audio | WebRTC (simple-peer) |
| Routing | React Router v6 |
| Container | Docker + Nginx |

## Cấu trúc thư mục

```
src/
├── pages/
│   ├── auth/
│   │   ├── LoginPage.jsx          # Đăng nhập (email + Google/Facebook)
│   │   ├── RegisterPage.jsx       # Đăng ký
│   │   ├── ForgotPasswordPage.jsx # Quên mật khẩu (gửi OTP)
│   │   ├── ResetPasswordPage.jsx  # Đặt lại mật khẩu
│   │   └── OAuth2CallbackPage.jsx # Nhận token sau OAuth2
│   └── chat/
│       └── ChatPage.jsx           # Trang chat chính
├── services/
│   ├── api.js                     # Axios instance + auto refresh token
│   └── websocket.js               # STOMP WebSocket client
├── store/
│   ├── authStore.js               # Zustand: user, token
│   ├── chatStore.js               # Zustand: conversations, messages
│   └── presenceStore.js           # Zustand: online status
└── App.jsx                        # Routes
```

---

## Yêu cầu

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) >= 24
- Docker Compose >= 2.20

> Để chạy local (không Docker): Node.js >= 20

---

## 1. Tạo file `.env`

Sao chép file mẫu rồi điền thông tin:

```bash
cp .env.example .env
```

> **Lưu ý:** Tất cả biến môi trường Vite phải có tiền tố `VITE_` mới được nhúng vào bundle.

---

## 2. Chạy bằng Docker Compose

> Backend phải đang chạy trước (xem README của `AuraChat_Backend`).

```bash
# Build và khởi động
docker compose up --build

# Chạy nền
docker compose up --build -d

# Xem logs
docker compose logs -f frontend

# Dừng
docker compose down
```

Sau khi khởi động:

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |

---

## 3. Chạy local (không Docker)

```bash
# Cài dependencies
npm install

# Chạy dev server
npm run dev
```

Truy cập: http://localhost:5173

---

## 4. Thứ tự khởi động đầy đủ

Để chạy toàn bộ hệ thống Aura Chat:

```
1. cd AuraChat_Backend  →  docker compose up -d
2. cd AuraChat_Frontend →  docker compose up -d
```

Hoặc chạy local:

```
1. cd AuraChat_Backend  →  ./mvnw spring-boot:run
2. cd AuraChat_Frontend →  npm run dev
```

---

## 5. Các trang chính

| Route | Trang |
|---|---|
| `/login` | Đăng nhập |
| `/register` | Đăng ký |
| `/forgot-password` | Quên mật khẩu |
| `/reset-password` | Đặt lại mật khẩu |
| `/oauth2/callback` | Callback sau đăng nhập Google/Facebook |
| `/chat` | Trang chat chính |

---

## Thành viên thực hiện

- Huỳnh Linh Hoài
- Phan Văn Hoàng

Giảng viên hướng dẫn: **Lê Phi Hùng**
