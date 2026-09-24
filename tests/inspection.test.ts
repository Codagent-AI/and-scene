import { describe, expect, it } from 'vitest'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const root = process.cwd()

describe('presentation screenshot diagnostics (INT-002)', () => {
  it('captures settled steps, reports defects, and exempts explicitly allowed overlap', () => {
    const fixture = mkdtempSync(join(tmpdir(), 'and-scene-inspection-'))
    try {
      mkdirSync(join(fixture, 'scripts'), { recursive: true })
      mkdirSync(join(fixture, 'dist'), { recursive: true })
      symlinkSync(join(root, 'node_modules'), join(fixture, 'node_modules'), 'dir')
      writeFileSync(join(fixture, 'scripts/inspect-presentation.mjs'), readFileSync(join(root, 'scripts/inspect-presentation.mjs')))
      writeFileSync(join(fixture, 'package.json'), JSON.stringify({ type: 'module' }))
      writeFileSync(join(fixture, 'dist/index.html'), `<!doctype html><html><head><style>
        body{font:16px sans-serif}.card{position:absolute;left:100px;top:100px;width:160px;height:60px;background:#eee}
        .overlap{position:absolute;left:120px;top:110px}.allowed{position:absolute;left:120px;top:110px}
        .presentation-progress button,.presentation-toc button{color:#222;background:white;border:1px solid #aaa;font-weight:400}
        .presentation-attribution{font-size:10px;text-decoration:underline}
      </style></head><body><main data-presentation=""><header data-presentation-header><span>Fixture</span></header>
      <nav class="presentation-toc"><button data-presentation-toc-item data-presentation-active="false">Era</button><button data-presentation-toc-item data-presentation-active="false">Other</button></nav><section data-presentation-scene><div class="card">Unmarked collision</div><div class="overlap">Collision partner</div><div data-presentation-allow-overlap><span class="allowed">Intentional overlap</span></div></section>
      <footer data-presentation-footer><div class="presentation-navigation"><nav class="presentation-progress"><button aria-current="step" data-presentation-progress-item data-presentation-active="true">1</button><button data-presentation-progress-item data-presentation-active="false">2</button></nav><span data-step-count="2" data-step-index="0">Step</span><button aria-label="Next step" id="next">Next</button></div><a data-presentation-attribution href="#">made by fixture</a></footer>
      <script>document.querySelector('#next').onclick=()=>document.querySelector('[data-step-count]').setAttribute('data-step-index','1');</script></main></body></html>`)

      const startedAt = Date.now()
      const port = 44000 + (process.pid % 1000)
      const result = spawnSync(process.execPath, ['scripts/inspect-presentation.mjs', 'fixture'], { cwd: fixture, encoding: 'utf8', timeout: 30000, env: { ...process.env, AND_SCENE_INSPECT_PORT: String(port), PRESENTATION_INSPECT_SETTLE_MS: '900' } })
      expect(result.status).toBe(0)
      const output = result.stdout + result.stderr
      expect(Date.now() - startedAt).toBeGreaterThanOrEqual(1700)
      expect(output).toContain('overlapping visible text: Unmarked collision / Collision partner')
      expect(output).not.toContain('Intentional overlap')
      expect(output).toContain('active progress state is missing or visually indistinct')
      expect(output).toContain('active table-of-contents state is missing or visually indistinct')
      expect(output).toContain('attribution is missing, browser-default, or undersized')
      expect(output).toContain('Captured 2 settled step screenshots')
      expect(readdirSync(join(fixture, 'artifacts/inspection'))).toEqual(['fixture-01.png', 'fixture-02.png'])
    } finally {
      rmSync(fixture, { recursive: true, force: true })
    }
  }, 60000)
})
