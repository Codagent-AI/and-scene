import { presentations, type PresentationEntry } from './presentations'

export default function Landing({ registry = presentations }: { registry?: readonly PresentationEntry[] }) {
  return (
    <main className="landing">
      <h1>and-scene</h1>
      <p>Browser presentations that evolve as one scene.</p>
      <ul>
        {registry.map((p) => (
          <li key={p.slug}>
            <a href={`/${p.slug}`}>{p.title}</a>
          </li>
        ))}
      </ul>
    </main>
  )
}
