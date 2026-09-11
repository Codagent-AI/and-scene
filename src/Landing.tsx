import type { PresentationRegistryEntry } from './presentations/index.ts'
import { PRESENTATIONS } from './presentations/index.ts'

type LandingProps = {
  presentations?: readonly PresentationRegistryEntry[]
}

export function Landing({ presentations = PRESENTATIONS }: LandingProps) {
  return (
    <main className="landing-shell" data-landing>
      <section className="landing-intro" aria-labelledby="landing-title">
        <p className="landing-eyebrow">and-scene</p>
        <h1 id="landing-title">Presentations as evolving scenes.</h1>
        <p>
          Browse browser-based presentations where one diagram develops through a sequence of named states.
        </p>
      </section>
      <section className="landing-presentations" aria-labelledby="presentation-list-title">
        <h2 id="presentation-list-title">Presentations</h2>
        {presentations.length > 0 ? (
          <ul>
            {presentations.map((presentation) => (
              <li key={presentation.slug}>
                <a href={`/${presentation.slug}`}>{presentation.title}</a>
              </li>
            ))}
          </ul>
        ) : (
          <p data-empty-presentations>No presentations registered yet.</p>
        )}
      </section>
    </main>
  )
}
