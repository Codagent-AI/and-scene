import { presentations } from './presentations/index.ts'

export default function Landing() {
  return (
    <main className="landing">
      <h1>and-scene</h1>
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
