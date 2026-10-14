import { presentations } from './presentations'
import type { PresentationEntry } from './presentations'

export function Landing({ entries = presentations }: { entries?: readonly PresentationEntry[] }) {
  return <main>
    <h1>Presentations</h1>
    {entries.length ? <ul>{entries.map(entry => <li key={entry.slug}>
      <a data-presentation-link href={`/${entry.slug}`}>{entry.title}</a>
    </li>)}</ul> : <p>No presentations yet.</p>}
  </main>
}
