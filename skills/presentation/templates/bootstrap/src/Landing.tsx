import { presentations } from './presentations'
import type { PresentationEntry } from './presentations'
export function Landing({ entries = presentations }: { entries?: PresentationEntry[] }) {
  return <main><h1>Presentations</h1><ul>{entries.map(entry => <li key={entry.slug}><a href={`/${entry.slug}`}>{entry.title}</a></li>)}</ul></main>
}
