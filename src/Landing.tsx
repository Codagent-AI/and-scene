import { presentations } from './presentations/index.ts'

export function Landing() {
  return (
    <main className="landing">
      <h1>and-scene</h1>
      <p>Presentations as evolving diagrams.</p>
      <ul>
        {presentations.map((entry) => (
          <li key={entry.slug}>
            <a href={`/${entry.slug}`} data-presentation-link={entry.slug}>
              {entry.title}
            </a>
          </li>
        ))}
      </ul>
    </main>
  )
}
