import { presentationRegistry } from './presentations'
import './Landing.css'

export function Landing() {
  return (
    <main className="landing" data-presentation-landing="true">
      <h1>And Scene</h1>
      <p>Presentations as evolving diagrams.</p>
      {presentationRegistry.length ? <ul>{presentationRegistry.map((presentation) => <li key={presentation.slug}><a href={`/${presentation.slug}`}>{presentation.title}</a></li>)}</ul> : <p>No presentations have been registered yet.</p>}
    </main>
  )
}
