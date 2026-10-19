// Plain data (no JSX) so verification can read the real narration in Node.
// Order defines on-screen numbering; ids stay stable when steps move.
export const TITLE = '__TITLE__'

export interface Narration {
  id: string
  era: string
  title: string
  caption: string
}

export const NARRATION: readonly Narration[] = [
  { id: 'begin', era: 'beginning', title: 'First beat', caption: 'Describe what the viewer sees first.' },
  { id: 'grow', era: 'beginning', title: 'Second beat', caption: 'Describe what is added; earlier entities stay where they are.' },
  { id: 'connect', era: 'ending', title: 'Third beat', caption: 'Describe how the pieces relate.' },
]
