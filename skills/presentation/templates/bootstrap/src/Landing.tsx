import { presentations } from './presentations'
import type { Registration } from './presentations'
export function Landing({ entries = presentations }: { entries?: readonly Registration[] }) {
  return <main><h1>Presentations</h1><ul>{entries.map(entry => <li key={entry.slug}><a data-presentation-route={entry.slug} href={`/${entry.slug}`}>{entry.title}</a></li>)}</ul></main>
}
