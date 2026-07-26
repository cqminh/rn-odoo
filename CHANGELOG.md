# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2026-08-01

### Added

- Support for Odoo External JSON-2 API (`/json/2/<model>/<method>`)
- API key authentication via Bearer `Authorization` header
- `getVersion()` method for `/web/version`
- `getDatabases()` method for `/web/database/list`
- `generateApiKey()` and `revokeApiKey()` for programmatic key management
- `fields_get()` and `read_group()` helpers
- Request/response interceptors (`addRequestInterceptor`, `addResponseInterceptor`)
- Event emitter (`on`, `off`) with `connect`, `disconnect`, and `error` events
- Configurable `timeout` and `retry` options
- `search_read_paginated()` helper for automatic pagination.
- `batch()` helper for sending multiple JSON-2 calls concurrently and collecting the results in order.
- Named export `Odoo` in addition to the default export.

### Changed

- **Breaking:** removed username/password and session ID (SID) authentication
- **Breaking:** `connect()` now fetches user context instead of logging in
- **Breaking:** `connectWithSid()` removed
- **Breaking:** `call_method()` now uses `{ ids, kwargs }` instead of `{ args, kwargs }`
- **Breaking:** all requests target `/json/2` instead of `/web/dataset/call_kw`
- README and Vietnamese documentation rewritten for v2
- Retry logic now only retries network errors and 5xx server errors; 4xx client errors and aborted requests are not retried.
- `FetchInit` type now uses `Record<string, string> | Headers` for headers instead of `unknown`.

### Removed

- Legacy JSON-RPC (`/web/dataset/call_kw`) support; use rn-odoo@1.x if needed

### Fixed

- Timeout timers are now cleared in a `finally` block, preventing Jest open-handle warnings.
- Odoo error objects returned in HTTP 200 response bodies are now detected and returned as `success: false`.
- All ESLint warnings in the example app have been resolved.
- Restored `prepare: bob build` script so `lib/` is built automatically on `yarn install`/`npm install`, fixing local development against the `example` app via workspaces
- Corrected the root `example` script to reference the actual workspace name (`example` instead of `rn-odoo-example`)
- `web_search_read()` now derives a `specification` from `fields` when the caller only passes a flat field list; Odoo's `web_search_read` always requires `specification` and was rejecting the request with `missing a required argument: 'specification'`
- `fields_get()` now sends the `allfields` keyword instead of `fields`, matching Odoo's actual ORM method signature; the old key caused `got an unexpected keyword argument 'fields'`
- Added a local `Headers` type shim so the library type-checks in projects that don't include the DOM lib
- `batch()` no longer posts to a `/json/2/batch` endpoint, which does not exist on real Odoo servers (`404 Not Found`); it now fans out each call as its own `/json/2/<model>/<method>` request via `Promise.all` and collects the results in order
- `generateApiKey()` now sends `key: this.apiKey` alongside `scope`/`name`/`expiration_date`; Odoo's `res.users.apikeys.generate` requires the caller's current API key as an identity check before minting a new one, and was rejecting the request with `missing a required argument: 'key'`

## [1.1.4] - 2026-07-25

No functional or API changes — this release exists as a version marker ahead of the `latest` npm tag switching to v2 (2.0.0) on 2026-08-01.

### Security

- Pinned `brace-expansion`, `js-yaml`, `postcss`, and `@conventional-changelog/git-client` to patched versions via `resolutions`, closing several Dependabot-flagged vulnerabilities (including a brace-expansion DoS via unbounded expansion length)

### Changed

- README and Vietnamese docs updated to announce the `latest` npm tag switching to v2 (2.0.0) on 2026-08-01, with instructions to pin `npm install rn-odoo@v1` for continued v1.x updates

## [1.1.3] - 2026-07-14

### Changed

- README (EN & VN) now points to the `rn-odoo@next` alpha line for the new Odoo JSON-2 API client, with links to the npm listing and the `next` branch
- Reworked the example app to exercise the full v1 session flow (Connect, Connect with SID, Get Context, Disconnect, search, read, search_count, fields_get, read_group, call_method) using env-based config, matching the pattern already used on the v2 line

### Fixed

- `example/.env` is now gitignored, closing a gap where the local example env file (which can hold real credentials) wasn't excluded

## [1.1.2] - 2026-07-13

### Fixed

- `connect`, `connectWithSid`, `disconnect`, and `getDatabases` now correctly wrap request bodies in a JSON-RPC 2.0 envelope (`{ jsonrpc, method: 'call', params }`) when calling `_rawRequest`; previously the raw params were sent unwrapped, causing the Odoo server to reject `/web/session/authenticate` with `authenticate() missing 3 required positional arguments: 'db', 'login', and 'password'`

## [1.1.1] - 2026-06-16

### Added

- Configurable request `timeout` in `OdooConfig` (default: 30000ms, set `0` to disable)
- Basic `retry` configuration for failed requests (`retry.count` and `retry.delay`)
- `kwargs` support in `call_method` for clearer keyword argument passing
- Request signals from interceptors are now preserved and combined with the internal timeout abort controller

### Changed

- All outgoing requests (`getDatabases`, `connect`, `connectWithSid`, `disconnect`, and dataset calls) now go through the unified `_fetch` wrapper, ensuring interceptors, timeout, retry, and consistent error handling apply everywhere
- `call_method` legacy parameters (`domain`, `offset`, `limit`, `order`, `fields`) are deprecated in favor of `kwargs`; they remain functional for backward compatibility

### Fixed

- `connect` and `connectWithSid` now correctly extract session IDs from response headers when using the unified fetch wrapper

## [1.1.0] - 2026-06-10

### Added

- Request/response interceptors (`addRequestInterceptor`, `addResponseInterceptor`)
- Event emitter (`on`, `off`) with events: `connect`, `disconnect`, `error`
- `read()` method to read records by IDs
- `getContext()` method to retrieve current user context
- `clearPasswordAfterConnect` option in `OdooConfig` for security

### Changed

- Build script changed from `prepare` to `prepublishOnly`
- `_request` visibility changed from `private` to `protected` for extensibility

### Fixed

- Build output (`lib/`) now includes all new features and is in sync with source
- `tsconfig.build.json` now excludes test files

## [1.0.1] - 2025-07-20

### Fixed

- Corrected package version

## [0.1.0] - 2025-07-09

### Added

- Initial release with basic Odoo JSON-RPC connection support

[2.0.0]: https://github.com/cqminh/rn-odoo/compare/v1.1.4...v2.0.0
[1.1.4]: https://github.com/cqminh/rn-odoo/compare/v1.1.3...v1.1.4
[1.1.3]: https://github.com/cqminh/rn-odoo/compare/v1.1.2...v1.1.3
[1.1.2]: https://github.com/cqminh/rn-odoo/compare/v1.1.1...v1.1.2
[1.1.1]: https://github.com/cqminh/rn-odoo/compare/v1.1.0...v1.1.1
[1.1.0]: https://github.com/cqminh/rn-odoo/compare/v1.0.1...v1.1.0
[1.0.1]: https://github.com/cqminh/rn-odoo/compare/v0.1.0...v1.0.1
[0.1.0]: https://github.com/cqminh/rn-odoo/releases/tag/v0.1.0
