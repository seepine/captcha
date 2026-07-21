# AGENTS.md

This file provides guidance to Ai Agent when working with code in this repository.

## Project

`@seepine/captcha` is a Node.js TypeScript library that generates and validates slide, click, and rotation CAPTCHA images. It uses `@napi-rs/canvas`; generated images are returned as `Buffer`s. Node.js 24+ and pnpm 11.9.0 are required.

## Commands

```sh
pnpm install --frozen-lockfile  # install dependencies
pnpm tsc                        # type-check without emitting
pnpm test                       # run all Vitest tests
pnpm coverage                   # run tests with V8 coverage
pnpm build                      # build ESM, CJS, and declarations into dist/
pnpm format                     # format repository files with Prettier
```

CI runs `pnpm tsc`, `pnpm test`, `pnpm coverage`, and `pnpm build`. Pre-commit formats staged files and runs the Vitest suite when TypeScript files under `src/` are staged; commit messages use Conventional Commits.

## Architecture

- `src/index.ts` is the intentionally small public API. It exports one-shot generators and validators for slide, click, and rotate CAPTCHA types, plus font registration and public type definitions. Raw bundled resources are exposed separately through `@seepine/captcha/assets`.
- `src/slide/`, `src/click/`, and `src/rotate/` each own a CAPTCHA mode. Each has a `captcha.ts` generator/validator, `options.ts` defaults and normalization, and `resources.ts` resource validation. Generators select randomized resource/configuration values, draw with canvas, encode the result, and return verification metadata; validators consume that metadata on the server.
- `src/internal/` contains shared image decoding/encoding, random selection, rotation/angle handling, drawing, font registration, and shared data types. Image inputs accept a `Buffer` or base64 string; strings are decoded as base64 by `internal/image-source.ts`.
- Tests under `test/` exercise public behavior by mode. `test/_helpers/artifacts.ts` supports generated-image test artifacts. Vitest aliases `@` to `src`; coverage intentionally excludes `src/assets/**` and `src/internal/**`.

## Assets

`src/assets/` contains large bundled resource data and is a separate build entry. Avoid opening or broadly searching it unless the task specifically concerns assets; use the `@seepine/captcha/assets` public subpath when testing consumer-facing resource imports.
