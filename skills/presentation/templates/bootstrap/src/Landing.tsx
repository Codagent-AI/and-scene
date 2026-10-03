import type { PresentationRegistryEntry } from './presentations/index.ts'
import { PRESENTATIONS } from './presentations/index.ts'

type LandingProps = {
  presentations?: readonly PresentationRegistryEntry[]
}

export function Landing({ presentations = PRESENTATIONS }: LandingProps) {
  return (
    <main data-landing>
      <h1>Presentations</h1>
      {presentations.length > 0 ? (
        <nav aria-label="Presentations">
          <ul>
            {presentations.map((presentation) => (
              <li key={presentation.slug}>
                <a href={`/${presentation.slug}`}>{presentation.title}</a>
              </li>
            ))}
          </ul>
        </nav>
      ) : <p data-empty-presentations>No presentations registered yet.</p>}
    </main>
  )
}
