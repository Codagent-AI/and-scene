import { presentations } from './presentations'
export default function Landing() { return <main className="landing"><p>AND SCENE / A FIELD GUIDE</p><h1>Ideas worth<br />watching unfold.</h1><p>One canvas. A story that builds.</p>{presentations.map(p => <a key={p.slug} href={`/${p.slug}`}>{p.title} <span>↗</span></a>)}</main> }
