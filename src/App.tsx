import { ArrowRight, Boxes, GitBranch, Sparkles } from 'lucide-react'
import './App.css'

const beats = [
  {
    id: 'scene',
    label: 'Scene',
    detail: 'One shared canvas holds the talk together.',
  },
  {
    id: 'state',
    label: 'State',
    detail: 'Each step changes positions, labels, focus, or connections.',
  },
  {
    id: 'arc',
    label: 'Arc',
    detail: 'The audience follows one idea as it develops.',
  },
]

function App() {
  return (
    <main className="shell">
      <section className="intro" aria-labelledby="page-title">
        <p className="eyebrow">and-scene</p>
        <h1 id="page-title">Presentations as evolving diagrams.</h1>
        <p className="summary">
          This repo is the fixture for a future skill that generates browser-based
          talks from a topic. The core artifact is not a deck of isolated slides;
          it is one scene moving through named states.
        </p>
      </section>

      <section className="stage" aria-label="Evolving diagram preview">
        <div className="stage-header">
          <span>single scene</span>
          <span>step 03</span>
        </div>
        <div className="diagram">
          <div className="node node-topic">
            <Sparkles size={24} aria-hidden="true" />
            <span>topic</span>
          </div>
          <ArrowRight className="connector connector-one" size={34} aria-hidden="true" />
          <div className="node node-scene">
            <Boxes size={26} aria-hidden="true" />
            <span>scene state</span>
          </div>
          <ArrowRight className="connector connector-two" size={34} aria-hidden="true" />
          <div className="node node-talk">
            <GitBranch size={24} aria-hidden="true" />
            <span>talk arc</span>
          </div>
        </div>
      </section>

      <section className="beats" aria-label="Presentation model">
        {beats.map((beat, index) => (
          <article className="beat" key={beat.id}>
            <span className="beat-number">{String(index + 1).padStart(2, '0')}</span>
            <h2>{beat.label}</h2>
            <p>{beat.detail}</p>
          </article>
        ))}
      </section>
    </main>
  )
}

export default App
