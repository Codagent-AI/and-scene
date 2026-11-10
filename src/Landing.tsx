import { presentations } from './presentations'
import type { PresentationEntry } from './presentations'
export default function Landing({
  entries = presentations,
}: {
  entries?: PresentationEntry[]
}) {
  return (
    <main className="landing">
      <p>And Scene</p>
      <h1>Ideas, in motion.</h1>
      <ul>
        {entries.map((entry) => (
          <li key={entry.slug}>
            <a href={`/${entry.slug}`}>
              {entry.title}
              <span aria-hidden="true"> ↗</span>
            </a>
          </li>
        ))}
      </ul>
    </main>
  )
}
