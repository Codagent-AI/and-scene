import { presentations, type PresentationRegistryEntry } from './presentations'

export interface LandingProps {
  entries?: PresentationRegistryEntry[]
}

export function Landing({ entries = presentations }: LandingProps) {
  return (
    <main data-presentation-chrome="landing">
      <h1>and-scene</h1>
      {entries.length === 0 ? (
        <p>No presentations registered yet.</p>
      ) : (
        <ul>
          {entries.map((entry) => (
            <li key={entry.slug}>
              <a href={`/${entry.slug}`}>{entry.title}</a>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
