# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.2] - 2026-07-13

### Fixed

- `connect`, `connectWithSid`, `disconnect`, and `getDatabases` now correctly wrap request bodies in a JSON-RPC 2.0 envelope (`{ jsonrpc, method: 'call', params }`) when calling `_rawRequest`; previously the raw params were sent unwrapped, causing the Odoo server to reject `/web/session/authenticate` with `authenticate() missing 3 required positional arguments: 'db', 'login', and 'password'`
- Restored `prepare: bob build` script so `lib/` is built automatically on `yarn install`/`npm install`, fixing local development against the `example` app via workspaces
- Corrected the root `example` script to reference the actual workspace name (`example` instead of `rn-odoo-example`)

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

[1.1.2]: https://github.com/cqminh/rn-odoo/compare/v1.1.1...v1.1.2
[1.1.1]: https://github.com/cqminh/rn-odoo/compare/v1.1.0...v1.1.1
[1.1.0]: https://github.com/cqminh/rn-odoo/compare/v1.0.1...v1.1.0
[1.0.1]: https://github.com/cqminh/rn-odoo/compare/v0.1.0...v1.0.1
[0.1.0]: https://github.com/cqminh/rn-odoo/releases/tag/v0.1.0
