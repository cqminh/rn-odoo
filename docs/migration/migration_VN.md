[← Về README chính](../README_VN.md) · [🇬🇧 English](migration.md)

# 🔄 Chuyển đổi từ v1

rn-odoo@2.x là **breaking change**. Cập nhật code như sau:

| v1 | v2 |
| --- | --- |
| `new Odoo({ host, database, username, password, sid })` | `new Odoo({ host, apiKey, database })` |
| `await odoo.connect()` đăng nhập | `await odoo.connect()` lấy context người dùng |
| `await odoo.connectWithSid()` | Đã xoá — API key là stateless |
| `await odoo.getDatabases()` | `await odoo.getDatabases()` — giờ dùng `/web/database/list` |
| `await odoo.read(model, ids, fields)` | Giữ nguyên signature |
| `await odoo.search(model, { domain })` | Giữ nguyên signature |
| `await odoo.call_method(model, method, { args, kwargs })` | `await odoo.call_method(model, method, { ids, kwargs })` |
| Xác thực bằng session cookie | Bearer `Authorization` header |
| `/web/dataset/call_kw` | `/json/2/<model>/<method>` |

Nếu cần API JSON-RPC cũ, hoặc app của bạn vẫn thu thập username/password trực tiếp, hãy dùng rn-odoo@1.x.

---

[← Tài liệu tham khảo API](../api-reference/api-reference_VN.md) · [Về README chính →](../../README.md)
