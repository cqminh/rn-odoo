<a id="readme-top"></a>

<div align="center">
  <h1 align="center">rn-odoo</h1>
  <p align="center">
    <strong>Connect React Native & React apps to Odoo with ease</strong>
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

## 📋 Table of Contents

- [Features](#features)
- [Supported Platforms](#supported-platforms)
- [Installation](#installation)
- [Usage](#usage)
- [API Reference](#api-reference)
- [Documentation](#documentation)
- [Additional Notes](#additional-notes)
- [License](#license)
- [Contact](#contact)

---

## ✨ Features

- 🔗 **Easy connection** to Odoo via JSON-RPC
- 🔐 **Flexible authentication** — username/password or session ID (SID)
- 📦 **Full CRUD operations** — Create, Read, Update, Delete records
- 🔍 **Powerful search** — `search`, `search_read`, `search_count`
- 🎯 **Custom method calls** — call any Odoo model method
- 🪝 **Interceptors** — modify requests and responses
- 📡 **Event emitter** — listen to `connect`, `disconnect`, and `error` events
- 🛡️ **TypeScript** — fully typed for better DX
- ⚡ **Lightweight** — zero runtime dependencies

---

## 💻 Supported Platforms

| Platform | Status |
|----------|--------|
| React Native | ✅ Supported |
| React (Web) | ✅ Supported |

---

## 📦 Installation

```bash
npm install rn-odoo
# or
yarn add rn-odoo
```

---

## 🚀 Usage

> ⚠️ **Important:** This version of `rn-odoo` uses the legacy Odoo JSON-RPC API (`/web/dataset/call_kw`) with session-based authentication. Starting from **Odoo 19**, Odoo introduced the new **External JSON-2 API** (`/json/2`) which uses API key authentication. We are actively developing **v2.0.0** to support the new API. See the [Odoo External API Documentation](https://www.odoo.com/documentation/master/developer/reference/external_api.html) for more details.

> 💡 **Tip:** If you need help with data queries, refer to the [Odoo External API Documentation](https://www.odoo.com/documentation/master/developer/reference/external_api.html).

### Create an Odoo Instance

```typescript
import Odoo from 'rn-odoo';

const odoo = new Odoo({
  host: 'https://your-odoo-server.com',
  database: 'your_database',
  username: 'your_username',      // Optional if using SID
  password: 'your_password',      // Optional if using SID
  sid: 'your_session_id',         // Optional if using username/password
  clearPasswordAfterConnect: true, // Default: true. Set false to keep password for reconnect
  timeout: 30000,                 // Request timeout in ms. Default: 30000. Set 0 to disable
  retry: { count: 2, delay: 1000 }, // Optional retry config
});
```

### Get Databases

Returns an array of available databases on the server.

```typescript
const response = await odoo.getDatabases();
if (response.success) {
  console.log('Databases:', response.data);
} else {
  console.error('Error:', response.error);
}
```

### Connect

Authenticate with username and password. Returns user info and a session ID.

```typescript
const response = await odoo.connect();
if (response.success) {
  console.log('User:', response.data);
  console.log('Session ID:', response.sid);
} else {
  console.error('Login failed:', response.error);
}
```

### Connect Using Session ID

Reconnect using a previously stored session ID without re-entering credentials.

```typescript
const response = await odoo.connectWithSid();
if (response.success) {
  console.log('Reconnected:', response.data);
}
```

### Disconnect

Logout and clear the current session.

```typescript
const response = await odoo.disconnect();
if (response.success) {
  console.log('Logged out');
}
```

### Read Records

Read records by their IDs with optional field selection.

```typescript
const response = await odoo.read('res.partner', [1, 2, 3], ['name', 'email']);
if (response.success) {
  console.log('Partners:', response.data);
}
```

### Get Context

Retrieve the current user context (language, timezone, etc.).

```typescript
const context = odoo.getContext();
// Returns a copy, e.g. { lang: 'en_US', tz: 'UTC' }
```

### Search and Read

Query Odoo records with `search_read`.

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

Count records matching a domain.

```typescript
const response = await odoo.search_count('product.product', [['list_price', '>', 50]]);
if (response.success) {
  console.log('Count:', response.data);
}
```

### Create Record

Create one or multiple records in a model.

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

Update one or multiple records.

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

Delete one or multiple records.

```typescript
const response = await odoo.delete('delivery.order.line', [1, 2, 3], context);
if (response.success) {
  console.log('Deleted');
}
```

### Call Custom Method

Call any custom method from your Odoo model.

```typescript
const response = await odoo.call_method('sale.order', 'action_confirm', {
  args: [[1]], // Array of record IDs
  kwargs: { context: { active_id: 1 } }, // Optional keyword arguments
});
if (response.success) {
  console.log('Method result:', response.data);
}
```

### Interceptors

Modify outgoing requests or incoming responses.

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
    // Transform data before it reaches your app
    return { ...result, data: transformData(result.data) };
  }
});

// Remove interceptors later
unsubReq();
unsubRes();
```

### Events

Subscribe to lifecycle events.

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

## 📖 API Reference

| Method | Description |
|--------|-------------|
| `new Odoo(config)` | Create an Odoo instance |
| `getDatabases()` | Get list of available databases |
| `connect()` | Authenticate with username/password |
| `connectWithSid()` | Authenticate with stored session ID |
| `disconnect()` | Logout and clear session |
| `getContext()` | Get current user context |
| `read(model, ids, fields?, context?)` | Read records by IDs |
| `search(model, params, context?)` | Search for record IDs |
| `search_read(model, params, context?)` | Search and read records |
| `search_count(model, domain, context?)` | Count matching records |
| `create(model, values, context?)` | Create a new record |
| `update(model, ids, values, context?)` | Update existing records |
| `delete(model, ids, context?)` | Delete records |
| `call_method(model, method, params?)` | Call a custom model method |
| `addRequestInterceptor(fn)` | Add a request interceptor |
| `addResponseInterceptor(fn)` | Add a response interceptor |
| `on(event, callback)` | Subscribe to an event |
| `off(event, callback)` | Unsubscribe from an event |

### Configuration

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `host` | `string` | required | Odoo server URL |
| `database` | `string` | — | Database name |
| `username` | `string` | — | Username for authentication |
| `password` | `string` | — | Password for authentication |
| `sid` | `string` | — | Session ID for reconnection |
| `clearPasswordAfterConnect` | `boolean` | `true` | Clear password after successful connect |
| `timeout` | `number` | `30000` | Request timeout in ms. Set `0` to disable |
| `retry` | `{ count, delay? }` | — | Retry failed requests |


## 📚 Documentation

- [Odoo ORM API Reference](https://www.odoo.com/documentation/master/developer/reference/backend/orm.html)
- [Odoo Web Service External API](https://www.odoo.com/documentation/master/developer/reference/external_api.html)
- [react-native-odoo-promise-based](https://www.npmjs.com/package/react-native-odoo-promise-based) — Original library this is based on

---

## � Release

Releases are published to npm automatically via GitHub Actions when a tag matching `v*` is pushed.

To publish a new version:

1. Update `package.json` version and `CHANGELOG.md`.
2. Create and push a tag:
   ```bash
   git tag v1.1.1
   git push origin v1.1.1
   ```
3. The [Release workflow](.github/workflows/release.yml) will run tests, build, and publish to npm.

Make sure the `NPM_TOKEN` secret is configured in your repository settings.

---

## �📝 Additional Notes

This library is a modified and enhanced version of [react-native-odoo-promise-based](https://www.npmjs.com/package/react-native-odoo-promise-based). Some methods and structures were reused and improved with:

- Full TypeScript support
- Interceptor and event systems
- Better error handling
- Modern async/await patterns

Special thanks to the original author.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

## 📧 Contact

Châu Quang Minh — [cqminh.it@gmail.com](mailto:cqminh.it@gmail.com)

Project Link: [https://github.com/cqminh/rn-odoo](https://github.com/cqminh/rn-odoo)

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<div align="center">
  <sub>Built with ❤️ for the Odoo & React Native community</sub>
</div>
