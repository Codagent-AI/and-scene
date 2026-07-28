/**
 * Stable layoutId namespace for __TITLE__.
 *
 * Every entity that should morph (not remount) across steps needs a stable id
 * here, prefixed so it can never collide with another presentation's ids.
 */
export const entities = {
  exampleBox: '__SLUG__-example-box',
} as const
