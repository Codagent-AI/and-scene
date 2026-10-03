import type { PresentationRegistryEntry } from './presentations'

export interface LandingProps {
  registry: PresentationRegistryEntry[]
}

/** Enumerates every registered presentation and links to its route. */
export function Landing({ registry }: LandingProps) {
  return (
    <main data-presentation-landing="true">
      <h1>and-scene</h1>
      <p>Presentations as evolving diagrams.</p>
      {registry.length === 0 ? (
        <p data-presentation-landing-empty="true">No presentations are registered yet.</p>
      ) : (
        <ul data-presentation-landing-list="true">
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
