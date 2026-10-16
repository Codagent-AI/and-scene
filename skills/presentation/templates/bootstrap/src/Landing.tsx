import { presentations, type PresentationEntry } from './presentations'

export function Landing({ registry = presentations }: { registry?: readonly PresentationEntry[] }) {
  return (
    <main className="landing">
      <h1>and-scene</h1>
      <ul data-landing-list>
        {registry.map((p) => (
          <li key={p.slug}>
            <a href={`/${p.slug}`}>{p.title}</a>
          </li>
        ))}
      </ul>
    </main>
  )
}
