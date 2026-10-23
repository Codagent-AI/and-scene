import { presentations as registry } from './presentations'
import type { PresentationEntry } from './presentations'

export default function Landing({ entries = registry }: { entries?: readonly PresentationEntry[] }) {
  return (
    <main className="landing">
      <h1>and-scene</h1>
      <p>Presentations that evolve as one scene.</p>
      <ul>
        {entries.map((e) => (
          <li key={e.slug}>
            <a href={`/${e.slug}`}>{e.title}</a>
          </li>
        ))}
      </ul>
    </main>
  )
}
