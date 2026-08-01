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

> ℹ️ **This is the current stable release (v2)**, targeting Odoo's External JSON-2 API. Still on the legacy JSON-RPC API? Install the v1.x line with `npm install rn-odoo@v1-legacy` — see its [README](https://github.com/cqminh/rn-odoo/tree/v1#readme).

---

## 📋 Table of Contents

- [Features](#features)
- [Supported Platforms](#supported-platforms)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Documentation](#documentation)
- [Additional Notes](#additional-notes)
- [License](#license)
- [Contact](#contact)

---

## ✨ Features

- 🔗 **Easy connection** to Odoo via the new **JSON-2 API** (`/json/2`)
- 🔐 **API key authentication** — secure Bearer token auth
- 📦 **Full CRUD operations** — Create, Read, Update, Delete records
- 🔍 **Powerful search** — `search`, `search_read`, `search_count`
- 🎯 **Custom method calls** — call any Odoo model method with named params
- 🗝️ **API key management** — generate and revoke keys programmatically
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

> ⚠️ **Breaking change:**
> rn-odoo@2.x only supports the **Odoo External JSON-2 API**. If you need the legacy JSON-RPC API (`/web/dataset/call_kw`), install `rn-odoo@v1-legacy` instead.

---

## 🚀 Quick Start

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

Don't have an API key yet, or still logging users in with username/password? See the [Authentication guide](docs/authentication/authentication.md).

For a runnable example of every method (CRUD, pagination, batch, interceptors, events...), see the [Usage guide](docs/usage/usage.md).

---

## 📚 Documentation

- [Authentication](docs/authentication/authentication.md) — getting an API key, auth strategies, migrating off username/password
- [Usage](docs/usage/usage.md) — every method with a runnable example
- [API Reference](docs/api-reference/api-reference.md) — config options and method signatures
- [Migration from v1](docs/migration/migration.md) — upgrading from the legacy JSON-RPC client
- [Local Odoo Demo with Docker](docker/README.md) — spin up a real Odoo 19 instance to test against
- [Odoo External JSON-2 API Documentation](https://www.odoo.com/documentation/master/developer/reference/external_api.html)
- [Odoo ORM API Reference](https://www.odoo.com/documentation/master/developer/reference/backend/orm.html)

---

## 📝 Additional Notes

- The JSON-2 API requires Odoo 19+.
- API keys are created in Odoo via **Preferences → Account Security → New API Key**.
- For multi-database deployments, pass `database` in the config or ensure the Host header routes correctly.

---

## 📄 License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

---

## 📧 Contact

Châu Quang Minh - [cqminh.it@gmail.com](mailto:cqminh.it@gmail.com)

Project Link: [https://github.com/cqminh/rn-odoo](https://github.com/cqminh/rn-odoo)

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<div align="center">
  <sub>Built with ❤️ for the Odoo & React Native community</sub>
</div>
