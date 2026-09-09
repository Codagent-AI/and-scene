import type { PresentationRegistration } from './presentation-kit'

export function Landing({ presentations }: { presentations: readonly PresentationRegistration[] }) {
  return (
    <main data-presentation-landing>
      <h1>Presentations</h1>
      {presentations.length === 0 ? <p>No presentations are registered yet.</p> : null}
      <ul>{presentations.map((presentation) => <li key={presentation.slug}><a href={`/${presentation.slug}`}>{presentation.title}</a></li>)}</ul>
    </main>
  )
}
