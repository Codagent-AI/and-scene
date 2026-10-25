import { presentations } from './presentations'
export default function Landing() {
  return <main className="landing"><p>AND SCENE / A PRESENTATION LAB</p><h1>One idea.<br />An evolving scene.</h1><p>Choose a presentation and follow the story.</p><ul>{presentations.map(entry => <li key={entry.slug}><a href={`/${entry.slug}`}>{entry.title} <span aria-hidden="true">↗</span></a></li>)}</ul></main>
}
