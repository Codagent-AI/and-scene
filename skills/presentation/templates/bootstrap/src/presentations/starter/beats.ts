import type { ArrowId, BoxId } from './entities'

export interface Beat {
  era: string
  title: string
  caption: string
  /** Entities introduced in this beat. Earlier entities stay on screen. */
  enter: ReadonlyArray<BoxId | ArrowId>
}

// Replace these with the presentation's own narrative. Keep one era per section and one
// title and caption per step. Titles are short; captions are one paragraph.
export const BEATS: readonly Beat[] = [
  {
    era: 'the start',
    title: 'A first idea',
    caption: 'The presentation opens on one idea.',
    enter: ['start'],
  },
  {
    era: 'the middle',
    title: 'It develops',
    caption: 'The same scene grows: the idea connects to the next one.',
    enter: ['middle', 'first'],
  },
  {
    era: 'the end',
    title: 'It lands',
    caption: 'The last piece completes the chain without moving what came before.',
    enter: ['end', 'second'],
  },
]
