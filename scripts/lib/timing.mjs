/**
 * Milliseconds to wait after a step change before sampling errors or capturing a
 * screenshot. It must exceed the kit's longest newcomer motion (ENTER_DELAY 0.6s
 * plus ENTER_T 0.35s = 950ms) with margin, so animations have finished.
 */
export const ANIMATION_SETTLE_MS = 1200
