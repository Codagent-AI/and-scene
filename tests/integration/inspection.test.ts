import { spawnSync } from 'node:child_process'
import { cpSync, existsSync, mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const source = process.cwd()
describe('INT-002 inspection artifacts and diagnostics', () => {
  it('captures settled screenshots and reports only unmarked visual defects', () => {
    const fixture = mkdtempSync(path.join(os.tmpdir(), 'and-scene-inspection-'))
    try {
      mkdirSync(path.join(fixture, 'scripts'), { recursive: true })
      mkdirSync(path.join(fixture, 'dist'), { recursive: true })
      cpSync(path.join(source, 'scripts/inspect-presentation.mjs'), path.join(fixture, 'scripts/inspect-presentation.mjs'))
      cpSync(path.join(source, 'scripts/preview-utils.mjs'), path.join(fixture, 'scripts/preview-utils.mjs'))
      symlinkSync(path.join(source, 'node_modules'), path.join(fixture, 'node_modules'), 'dir')
      writeFileSync(path.join(fixture, 'dist/index.html'), `<!doctype html><html><head><style>
        body{margin:0;font:16px sans-serif} [data-presentation-stage]{position:relative;height:350px}
        .collision{position:absolute;left:20px;top:20px;margin:0}.allowed{position:absolute;left:20px;top:90px;margin:0}
        [data-presentation-progress-indicator]{width:24px;height:24px} [data-presentation-attribution]{font-size:10px}
      </style></head><body><main data-presentation-root><header data-presentation-header>Fixture</header>
      <section data-presentation-stage><p class="collision" id="collision-one">Collision alpha</p><p class="collision" id="collision-two">Collision beta</p>
      <div data-presentation-allow-overlap><p class="allowed" id="allowed-one">Readable intentional overlap</p><p class="allowed" id="allowed-two">Intentional readable overlap</p></div></section>
      <footer data-presentation-footer data-step-count="2" data-step-index="0"><p data-presentation-caption>First</p>
      <button data-presentation-progress-indicator data-active="true" aria-current="step">1</button><button data-presentation-progress-indicator data-active="false">2</button>
      <a data-presentation-attribution href="#">made by and-scene</a></footer></main>
      <script>let step=0;document.addEventListener('keydown',e=>{if(e.key==='ArrowRight'){step=Math.min(1,step+1);const f=document.querySelector('[data-presentation-footer]');f.dataset.stepIndex=String(step);f.querySelector('[data-presentation-caption]').textContent=step?'Second':'First';const b=f.querySelectorAll('[data-presentation-progress-indicator]');b[0].dataset.active=step?'false':'true';b[0].toggleAttribute('aria-current',!step);b[1].dataset.active=step?'true':'false';b[1].toggleAttribute('aria-current',!!step)}})</script></body></html>`)
      const out = path.join(fixture, '.inspection/custom-fixture/640x480')
      const started = Date.now()
      const result = spawnSync('node', ['scripts/inspect-presentation.mjs', 'custom-fixture', '--no-build', '--width', '640', '--height', '480', '--settle', '250'], { cwd: fixture, encoding: 'utf8', timeout: 60_000 })
      const output = `${result.stdout}\n${result.stderr}`
      expect(result.status).toBe(0)
      expect(Date.now() - started).toBeGreaterThanOrEqual(450)
      for (let step = 1; step <= 2; step++) expect(existsSync(path.join(out, `step-${String(step).padStart(2, '0')}.png`))).toBe(true)
      expect(output).toContain('[INFO] settled step 1 after 250ms')
      expect(output).toContain('[INFO] settled step 2 after 250ms')
      expect(output).toContain('[WARN] step 1: collision:')
      expect(output).toContain('[WARN] step 2: collision:')
      expect(output).toContain('active state is indistinguishable')
      expect(output).toContain('style [data-presentation-attribution]')
      expect(output).not.toContain('allowed-one')
      expect(output).not.toContain('allowed-two')
      expect(output).toContain('Warnings summary:')
    } finally { rmSync(fixture, { recursive: true, force: true }) }
  }, 60_000)
})
