import { presentations } from './presentations'
import type { RegistryEntry } from './presentation-kit/types'
export default function Landing({ entries = presentations }: { entries?: readonly RegistryEntry[] }) {
  return <main className="landing"><p className="eyebrow">AND SCENE / FIELD NOTES</p><h1>One scene.<br />A story that moves.</h1><p>Browser presentations built from evolving diagrams.</p><nav aria-label="Presentations">{entries.map((entry, i) => <a key={entry.slug} href={`/${entry.slug}`}><span>{String(i + 1).padStart(2, '0')}</span>{entry.title}<span aria-hidden="true">↗</span></a>)}</nav></main>
}
