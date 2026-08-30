import type { PresentationRegistration } from './presentations'

interface LandingProps {
  presentations: readonly PresentationRegistration[]
}

export function Landing({ presentations }: LandingProps) {
  return (
    <main data-presentation-landing="true">
      <h1>Presentations</h1>
      {presentations.length === 0 ? <p>No presentations are registered yet.</p> : null}
      <ul>
        {presentations.map((presentation) => (
          <li key={presentation.slug}>
            <a href={`/${presentation.slug}`}>{presentation.title}</a>
          </li>
        ))}
      </ul>
    </main>
  )
}
