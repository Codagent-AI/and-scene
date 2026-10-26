import { presentations } from './presentations'
import './Landing.css'

export function Landing() {
  return (
    <main data-presentation-landing>
      <h1>and-scene</h1>
      <p>Presentations as evolving scenes.</p>
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
      ) : (
        <p>No presentations have been registered yet.</p>
      )}
    </main>
  )
}
