import { useEffect, useState } from 'react'

export default function Fixture() {
  const [index, setIndex] = useState(0)
  const [settled, setSettled] = useState(false)
  useEffect(() => {
    const advance = (event: KeyboardEvent) => {
      if (event.key !== 'ArrowRight') return
      setSettled(false)
      setIndex(index => Math.min(index + 1, 2))
    }
    window.addEventListener('keydown', advance)
    return () => window.removeEventListener('keydown', advance)
  }, [])
  useEffect(() => {
    const timer = setTimeout(() => setSettled(true), 400)
    return () => clearTimeout(timer)
  }, [index])
  return <main data-presentation-root data-step-count="3" data-step-index={index}>
    <style>{'body { margin: 0; background: white; font: 16px Arial; } span { position: absolute; top: 100px; left: 20px; } footer { position: absolute; top: 300px; } a { position: absolute; top: 400px; }'}</style>
    <section data-presentation-canvas-host>
      {index === 0 ? <div data-presentation-allow-overlap="true"><span>Allowed one</span><span>Allowed two</span></div>
        : index === 1 ? <div><span>Outer text <b>nested</b></span><span>Collision</span></div>
        : <p>Present mode has no navigation controls</p>}
      <div style={{ position: 'absolute', top: 200, left: settled ? 200 : 0 }}>{settled ? 'Settled' : 'Moving'} step {index + 1}</div>
      <p style={{ position: 'absolute', top: 450, width: 35, lineHeight: 0.9 }}>One wrapped text node</p>
    </section>
    {index !== 2 && <footer data-presentation-footer><div data-presentation-progress>
      <button data-presentation-active="true" style={{ fontWeight: index === 0 ? 700 : 400 }}>Current</button><button>Inactive</button>
    </div></footer>}
    <a data-presentation-attribution href="https://github.com/Codagent-AI/and-scene" style={{ color: index === 1 ? undefined : '#555', fontSize: index === 1 ? 10 : 14 }}>made by and-scene</a>
  </main>
}
