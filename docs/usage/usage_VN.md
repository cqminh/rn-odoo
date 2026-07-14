[← Về README chính](../README_VN.md) · [🇬🇧 English](usage.md)

# 🚀 Cách sử dụng

Ví dụ chạy được cho từng phương thức của client `Odoo`. Xem [Xác thực](../authentication/authentication_VN.md) để biết cách lấy `apiKey`, và [Tài liệu tham khảo API](../api-reference/api-reference_VN.md) để xem đầy đủ signature.

---

### Tạo instance Odoo

```typescript
import Odoo from 'rn-odoo';

const odoo = new Odoo({
  host: 'https://your-odoo-server.com',
  apiKey: 'your_api_key', // Bắt buộc
  database: 'your_database', // Tùy chọn, gửi qua header X-Odoo-Database
  userAgent: 'myapp/1.0', // Tùy chọn
  timeout: 30000, // Thời gian chờ request tính bằng ms. Mặc định: 30000
  retry: { count: 2, delay: 1000 }, // Cấu hình retry tùy chọn
});
```

### Lấy phiên bản Odoo

```typescript
const response = await odoo.getVersion();
if (response.success) {
  console.log('Phiên bản:', response.data);
}
```

### Lấy danh sách database

```typescript
const response = await odoo.getDatabases();
if (response.success) {
  console.log('Databases:', response.data);
}
```

### Kết nối

JSON-2 API dùng API key, nên `connect()` sẽ lấy context của người dùng hiện tại thay vì đăng nhập.

```typescript
const response = await odoo.connect();
if (response.success) {
  console.log('Context:', response.data);
} else {
  console.error('Lỗi:', response.error);
}
```

### Đọc Records

```typescript
const response = await odoo.read('res.partner', [1, 2, 3], ['name', 'email']);
if (response.success) {
  console.log('Partners:', response.data);
}
```

### Lấy Context

```typescript
const context = odoo.getContext();
// Trả về bản sao, ví dụ: { lang: 'vi_VN', tz: 'Asia/Ho_Chi_Minh' }
```

### Đặt Context

```typescript
odoo.setContext({ lang: 'vi_VN' });
```

### Search và Read

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

```typescript
const response = await odoo.search_count('product.product', [['list_price', '>', 50]]);
if (response.success) {
  console.log('Số lượng:', response.data);
}
```

### Search, Read và Đếm cùng lúc

`web_search_read` trả về cả records khớp domain và tổng số lượng trong một lần gọi — hữu ích cho UI phân trang cần cả dữ liệu trang hiện tại lẫn tổng số dòng.

```typescript
const response = await odoo.web_search_read('res.partner', {
  domain: [['is_company', '=', true]],
  fields: ['id', 'name'],
  limit: 10,
  offset: 0,
});
if (response.success) {
  console.log('Records:', response.data?.records);
  console.log('Tổng số:', response.data?.length);
}
```

> 💡 Trên Odoo 17+, dùng `specification` thay cho `fields` để lấy các trường quan hệ lồng nhau, ví dụ `{ name: {}, partner_id: { fields: { name: {} } } }`.

### Tạo Record

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

```typescript
const response = await odoo.delete('delivery.order.line', [1, 2, 3], context);
if (response.success) {
  console.log('Đã xoá');
}
```

### Gọi hàm tùy chỉnh

JSON-2 dùng tham số đặt tên. Truyền ID record qua `ids` và các tham số khác qua `kwargs`.

```typescript
const response = await odoo.call_method('sale.order', 'action_confirm', {
  ids: [1],
  kwargs: { context: { active_id: 1 } },
});
if (response.success) {
  console.log('Kết quả hàm:', response.data);
}
```

### Helper phân trang

Tự động lấy toàn bộ record theo từng trang:

```typescript
const response = await odoo.search_read_paginated(
  'res.partner',
  {
    domain: [['is_company', '=', true]],
    fields: ['id', 'name'],
    limit: 100, // kích thước trang
    maxRecords: 500, // giới hạn tổng số record (tùy chọn)
  },
  context
);
if (response.success) {
  console.log('Tổng số record:', response.data?.length);
}
```

### Batch Requests

Gửi nhiều lệnh JSON-2 trong một lần gọi duy nhất:

```typescript
const response = await odoo.batch([
  { model: 'res.partner', method: 'search', params: { domain: [] } },
  { model: 'res.partner', method: 'read', params: { ids: [1], fields: ['name'] } },
]);
if (response.success) {
  const [ids, records] = response.data ?? [];
}
```

### Tạo API Key

```typescript
const response = await odoo.generateApiKey({
  name: 'Mobile App Key',
  expiration_date: '2026-12-31',
});
if (response.success) {
  console.log('Key mới:', response.data);
}
```

### Thu hồi API Key

```typescript
const response = await odoo.revokeApiKey();
if (response.success) {
  console.log('Đã thu hồi');
}
```

### Interceptors

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
    return { ...result, data: transformData(result.data) };
  }
});

// Xoá interceptor sau này
unsubReq();
unsubRes();
```

### Events

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

[← Xác thực](../authentication/authentication_VN.md) · [Tài liệu tham khảo API →](../api-reference/api-reference_VN.md)
