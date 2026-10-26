import { presentations } from './presentations'

/** Enumerates the presentation registry; replaces the placeholder App.tsx. */
export default function Landing() {
  return (
    <main className="landing" data-app="landing">
      <h1>and-scene</h1>
      <p>Presentations as evolving diagrams.</p>
      {presentations.length === 0 ? (
        <p data-app="empty-registry">No presentations registered yet.</p>
      ) : (
        <ul data-app="presentation-list">
          {presentations.map((entry) => (
            <li key={entry.slug}>
              <a href={`/${entry.slug}`}>{entry.title}</a>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
