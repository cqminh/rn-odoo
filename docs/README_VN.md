<a id="readme-top"></a>

<div align="center">
  <h1 align="center">rn-odoo</h1>
  <p align="center">
    <strong>Kết nối React Native & React với Odoo một cách dễ dàng</strong>
  </p>
  <p align="center">
    <a href="/docs/README_VN.md">🇻🇳 Tiếng Việt</a> ·
    <a href="../README.md">🇬🇧 English</a>
  </p>
  <p align="center">
    <img alt="npm version" src="https://img.shields.io/npm/v/rn-odoo" />
    <img alt="GitHub Contributors" src="https://img.shields.io/github/contributors/cqminh/rn-odoo" />
    <img alt="Issues" src="https://img.shields.io/github/issues/cqminh/rn-odoo?color=0088ff" />
    <img alt="GitHub pull requests" src="https://img.shields.io/github/issues-pr/cqminh/rn-odoo" />
    <img alt="Stars" src="https://img.shields.io/github/stars/cqminh/rn-odoo" />
    <img alt="License" src="https://img.shields.io/npm/l/rn-odoo" />
  </p>
</div>

---

> ℹ️ **Đây là bản ổn định hiện tại (v2)**, hướng tới External JSON-2 API của Odoo. Vẫn đang dùng JSON-RPC API cũ? Cài nhánh v1.x bằng `npm install rn-odoo@v1` — xem [README](https://github.com/cqminh/rn-odoo/tree/v1#readme) của nhánh đó.

---

## 📋 Mục lục

- [Tính năng](#tính-năng)
- [Nền tảng hỗ trợ](#nền-tảng-hỗ-trợ)
- [Cài đặt](#cài-đặt)
- [Bắt đầu nhanh](#bắt-đầu-nhanh)
- [Tài liệu](#tài-liệu)
- [Ghi chú khác](#ghi-chú-khác)
- [Giấy phép](#giấy-phép)
- [Liên hệ](#liên-hệ)

---

## ✨ Tính năng

- 🔗 **Kết nối dễ dàng** với Odoo qua **JSON-2 API** mới (`/json/2`)
- 🔐 **Xác thực bằng API key** — Bearer token an toàn
- 📦 **CRUD đầy đủ** — Tạo, Đọc, Cập nhật, Xoá records
- 🔍 **Tìm kiếm mạnh mẽ** — `search`, `search_read`, `search_count`
- 🎯 **Gọi hàm tùy chỉnh** — gọi bất kỳ hàm nào trong model Odoo với tham số đặt tên
- 🗝️ **Quản lý API key** — tạo và thu hồi key qua API
- 🪝 **Interceptors** — chỉnh sửa request và response
- 📡 **Event emitter** — lắng nghe sự kiện `connect`, `disconnect`, `error`
- 🛡️ **TypeScript** — đầy đủ type để trải nghiệm lập trình tốt hơn
- ⚡ **Nhẹ** — không có dependency runtime

---

## 💻 Nền tảng hỗ trợ

| Nền tảng | Trạng thái |
|----------|-----------|
| React Native | ✅ Đã hỗ trợ |
| React (Web) | ✅ Đã hỗ trợ |

---

## 📦 Cài đặt

```bash
npm install rn-odoo
# hoặc
yarn add rn-odoo
```

> ⚠️ **Lưu ý quan trọng:**
> rn-odoo@2.x chỉ hỗ trợ **Odoo External JSON-2 API**. Nếu bạn cần API JSON-RPC cũ (`/web/dataset/call_kw`), hãy cài `rn-odoo@v1` thay vào đó.

---

## 🚀 Bắt đầu nhanh

```typescript
import Odoo from 'rn-odoo';

const odoo = new Odoo({
  host: 'https://your-odoo-server.com',
  apiKey: 'your_api_key',
});

const response = await odoo.search_read('res.partner', {
  domain: [['is_company', '=', true]],
  fields: ['name', 'email'],
});

if (response.success) {
  console.log(response.data);
}
```

Chưa có API key, hoặc app vẫn đang cho người dùng đăng nhập bằng username/password? Xem [Hướng dẫn xác thực](authentication/authentication_VN.md).

Xem ví dụ chạy được cho từng phương thức (CRUD, phân trang, batch, interceptors, events...) tại [Hướng dẫn sử dụng](usage/usage_VN.md).

---

## 📚 Tài liệu

- [Xác thực](authentication/authentication_VN.md) — lấy API key, các chiến lược xác thực, chuyển đổi khỏi username/password
- [Cách sử dụng](usage/usage_VN.md) — mọi phương thức kèm ví dụ chạy được
- [Tài liệu tham khảo API](api-reference/api-reference_VN.md) — tuỳ chọn cấu hình và signature các phương thức
- [Chuyển đổi từ v1](migration/migration_VN.md) — nâng cấp từ client JSON-RPC cũ
- [Chạy Odoo demo local bằng Docker](../docker/README.md) — dựng một instance Odoo 19 thật để test
- [Tài liệu Odoo External JSON-2 API](https://www.odoo.com/documentation/master/developer/reference/external_api.html)
- [Tài liệu Odoo ORM API](https://www.odoo.com/documentation/master/developer/reference/backend/orm.html)

---

## 📝 Ghi chú khác

- JSON-2 API yêu cầu Odoo 19+.
- API key được tạo trong Odoo qua **Preferences → Account Security → New API Key**.
- Với hệ thống multi-database, truyền `database` trong config hoặc đảm bảo Host header định tuyến đúng.

---

## 📄 Giấy phép

Dự án này được cấp phép theo [MIT License](../LICENSE).

---

## 📧 Liên hệ

Châu Quang Minh — [cqminh.it@gmail.com](mailto:cqminh.it@gmail.com)

Link dự án: [https://github.com/cqminh/rn-odoo](https://github.com/cqminh/rn-odoo)

<p align="right">(<a href="#readme-top">về đầu trang</a>)</p>

<div align="center">
  <sub>Được xây dựng với ❤️ cho cộng đồng Odoo & React Native</sub>
</div>
