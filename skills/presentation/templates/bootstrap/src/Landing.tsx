import { PRESENTATIONS } from './presentations'

export default function Landing() {
  return (
    <main>
      <h1>Presentations</h1>
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
