import { presentations } from './presentations'

export default function Landing() {
  return (
    <main>
      <h1>And Scene</h1>
      <p>Presentations as one evolving diagram.</p>
      <ul>
        {presentations.map((entry) => (
          <li key={entry.slug}>
            <a href={`/${entry.slug}`}>{entry.title}</a>
          </li>
        ))}
      </ul>
    </main>
  )
}
