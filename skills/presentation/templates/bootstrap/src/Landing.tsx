import { PRESENTATIONS } from './presentations'
import type { PresentationEntry } from './presentations'

export function Landing({ entries = PRESENTATIONS }: { entries?: readonly PresentationEntry[] }) {
  return (
    <main data-landing>
      <h1>and-scene</h1>
      <ul>
        {entries.map((entry) => (
          <li key={entry.slug}>
            <a href={`/${entry.slug}`}>{entry.title}</a>
          </li>
        ))}
      </ul>
    </main>
  )
}
