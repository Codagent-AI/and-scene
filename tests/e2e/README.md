# End-to-end tests

`npm test` includes `*.test.ts(x)` and `*.spec.ts(x)` files in this directory.
Browser-backed tests must launch their browser unconditionally. Do not mark a
browser test skipped when Chromium is unavailable: let browser startup fail so
the missing runtime is visible to the test run. Install the browser expected by
the test suite in the environment before running `npm test`.
