import { presentations } from './presentations'
import './App.css'

export default function Landing() {
  return (
    <main className="shell" data-testid="presentation-landing" data-presentation-landing>
      <section className="intro" aria-labelledby="page-title">
        <p className="eyebrow">and-scene</p>
        <h1 id="page-title">Presentations as evolving diagrams.</h1>
        <p className="summary">
          Browse presentations built as one scene moving through named states.
        </p>
      </section>

      <nav aria-label="Presentations" data-presentation-list>
        {presentations.length === 0 ? (
          <p data-presentation-empty>No presentations are registered yet.</p>
        ) : (
          <ul>
            {presentations.map((presentation) => (
              <li key={presentation.slug}>
                <a href={`/${presentation.slug}`}>{presentation.title}</a>
              </li>
            ))}
          </ul>
        )}
      </nav>
    </main>
  )
}
