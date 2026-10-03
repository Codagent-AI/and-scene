import { presentations } from './presentations'
import './Landing.css'

/** Replaces the placeholder App.tsx; enumerates the presentation registry. */
export function Landing() {
  return (
    <main className="landing" data-presentation-landing="">
      <header className="landing-header">
        <p className="landing-eyebrow">and-scene</p>
        <h1>Presentations as evolving diagrams.</h1>
        <p className="landing-summary">
          Each presentation below is one scene moving through named steps, not a
          deck of isolated slides.
        </p>
      </header>
      {presentations.length > 0 ? (
        <ul className="landing-list" data-presentation-registry="">
          {presentations.map((entry) => (
            <li key={entry.slug}>
              <a href={`/${entry.slug}`} data-presentation-registry-item="">
                {entry.title}
              </a>
            </li>
          ))}
        </ul>
      ) : (
        <p className="landing-empty" data-presentation-registry-empty="">
          No presentations are registered yet.
        </p>
      )}
    </main>
  )
}

export default Landing
