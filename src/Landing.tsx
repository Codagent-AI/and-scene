import { presentations } from './presentations'
export default function Landing() {
  return <main className="landing"><span>AND SCENE / FIELD NOTES</span><h1>Ideas, in motion.</h1><p>One scene. A story that builds, one beat at a time.</p><nav aria-label="Presentations">{presentations.map(entry => <a key={entry.slug} href={`/${entry.slug}`}><span>{entry.title}</span><span aria-hidden="true">↗</span></a>)}</nav></main>
}
