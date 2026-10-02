import { presentations } from './presentations'

export default function Landing() {
  return <main className="presentation-landing" data-presentation-landing="">
    <h1>Presentations</h1>
    {presentations.length === 0 ? <p>No presentations have been registered yet.</p> : <ul>
      {presentations.map((presentation) => <li key={presentation.slug}><a href={`/${presentation.slug}`}>{presentation.title}</a></li>)}
    </ul>}
  </main>
}
