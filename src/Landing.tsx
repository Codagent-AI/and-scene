import { presentations } from './presentations/index.ts'
import './Landing.css'

export function Landing() {
  return (
    <main className="shell" data-presentation-landing="">
      <section className="intro" aria-labelledby="page-title">
        <p className="eyebrow">and-scene</p>
        <h1 id="page-title">Presentations as evolving diagrams.</h1>
        <p className="summary">
          Each presentation here is one scene moving through named steps —
          stable entities that morph in place — rather than a deck of
          isolated slides.
        </p>
      </section>

      <section className="registry" aria-label="Registered presentations">
        {presentations.length === 0 ? (
          <p className="empty" data-presentation-registry-empty="">
            No presentations are registered yet.
          </p>
        ) : (
          <ul className="registry-list" data-presentation-registry="">
            {presentations.map((entry) => (
              <li key={entry.slug}>
                <a href={`/${entry.slug}`}>{entry.title}</a>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}

export default Landing
