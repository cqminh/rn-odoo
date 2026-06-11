# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

[Unreleased]: https://github.com/cqminh/rn-odoo/compare/v1.1.0...HEAD
[1.1.0]: https://github.com/cqminh/rn-odoo/compare/v1.0.1...v1.1.0
[1.0.1]: https://github.com/cqminh/rn-odoo/compare/v0.1.0...v1.0.1
[0.1.0]: https://github.com/cqminh/rn-odoo/releases/tag/v0.1.0
