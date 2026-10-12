# Presentation skill maintenance

These instructions are for maintainers of the And Scene repository, not for agents using the distributed presentation skill.

## Bootstrap parity

- `src/presentation-kit/` is canonical. When it changes, synchronize its non-test files byte-for-byte to `skills/presentation/templates/bootstrap/src/presentation-kit/`.
- Keep root `scripts/verify.mjs`, `scripts/inspect-presentation.mjs`, `scripts/preview-process.mjs`, and `scripts/preview-process.d.mts` byte-aligned with their copies in `skills/presentation/templates/bootstrap/scripts/`.
- Keep `scripts/reference-sample.json` out of the bootstrap so copied `verify` runs in generic mode.
- Preserve the style-neutral kit contract: presentations own colors, typography, spacing, and component treatments.

The automated parity integration test guards the release snapshot.
