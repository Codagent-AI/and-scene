import { presentations } from './presentations'
export default function Landing() {
  return <main className="landing"><p>AND SCENE / A PRESENTATION STUDIO</p><h1>One scene.<br />A story that moves.</h1><p>Ideas unfold. Shapes stay with you.</p><nav aria-label="Presentations">{presentations.map(entry => <a key={entry.slug} href={`/${entry.slug}`}><span>{entry.title}</span><span aria-hidden="true">↗</span></a>)}</nav></main>
}
