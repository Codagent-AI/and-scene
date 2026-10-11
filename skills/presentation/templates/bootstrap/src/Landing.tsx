import { presentations } from './presentations';
export default function Landing() {
    return <main className="landing"><p>And Scene</p><h1>Ideas in motion.</h1><p>Browser presentations built around one evolving scene.</p><ul>{presentations.map(entry => <li key={entry.slug}><a href={`/${entry.slug}`}>{entry.title}</a></li>)}</ul>{!presentations.length && <p>No presentations yet.</p>}</main>;
}
