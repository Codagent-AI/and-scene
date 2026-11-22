import { presentations } from './presentations'

export default function Landing() {
  return <main className="landing"><a className="wordmark" href="/">and scene<span> / </span></a><div className="landing-intro"><p className="eyebrow">IDEAS, IN MOTION</p><h1>One scene.<br />A story that unfolds.</h1><p>Browser presentations built around a single evolving diagram.<br />Follow the idea as it takes shape.</p></div><section aria-label="Presentations"><p className="eyebrow">THE COLLECTION</p>{presentations.map((presentation, index) => <a className="presentation-link" key={presentation.slug} href={`/${presentation.slug}`}><span className="collection-number">{String(index + 1).padStart(2, '0')}</span><div><h2>{presentation.title}</h2><p>A conversation, a scene, and a little self-reference.</p></div><span aria-hidden="true">↗</span></a>)}</section><footer>Made to explain things, beautifully.</footer></main>
}
