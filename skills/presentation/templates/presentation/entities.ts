/**
 * Stable `layoutId` namespace for {{TITLE}}.
 *
 * Every entity that should morph across steps (rather than remount) needs a
 * stable id here. Add one entry per conceptual entity — not per step.
 */
export const ENTITIES = {
  {{ENTITY_KEY}}: '{{SLUG}}-{{ENTITY_KEY}}',
} as const
