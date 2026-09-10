import { presentations } from './presentations'

export function Landing() {
  return (
    <main data-presentation-landing="true">
      <h1>and-scene presentations</h1>
      {presentations.length === 0 ? <p>No presentations are registered yet.</p> : (
        <ul>
          {presentations.map((presentation) => <li key={presentation.slug}><a href={`/${presentation.slug}`}>{presentation.title}</a></li>)}
        </ul>
      )}
    </main>
  )
}
