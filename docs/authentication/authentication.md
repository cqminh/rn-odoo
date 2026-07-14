[← Back to README](../../README.md) · [🇻🇳 Tiếng Việt](authentication_VN.md)

# 🔐 Authentication

The Odoo External JSON-2 API authenticates with **API keys**, not session cookies. This page covers how to get a key and how to fit key-based auth into your app's login flow.

---

## Getting an Odoo API Key

1. Log in to your Odoo instance as the user you want to use.
2. Open your user menu (top-right avatar) and choose **Preferences**.
3. Go to the **Account Security** tab.
4. Click **New API Key**.
5. Enter a description (e.g. `rn-odoo test`) and pick an expiration date.
6. Click **Generate Key**, then **copy the key immediately**. Odoo shows it only once.

Use that key as the `apiKey` value when creating an `Odoo` instance.

> 💡 **Tip:** create a dedicated bot user with minimal permissions for production integrations.

---

## Authentication Strategies

Unlike the legacy JSON-RPC API, JSON-2 does not accept username/password login directly. Depending on your app architecture, choose one of the following strategies:

### 1. Direct API Key (simplest)

Create an API key manually in Odoo and paste it into your app. Best for internal tools, bots, or prototypes.

```typescript
const odoo = new Odoo({
  host: 'https://your-odoo-server.com',
  apiKey: 'your_api_key',
});
```

### 2. Backend Proxy (recommended for consumer apps)

Your mobile/web app sends username/password to your own backend. The backend authenticates with Odoo and returns an API key (or a short-lived token that your backend exchanges for an API key). The app then uses that API key with `rn-odoo`.

```typescript
// 1. Login via your backend
const { apiKey } = await loginViaYourBackend(username, password);

// 2. Use the key with rn-odoo
const odoo = new Odoo({ host: '...', apiKey });
```

This is the most future-proof approach because it does not depend on the legacy JSON-RPC API and lets you control 2FA, SSO, refresh, and revocation logic.

### 3. Custom Odoo Module

If you control the Odoo server, write a small Odoo module that exposes an HTTP endpoint (e.g. `/mobile/auth`) which accepts username/password and returns an API key. Your app calls that endpoint once, then uses `rn-odoo` with the returned key.

### 4. Legacy JSON-RPC (temporary migration only)

If your Odoo instance still exposes `/web/dataset/call_kw`, you can use `rn-odoo@1.x` or a separate legacy helper to log in and generate an API key. **This is not recommended for new projects** because Odoo may deprecate or disable the legacy JSON-RPC API at any time.

---

[← Back to README](../../README.md) · [Usage guide →](../usage/usage.md)
