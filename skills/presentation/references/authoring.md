# Author one evolving scene

Import from the host scene kit. Keep entity IDs presentation-local in `entities.ts`.
Give every step an id, era, title, caption, Scene, and typed payload. Derive visible
numbering from array order. Use a shared Scene and groupKey for adjacent states of
one diagram so the scene instance persists. Put shared scene code in `steps/Scene.tsx`
when it serves multiple step files; collect ordered exports in `steps/index.tsx`.
The starter already separates `steps/Scene.tsx` from its metadata; extend that
shared component when expanding. Never wrap continuing entities in newcomer fades. Wrap each
arrival in kit `Appear` with a stable per-entity `key`, placed directly inside the scene's
`AnimatePresence`; without that boundary departures vanish instead of animating out, and an
unstable key re-fades a continuing entity. Keep the fixed 880×380
canvas, stable layoutIds, and shared scene composition across viewport sizes.

Replace the starter subject with the story's entities. Extend `Talk.tsx` with the
ordered typed steps and import the presentation's CSS. Retain the starter's hook
coverage when replacing its CSS skeleton: header, marker, title, footer, caption,
ToC/items, progress/items, active state, prev/next, mode toggle and attribution.
Scope visual values beneath a presentation class. Make active progress/ToC states
visibly distinct and the attribution intentional and readable. Geometry, palette,
fonts, borders, spacing and controls belong to that CSS, never to the reusable kit.
