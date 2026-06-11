# Contributing to rn-odoo

Contributions are always welcome, no matter how large or small!

We want this community to be friendly and respectful. Please follow the [Code of Conduct](./CODE_OF_CONDUCT.md) in all your interactions with the project.

## Development Setup

This project uses [Yarn](https://yarnpkg.com/) as its package manager. It contains:

- The library package in the root directory.
- An example app in the `example/` directory.

To get started, run `yarn` in the root directory to install dependencies:

```sh
yarn
```

> ⚠️ Since the project relies on Yarn workspaces, you cannot use `npm` for development.

The [example app](/example/) demonstrates usage of the library. It is configured to use the local version of the library, so any changes you make to the library's source code will be reflected in the example app. Changes to the library's JavaScript/TypeScript code will be reflected without a rebuild, but native code changes will require a rebuild of the example app.

### Common Commands

| Command | Description |
|---------|-------------|
| `yarn` | Install dependencies |
| `yarn typecheck` | Type-check files with TypeScript |
| `yarn lint` | Lint files with ESLint |
| `yarn lint --fix` | Fix auto-fixable linting issues |
| `yarn test` | Run unit tests with Jest |
| `yarn clean` | Remove build output (`lib/`) |
| `yarn prepublishOnly` | Build the library for publishing |
| `yarn example start` | Start the Metro server for the example app |
| `yarn example android` | Run the example app on Android |
| `yarn example ios` | Run the example app on iOS |
| `yarn example web` | Run the example app on Web |
| `yarn release` | Publish a new version using `release-it` |

To confirm that the app is running with the new architecture, check the Metro logs for a message like this:

```sh
Running "RnOdooExample" with {"fabric":true,"initialProps":{"concurrentRoot":true},"rootTag":1}
```

Note the `"fabric":true` and `"concurrentRoot":true` properties.

### Commit Message Convention

We follow the [Conventional Commits](https://www.conventionalcommits.org/en) specification. Our pre-commit hooks (via [Lefthook](https://github.com/evilmartians/lefthook)) verify that your commit message matches this format.

| Type | Description |
|------|-------------|
| `fix` | Bug fixes, e.g. fix crash due to deprecated method |
| `feat` | New features, e.g. add new method to the module |
| `refactor` | Code refactoring, e.g. migrate from class components to hooks |
| `docs` | Documentation changes, e.g. add usage example |
| `test` | Adding or updating tests, e.g. add integration tests |
| `chore` | Tooling changes, e.g. update CI config |

### Linting and Testing

We use the following tools to maintain code quality:

- **[TypeScript](https://www.typescriptlang.org/)** — type checking
- **[ESLint](https://eslint.org/)** with **[Prettier](https://prettier.io/)** — linting and formatting
- **[Jest](https://jestjs.io/)** — unit testing

Our pre-commit hooks verify that the linter and tests pass when committing.

### Publishing to npm

We use [release-it](https://github.com/release-it/release-it) to automate publishing. It handles version bumping, git tags, and GitHub releases based on [Semantic Versioning](https://semver.org/).

To publish a new version, run:

```sh
yarn release
```

### Sending a Pull Request

> **Working on your first pull request?** You can learn how from this free series: [How to Contribute to an Open Source Project on GitHub](https://app.egghead.io/playlists/how-to-contribute-to-an-open-source-project-on-github).

When sending a pull request:

- Prefer small, focused pull requests that address one change at a time.
- Verify that linters and tests are passing (`yarn lint && yarn test`).
- Review the documentation to make sure it looks good.
- Follow the pull request template when opening a pull request.
- For pull requests that change the API or implementation, discuss with maintainers first by opening an issue.
