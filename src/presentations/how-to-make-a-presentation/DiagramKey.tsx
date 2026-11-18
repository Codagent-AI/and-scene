export function DiagramKey() {
  // Two readable rows end at y=96, before the browse stage can begin even
  // when a short viewport leaves no extra space above the fitted canvas.
  return <aside className="diagram-key" aria-label="Diagram key" style={{ top: 60, fontSize: 12, lineHeight: '18px' }}>
    <span>T title · C caption · V visual · P partial · F full</span>
    <span>→ morph · ✎ edited · ✓ build / render</span>
  </aside>
}
