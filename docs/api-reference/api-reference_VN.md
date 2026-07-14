[← Về README chính](../README_VN.md) · [🇬🇧 English](api-reference.md)

# 📖 Tài liệu tham khảo API

Các tuỳ chọn cấu hình và signature của từng phương thức trong client `Odoo`. Xem [Cách sử dụng](../usage/usage_VN.md) để có ví dụ chạy được cho từng phương thức.

---

## `new Odoo(config)`

| Tuỳ chọn | Kiểu | Mặc định | Mô tả |
|----------|------|----------|-------|
| `host` | `string` | bắt buộc | URL server Odoo |
| `apiKey` | `string` | bắt buộc | API key dùng cho Bearer auth |
| `database` | `string` | — | Tên database, gửi qua header `X-Odoo-Database` |
| `userAgent` | `string` | — | User-Agent header |
| `timeout` | `number` | `30000` | Thời gian chờ request tính bằng ms. Đặt `0` để tắt |
| `retry` | `{ count, delay? }` | — | Thử lại các request thất bại |

## Phương thức

| Phương thức | Mô tả |
|-------------|-------|
| `connect()` | Lấy context người dùng hiện tại |
| `disconnect()` | Xoá context cục bộ và phát sự kiện disconnect |
| `getVersion()` | Lấy thông tin phiên bản Odoo server |
| `getDatabases()` | Lấy danh sách database có sẵn |
| `getContext()` / `setContext(context)` | Lấy / đặt context mặc định |
| `read(model, ids, fields?, context?)` | Đọc records theo ID |
| `search(model, params, context?)` | Tìm kiếm ID records |
| `search_read(model, params, context?)` | Tìm kiếm và đọc records |
| `web_search_read(model, params, context?)` | Tìm kiếm, đọc records, kèm tổng số lượng |
| `search_read_paginated(model, params, context?)` | Tự động phân trang và lấy toàn bộ records |
| `search_count(model, domain, limit?, context?)` | Đếm records khớp domain |
| `create(model, values, context?)` | Tạo record mới |
| `update(model, ids, values, context?)` | Cập nhật records |
| `delete(model, ids, context?)` | Xoá records |
| `call_method(model, method, params, context?)` | Gọi hàm tùy chỉnh trong model |
| `fields_get(model, params?, context?)` | Lấy metadata các trường |
| `read_group(model, params, context?)` | Nhóm và tổng hợp dữ liệu |
| `batch(calls)` | Gửi nhiều lệnh JSON-2 đồng thời và gom kết quả theo thứ tự |
| `generateApiKey(params)` | Tạo API key mới |
| `revokeApiKey(key?)` | Thu hồi API key |
| `addRequestInterceptor(fn)` / `addResponseInterceptor(fn)` | Đăng ký interceptor cho request/response |
| `on(event, callback)` / `off(event, callback)` | Đăng ký/huỷ đăng ký sự kiện `connect`, `disconnect`, `error` |

---

[← Cách sử dụng](../usage/usage_VN.md) · [Chuyển đổi từ v1 →](../migration/migration_VN.md)
