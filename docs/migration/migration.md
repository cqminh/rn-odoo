[← Back to README](../../README.md) · [🇻🇳 Tiếng Việt](migration_VN.md)

# 🔄 Migration from v1

rn-odoo@2.x is a **breaking change**. Update your code as follows:

| v1 | v2 |
| --- | --- |
| `new Odoo({ host, database, username, password, sid })` | `new Odoo({ host, apiKey, database })` |
| `await odoo.connect()` login | `await odoo.connect()` fetches user context |
| `await odoo.connectWithSid()` | Removed — API keys are stateless |
| `await odoo.getDatabases()` | `await odoo.getDatabases()` — now uses `/web/database/list` |
| `await odoo.read(model, ids, fields)` | Same signature |
| `await odoo.search(model, { domain })` | Same signature |
| `await odoo.call_method(model, method, { args, kwargs })` | `await odoo.call_method(model, method, { ids, kwargs })` |
| Session cookie auth | Bearer `Authorization` header |
| `/web/dataset/call_kw` | `/json/2/<model>/<method>` |

For the legacy JSON-RPC API, or if your app still collects username/password directly, use rn-odoo@1.x.

---

[← API Reference](../api-reference/api-reference.md) · [Back to README →](../../README.md)
