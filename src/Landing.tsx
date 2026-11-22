import { presentations } from './presentations'
import type { Registration } from './presentations'
export function Landing({ entries = presentations }: { entries?: readonly Registration[] }) {
  return <main className="landing"><p>AND SCENE / A LIVING DIAGRAM</p><h1>Ideas take shape.</h1><p>One scene. A story that unfolds.</p><ul>{entries.map(entry => <li key={entry.slug}><a data-presentation-route={entry.slug} href={`/${entry.slug}`}>{entry.title}<span aria-hidden="true"> ↗</span></a></li>)}</ul></main>
}
