import { PRESENTATIONS, type PresentationEntry } from './presentations'

export interface LandingProps {
  entries?: ReadonlyArray<PresentationEntry>
}

/** Index of registered presentations. */
export function Landing({ entries = PRESENTATIONS }: LandingProps) {
  return (
    <main className="landing">
      <h1>and-scene</h1>
      <p>Presentations as one evolving diagram.</p>
      {entries.length === 0 ? (
        <p>No presentations yet. Register one in src/presentations/index.ts.</p>
      ) : (
        <ul className="landing-list">
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
