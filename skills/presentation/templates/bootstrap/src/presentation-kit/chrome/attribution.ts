export const ATTRIBUTION_LABEL = 'made by and-scene'
export const ATTRIBUTION_HREF = 'https://github.com/Codagent-AI/and-scene'

/** `false` hides the attribution; an object overrides label or link. */
export type AttributionOption = false | { label?: string; href?: string }
