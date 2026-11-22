import { presentations } from './presentations'
export default function Landing() {
  return <main className="landing"><p>AND SCENE</p><h1>Ideas, in motion.</h1>
    <p>One scene. A story that unfolds.</p>
    <div>{presentations.map(item => <a key={item.slug} href={`/${item.slug}`}><span>{item.title}</span><span aria-hidden="true">↗</span></a>)}</div>
  </main>
}
