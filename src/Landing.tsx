import { presentations as defaultRegistry } from './presentations'
import type { PresentationEntry } from './presentations'

export default function Landing({ registry = defaultRegistry }: { registry?: readonly PresentationEntry[] }) {
  return (
    <main className="landing">
      <h1>And Scene</h1>
      {registry.length === 0 ? (
        <p data-landing-empty="">No presentations registered yet.</p>
      ) : (
        <ul data-landing-list="">
          {registry.map((p) => (
            <li key={p.slug}>
              <a href={`/${p.slug}`} data-landing-link={p.slug}>
                {p.title}
              </a>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
