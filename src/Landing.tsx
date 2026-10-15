import { presentations, type PresentationEntry } from './presentations'

export default function Landing({ registry = presentations }: { registry?: readonly PresentationEntry[] }) {
  return (
    <main className="landing">
      <h1>and-scene</h1>
      <p>Presentations as evolving diagrams.</p>
      {registry.length === 0 ? (
        <p data-landing-empty="">No presentations yet.</p>
      ) : (
        <ul data-landing-list="">
          {registry.map((p) => (
            <li key={p.slug}>
              <a href={`/${p.slug}`}>{p.title}</a>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
