import { presentations } from './presentations'
import type { PresentationEntry } from './presentations'
export function Landing({ entries = presentations }: { entries?: PresentationEntry[] }) {
  return <main className="landing"><p className="eyebrow">AND SCENE / PRESENTATIONS</p><h1>Ideas, in motion.</h1><p>One diagram. A story that unfolds.</p><ol>{entries.map(entry => <li key={entry.slug}><a href={`/${entry.slug}`}>{entry.title}<span aria-hidden="true"> ↗</span></a></li>)}</ol><p className="landing-note">Use the arrow keys to explore. Press P to present.</p></main>
}
