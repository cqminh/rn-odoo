[← Back to README](../../README.md) · [🇻🇳 Tiếng Việt](usage_VN.md)

# 🚀 Usage

A runnable example for every method on the `Odoo` client. See [Authentication](../authentication/authentication.md) for how to obtain the `apiKey`, and [API Reference](../api-reference/api-reference.md) for full signatures.

---

### Create an Odoo Instance

```typescript
import Odoo from 'rn-odoo';

const odoo = new Odoo({
  host: 'https://your-odoo-server.com',
  apiKey: 'your_api_key', // Required
  database: 'your_database', // Optional, sent as X-Odoo-Database
  userAgent: 'myapp/1.0', // Optional
  timeout: 30000, // Request timeout in ms. Default: 30000
  retry: { count: 2, delay: 1000 }, // Optional retry config
});
```

### Get Server Version

```typescript
const response = await odoo.getVersion();
if (response.success) {
  console.log('Version:', response.data);
}
```

### Get Database List

```typescript
const response = await odoo.getDatabases();
if (response.success) {
  console.log('Databases:', response.data);
}
```

### Get User Context

The JSON-2 API uses API keys, so `connect()` fetches the current user context instead of logging in.

```typescript
const response = await odoo.connect();
if (response.success) {
  console.log('Context:', response.data);
} else {
  console.error('Error:', response.error);
}
```

### Read Records

```typescript
const response = await odoo.read('res.partner', [1, 2, 3], ['name', 'email']);
if (response.success) {
  console.log('Partners:', response.data);
}
```

### Get Context

```typescript
const context = odoo.getContext();
// Returns a copy, e.g. { lang: 'en_US', tz: 'UTC' }
```

### Set Context

```typescript
odoo.setContext({ lang: 'vi_VN' });
```

### Search and Read

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

### Search Count

```typescript
const response = await odoo.search_count('product.product', [['list_price', '>', 50]]);
if (response.success) {
  console.log('Count:', response.data);
}
```

### Search, Read, and Count Together

`web_search_read` returns matching records and the total count in a single call — handy for paginated UIs that need both the current page and the total row count.

```typescript
const response = await odoo.web_search_read('res.partner', {
  domain: [['is_company', '=', true]],
  fields: ['id', 'name'],
  limit: 10,
  offset: 0,
});
if (response.success) {
  console.log('Records:', response.data?.records);
  console.log('Total:', response.data?.length);
}
```

> 💡 On Odoo 17+, use `specification` instead of `fields` to fetch nested relational fields, e.g. `{ name: {}, partner_id: { fields: { name: {} } } }`.

### Create Record

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
  console.log('Created ID:', response.data);
}
```

### Update Record

```typescript
const response = await odoo.update(
  'delivery.order.line',
  [1, 2, 3],
  {
    delivered: true,
    delivery_note: 'Delivered on time!',
  },
  context
);
if (response.success) {
  console.log('Updated');
}
```

### Delete Record

```typescript
const response = await odoo.delete('delivery.order.line', [1, 2, 3], context);
if (response.success) {
  console.log('Deleted');
}
```

### Call Custom Method

JSON-2 uses named parameters. Pass record IDs via `ids` and other params via `kwargs`.

```typescript
const response = await odoo.call_method('sale.order', 'action_confirm', {
  ids: [1],
  kwargs: { context: { active_id: 1 } },
});
if (response.success) {
  console.log('Method result:', response.data);
}
```

### Pagination Helper

Fetch all matching records automatically by paging through results:

```typescript
const response = await odoo.search_read_paginated(
  'res.partner',
  {
    domain: [['is_company', '=', true]],
    fields: ['id', 'name'],
    limit: 100, // page size
    maxRecords: 500, // optional total cap
  },
  context
);
if (response.success) {
  console.log('Total fetched:', response.data?.length);
}
```

### Batch Requests

Send multiple JSON-2 calls in a single round-trip:

```typescript
const response = await odoo.batch([
  { model: 'res.partner', method: 'search', params: { domain: [] } },
  { model: 'res.partner', method: 'read', params: { ids: [1], fields: ['name'] } },
]);
if (response.success) {
  const [ids, records] = response.data ?? [];
}
```

### Generate API Key

```typescript
const response = await odoo.generateApiKey({
  name: 'Mobile App Key',
  expiration_date: '2026-12-31',
});
if (response.success) {
  console.log('New key:', response.data);
}
```

### Revoke API Key

```typescript
const response = await odoo.revokeApiKey();
if (response.success) {
  console.log('Revoked');
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

// Remove interceptors later
unsubReq();
unsubRes();
```

### Events

```typescript
const unsubConnect = odoo.on('connect', (data) => {
  console.log('Connected:', data);
});

const unsubDisconnect = odoo.on('disconnect', () => {
  console.log('Disconnected');
});

const unsubError = odoo.on('error', (error) => {
  console.error('Error:', error);
});

// Unsubscribe when done
unsubConnect();
unsubDisconnect();
unsubError();
```

---

[← Authentication](../authentication/authentication.md) · [API Reference →](../api-reference/api-reference.md)
