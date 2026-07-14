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

> 🚀 **rn-odoo v2 đã có bản trải nghiệm alpha.** Phiên bản này dùng **External JSON-2 API** mới của Odoo với xác thực bằng API key, và có một số thay đổi phá vỡ tương thích (breaking changes) so với v1. Dùng thử bằng `npm install rn-odoo@next` — xem tài liệu tại [nhánh `next`](https://github.com/cqminh/rn-odoo/tree/next). Góp ý qua [GitHub issues](https://github.com/cqminh/rn-odoo/issues/new) hoặc [email](mailto:cqminh.it@gmail.com).

---

## 📋 Mục lục

- [Tính năng](#tính-năng)
- [Nền tảng hỗ trợ](#nền-tảng-hỗ-trợ)
- [Cài đặt](#cài-đặt)
- [Cách sử dụng](#cách-sử-dụng)
- [Tài liệu tham khảo API](#tài-liệu-tham-khảo-api)
- [Tài liệu](#tài-liệu)
- [Ghi chú khác](#ghi-chú-khác)
- [Giấy phép](#giấy-phép)
- [Liên hệ](#liên-hệ)

---

## ✨ Tính năng

- 🔗 **Kết nối dễ dàng** với Odoo qua JSON-RPC
- 🔐 **Xác thực linh hoạt** — username/password hoặc session ID (SID)
- 📦 **CRUD đầy đủ** — Tạo, Đọc, Cập nhật, Xoá records
- 🔍 **Tìm kiếm mạnh mẽ** — `search`, `search_read`, `search_count`
- 🎯 **Gọi hàm tùy chỉnh** — gọi bất kỳ hàm nào trong model Odoo
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

---

## 🚀 Cách sử dụng

> ⚠️ **Lưu ý quan trọng:** Phiên bản này của `rn-odoo` đang sử dụng JSON-RPC API cũ (`/web/dataset/call_kw`) với xác thực dựa trên session. Từ **Odoo 19**, Odoo đã giới thiệu **External JSON-2 API** mới (`/json/2`) với xác thực bằng API key. **v2 đã có bản alpha** (`npm install rn-odoo@next`) để hỗ trợ API mới — xem [nhánh `next`](https://github.com/cqminh/rn-odoo/tree/next). Xem thêm tại [Tài liệu API bên ngoài của Odoo](https://www.odoo.com/documentation/master/developer/reference/external_api.html).

> 💡 **Gợi ý:** Nếu bạn cần hỗ trợ về cấu trúc truy vấn dữ liệu, hãy tham khảo [Tài liệu API bên ngoài của Odoo](https://www.odoo.com/documentation/master/developer/reference/external_api.html).

### Tạo instance Odoo

```typescript
import Odoo from 'rn-odoo';

const odoo = new Odoo({
  host: 'https://your-odoo-server.com',
  database: 'your_database',
  username: 'your_username',      // Tùy chọn nếu dùng SID
  password: 'your_password',      // Tùy chọn nếu dùng SID
  sid: 'your_session_id',         // Tùy chọn nếu dùng username/password
  clearPasswordAfterConnect: true, // Mặc định: true. Đặt false để giữ password cho lần kết nối sau
  timeout: 30000,                 // Thời gian chờ request tính bằng ms. Mặc định: 30000. Đặt 0 để tắt
  retry: { count: 2, delay: 1000 }, // Cấu hình retry tùy chọn
});
```

### Lấy danh sách database

Trả về mảng các database có sẵn trên server.

```typescript
const response = await odoo.getDatabases();
if (response.success) {
  console.log('Databases:', response.data);
} else {
  console.error('Lỗi:', response.error);
}
```

### Kết nối

Xác thực bằng username và password. Trả về thông tin người dùng và session ID.

```typescript
const response = await odoo.connect();
if (response.success) {
  console.log('User:', response.data);
  console.log('Session ID:', response.sid);
} else {
  console.error('Đăng nhập thất bại:', response.error);
}
```

### Kết nối bằng Session ID

Kết nối lại bằng session ID đã lưu trước đó mà không cần nhập lại thông tin đăng nhập.

```typescript
const response = await odoo.connectWithSid();
if (response.success) {
  console.log('Đã kết nối lại:', response.data);
}
```

### Huỷ kết nối

Đăng xuất và xoá session hiện tại.

```typescript
const response = await odoo.disconnect();
if (response.success) {
  console.log('Đã đăng xuất');
}
```

### Đọc Records

Đọc records theo ID với tùy chọn chọn trường.

```typescript
const response = await odoo.read('res.partner', [1, 2, 3], ['name', 'email']);
if (response.success) {
  console.log('Partners:', response.data);
}
```

### Lấy Context

Lấy context hiện tại của người dùng (ngôn ngữ, múi giờ, v.v.).

```typescript
const context = odoo.getContext();
// Trả về bản sao, ví dụ: { lang: 'vi_VN', tz: 'Asia/Ho_Chi_Minh' }
```

### Search và Read

Truy vấn dữ liệu Odoo bằng `search_read`.

```typescript
const params = {
  domain: [
    ['list_price', '>', 50],
    ['list_price', '<', 65],
  ],
  fields: ['name', 'list_price', 'items'],
  order: 'list_price DESC',
  limit: 5,
  offset: 0,
};

const response = await odoo.search_read('product.product', params, context);
if (response.success) {
  console.log('Products:', response.data);
}
```

### Đếm Records

Đếm số records khớp với domain.

```typescript
const response = await odoo.search_count('product.product', [['list_price', '>', 50]]);
if (response.success) {
  console.log('Số lượng:', response.data);
}
```

### Tạo Record

Tạo một hoặc nhiều record mới trong model.

```typescript
const response = await odoo.create(
  'delivery.order.line',
  {
    sale_order_id: 123,
    delivered: false,
  },
  context
);
if (response.success) {
  console.log('ID đã tạo:', response.data);
}
```

### Cập nhật Record

Cập nhật một hoặc nhiều record.

```typescript
const response = await odoo.update(
  'delivery.order.line',
  [1, 2, 3],
  {
    delivered: true,
    delivery_note: 'Giao hàng đúng hạn!',
  },
  context
);
if (response.success) {
  console.log('Đã cập nhật');
}
```

### Xoá Record

Xoá một hoặc nhiều record.

```typescript
const response = await odoo.delete('delivery.order.line', [1, 2, 3], context);
if (response.success) {
  console.log('Đã xoá');
}
```

### Gọi hàm tùy chỉnh

Gọi bất kỳ hàm nào trong model Odoo của bạn.

```typescript
const response = await odoo.call_method('sale.order', 'action_confirm', {
  args: [[1]], // Mảng các ID record
  kwargs: { context: { active_id: 1 } }, // Các tham số keyword tùy chọn
});
if (response.success) {
  console.log('Kết quả hàm:', response.data);
}
```

### Interceptors

Chỉnh sửa request gửi đi hoặc response nhận về.

```typescript
// Request interceptor
const unsubReq = odoo.addRequestInterceptor((url, init) => {
  const headers = new Headers(init.headers);
  headers.set('X-Custom-Header', 'my-value');
  return { url, init: { ...init, headers } };
});

// Response interceptor
const unsubRes = odoo.addResponseInterceptor((result) => {
  if (result.success) {
    // Biến đổi dữ liệu trước khi trả về ứng dụng
    return { ...result, data: transformData(result.data) };
  }
});

// Xoá interceptor sau này
unsubReq();
unsubRes();
```

### Events

Đăng ký lắng nghe các sự kiện vòng đời.

```typescript
const unsubConnect = odoo.on('connect', (data) => {
  console.log('Đã kết nối:', data);
});

const unsubDisconnect = odoo.on('disconnect', () => {
  console.log('Đã ngắt kết nối');
});

const unsubError = odoo.on('error', (error) => {
  console.error('Lỗi:', error);
});

// Huỷ đăng ký khi không cần nữa
unsubConnect();
unsubDisconnect();
unsubError();
```

---

## 📖 Tài liệu tham khảo API

| Phương thức | Mô tả |
|-------------|-------|
| `new Odoo(config)` | Tạo instance Odoo |
| `getDatabases()` | Lấy danh sách database có sẵn |
| `connect()` | Xác thực bằng username/password |
| `connectWithSid()` | Xác thực bằng session ID đã lưu |
| `disconnect()` | Đăng xuất và xoá session |
| `getContext()` | Lấy context người dùng hiện tại |
| `read(model, ids, fields?, context?)` | Đọc records theo ID |
| `search(model, params, context?)` | Tìm kiếm ID records |
| `search_read(model, params, context?)` | Tìm kiếm và đọc records |
| `search_count(model, domain, context?)` | Đếm records khớp domain |
| `create(model, values, context?)` | Tạo record mới |
| `update(model, ids, values, context?)` | Cập nhật records |
| `delete(model, ids, context?)` | Xoá records |
| `call_method(model, method, params?)` | Gọi hàm tùy chỉnh trong model |
| `addRequestInterceptor(fn)` | Thêm request interceptor |
| `addResponseInterceptor(fn)` | Thêm response interceptor |
| `on(event, callback)` | Đăng ký lắng nghe sự kiện |
| `off(event, callback)` | Huỷ đăng ký sự kiện |

### Cấu hình

| Tuỳ chọn | Kiểu | Mặc định | Mô tả |
|----------|------|----------|-------|
| `host` | `string` | bắt buộc | URL server Odoo |
| `database` | `string` | — | Tên database |
| `username` | `string` | — | Username để xác thực |
| `password` | `string` | — | Password để xác thực |
| `sid` | `string` | — | Session ID để kết nối lại |
| `clearPasswordAfterConnect` | `boolean` | `true` | Xoá password sau khi kết nối thành công |
| `timeout` | `number` | `30000` | Thời gian chờ request tính bằng ms. Đặt `0` để tắt |
| `retry` | `{ count, delay? }` | — | Thử lại các request thất bại |


---

## 📚 Tài liệu

- [Odoo ORM API Reference](https://www.odoo.com/documentation/master/developer/reference/backend/orm.html)
- [Odoo Web Service External API](https://www.odoo.com/documentation/master/developer/reference/external_api.html)
- [react-native-odoo-promise-based](https://www.npmjs.com/package/react-native-odoo-promise-based) — Thư viện gốc mà dự án này dựa trên

---

## 📝 Ghi chú khác

Thư viện này là phiên bản chỉnh sửa và nâng cấp của [react-native-odoo-promise-based](https://www.npmjs.com/package/react-native-odoo-promise-based). Một số phương thức và cấu trúc đã được tái sử dụng và cải tiến với:

- Hỗ trợ TypeScript đầy đủ
- Hệ thống interceptor và event
- Xử lý lỗi tốt hơn
- Pattern async/await hiện đại

Xin cảm ơn tác giả của thư viện gốc.

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
