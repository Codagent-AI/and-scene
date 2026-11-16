// Runtime verification is plain JavaScript so it can run directly with Node.
// @ts-expect-error The runtime module intentionally has no declaration file.
export { referenceSteps } from '../scripts/reference.mjs'
// @ts-expect-error The runtime module intentionally has no declaration file.
export { validateReference } from '../scripts/verify.mjs'
