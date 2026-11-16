import { presentations } from './presentations'
export function Landing() { return <main className="landing"><p className="eyebrow">AND SCENE / PRESENTATIONS</p><h1>Ideas, in motion.</h1><p>One evolving scene. A story you can follow.</p>{presentations.map(p => <a key={p.slug} href={`/${p.slug}`}><span>{p.title}</span><span aria-hidden="true">↗</span></a>)}</main> }
