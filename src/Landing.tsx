import type { PresentationEntry } from './presentations'
import './Landing.css'

export default function Landing({ registry }: { registry: readonly PresentationEntry[] }) {
  return (
    <main className="landing" data-landing="">
      <h1>and-scene</h1>
      <p>Presentations as one evolving diagram.</p>
      {registry.length === 0 ? (
        <p data-landing-empty="">No presentations registered yet.</p>
      ) : (
        <ul>
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
