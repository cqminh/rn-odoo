[← Back to README](../../README.md) · [🇻🇳 Tiếng Việt](api-reference_VN.md)

# 📖 API Reference

Config options and method signatures for the `Odoo` client. See [Usage](../usage/usage.md) for runnable examples of each method.

---

## `new Odoo(config)`

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `host` | `string` | ✅ | Base URL of the Odoo server |
| `apiKey` | `string` | ✅ | Bearer API key |
| `database` | `string` | — | Database name (sent as `X-Odoo-Database`) |
| `userAgent` | `string` | — | User-Agent header |
| `timeout` | `number` | — | Request timeout in ms (default: `30000`) |
| `retry` | `{ count, delay? }` | — | Retry configuration |

## Methods

| Method | Description |
|--------|-------------|
| `connect()` | Fetch current user context |
| `disconnect()` | Clear local context and emit disconnect event |
| `getVersion()` | Fetch Odoo server version |
| `getDatabases()` | Fetch list of available databases |
| `getContext()` / `setContext(context)` | Get / set the default context |
| `read(model, ids, fields?, context?)` | Read records by ID |
| `search(model, params, context?)` | Search for record IDs |
| `search_read(model, params, context?)` | Search and read records |
| `web_search_read(model, params, context?)` | Search and read records, plus total count |
| `search_read_paginated(model, params, context?)` | Auto-paginate through all matching records |
| `search_count(model, domain, limit?, context?)` | Count records matching a domain |
| `create(model, values, context?)` | Create a new record |
| `update(model, ids, values, context?)` | Update records |
| `delete(model, ids, context?)` | Delete records |
| `call_method(model, method, params, context?)` | Call a custom method on a model |
| `fields_get(model, params?, context?)` | Fetch field metadata |
| `read_group(model, params, context?)` | Group and aggregate records |
| `batch(calls)` | Send multiple JSON-2 calls concurrently and collect results in order |
| `generateApiKey(params)` | Generate a new API key |
| `revokeApiKey(key?)` | Revoke an API key |
| `addRequestInterceptor(fn)` / `addResponseInterceptor(fn)` | Register request/response interceptors |
| `on(event, callback)` / `off(event, callback)` | Subscribe/unsubscribe from `connect`, `disconnect`, `error` events |

---

[← Usage](../usage/usage.md) · [Migration from v1 →](../migration/migration.md)
