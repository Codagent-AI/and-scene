/**
 * Entity namespace for the __TITLE__ presentation. Every stable entity id is
 * defined once here, prefixed with this presentation's slug, so layout identity
 * cannot collide with another presentation.
 *
 * Canvas is 880 x 380 (x right, y down). Each entity keeps one rect after it
 * enters. `step` is the 1-based step that introduces it.
 *
 *   id          kind   step  x    y    w    h
 *   source      box    1     80   150  200  80
 *   target      box    2     600  150  200  80
 *   link        arrow  2     (280,190) -> (600,190)
 *   focus       emph.  3     592  142  216  96
 */

export const NS = '__SLUG__'

export const ID = {
  source: `${NS}/source`,
  target: `${NS}/target`,
  link: `${NS}/link`,
  focus: `${NS}/focus`,
} as const

export const RECTS = {
  source: { id: ID.source, x: 80, y: 150, w: 200, h: 80, step: 1 },
  target: { id: ID.target, x: 600, y: 150, w: 200, h: 80, step: 2 },
  focus: { id: ID.focus, x: 592, y: 142, w: 216, h: 96, step: 3 },
} as const

export const LINK = { id: ID.link, from: [280, 190], to: [600, 190], step: 2 } as const
