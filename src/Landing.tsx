import { presentations } from './presentations'

export default function Landing() {
  return (
    <main className="landing">
      <h1>and-scene</h1>
      <p>Presentations that evolve as one scene.</p>
      <ul>
        {presentations.map((p) => (
          <li key={p.slug}>
            <a href={`/${p.slug}`}>{p.title}</a>
          </li>
        ))}
      </ul>
    </main>
  )
}
