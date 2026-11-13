import { presentations } from './presentations'
export function Landing(){return <main className="landing"><p>AND SCENE / A FIELD GUIDE</p><h1>Ideas move.<br/>Let yours.</h1><p>One evolving scene. A story you can explore.</p><ul>{presentations.map(p=><li key={p.slug}><a href={`/${p.slug}`}><span>{p.title}</span><span>Explore ↗</span></a></li>)}</ul></main>}
