import { presentations } from './presentations'
import type { PresentationEntry } from './presentations/types'

export default function Landing({ registry = presentations }: { registry?: readonly PresentationEntry[] }) {
  return (
    <main className="landing">
      <h1>Presentations</h1>
      {registry.length === 0 ? (
        <p>No presentations registered yet.</p>
      ) : (
        <ul>
          {registry.map((entry) => (
            <li key={entry.slug}>
              <a href={`/${entry.slug}`}>{entry.title}</a>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
