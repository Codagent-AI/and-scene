import { PRESENTATIONS } from './presentations'

export default function Landing() {
  return (
    <main className="landing">
      <h1>and-scene</h1>
      <p>Presentations as one evolving scene.</p>
      <ul>
        {PRESENTATIONS.map((p) => (
          <li key={p.slug}>
            <a href={`/${p.slug}`}>{p.title}</a>
          </li>
        ))}
      </ul>
    </main>
  )
}
