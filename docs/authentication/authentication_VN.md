[← Về README chính](../README_VN.md) · [🇬🇧 English](authentication.md)

# 🔐 Xác thực

Odoo External JSON-2 API xác thực bằng **API key**, không dùng session cookie. Trang này hướng dẫn cách lấy API key và cách đưa việc xác thực bằng key vào luồng đăng nhập của app.

---

## Lấy Odoo API Key

1. Đăng nhập vào Odoo với user bạn muốn sử dụng.
2. Mở menu user (avatar góc trên bên phải) và chọn **Preferences**.
3. Vào tab **Account Security**.
4. Click **New API Key**.
5. Nhập mô tả (ví dụ: `rn-odoo test`) và chọn ngày hết hạn.
6. Click **Generate Key**, sau đó **copy key ngay lập tức**. Odoo chỉ hiển thị key một lần duy nhất.

Dùng key đó làm giá trị `apiKey` khi tạo instance `Odoo`.

> 💡 **Gợi ý:** với production, hãy tạo user bot riêng với quyền tối thiểu cần thiết.

---

## Các chiến lược xác thực

Khác với JSON-RPC API cũ, JSON-2 không chấp nhận đăng nhập trực tiếp bằng username/password. Tùy theo kiến trúc app của bạn, hãy chọn một trong các chiến lược sau:

### 1. API key trực tiếp (đơn giản nhất)

Tạo API key thủ công trong Odoo và dán vào app. Phù hợp cho công cụ nội bộ, bot hoặc prototype.

```typescript
const odoo = new Odoo({
  host: 'https://your-odoo-server.com',
  apiKey: 'your_api_key',
});
```

### 2. Backend proxy (khuyên dùng cho app người dùng)

App gửi username/password đến backend của bạn. Backend xác thực với Odoo và trả về API key (hoặc token ngắn hạn để backend đổi lấy API key). Sau đó app dùng API key đó với `rn-odoo`.

```typescript
// 1. Đăng nhập qua backend của bạn
const { apiKey } = await loginViaYourBackend(username, password);

// 2. Dùng key với rn-odoo
const odoo = new Odoo({ host: '...', apiKey });
```

Đây là hướng bền vững nhất vì không phụ thuộc JSON-RPC API cũ và cho phép bạn kiểm soát 2FA, SSO, refresh, thu hồi key.

### 3. Module Odoo tùy chỉnh

Nếu bạn kiểm soát server Odoo, hãy viết một module nhỏ expose endpoint HTTP (ví dụ `/mobile/auth`) nhận username/password và trả về API key. App gọi endpoint một lần, sau đó dùng `rn-odoo` với key nhận được.

### 4. JSON-RPC cũ (chỉ dùng để migration tạm thời)

Nếu Odoo instance vẫn mở `/web/dataset/call_kw`, bạn có thể dùng `rn-odoo@1.x` hoặc helper legacy để đăng nhập và tạo API key. **Không khuyến khích cho dự án mới** vì Odoo có thể deprecate hoặc tắt JSON-RPC cũ bất cứ lúc nào.

---

[← Về README chính](../README_VN.md) · [Hướng dẫn sử dụng →](../usage/usage_VN.md)
