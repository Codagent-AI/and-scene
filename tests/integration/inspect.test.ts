import { describe, expect, it } from 'vitest'
import { spawnSync } from 'node:child_process'
import { cp, mkdtemp, readFile, readdir, rm, symlink, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

const root = process.cwd()
const copyProject = async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'and-scene-inspect-'))
  await cp(root, dir, { recursive: true, filter: source => !source.includes('/node_modules') && !source.includes('/dist') && !source.includes('/.git') && !source.includes('/.presentation-inspection') })
  await symlink(path.join(root, 'node_modules'), path.join(dir, 'node_modules'), 'dir')
  return dir
}

async function addFixture(dir: string, polished: boolean) {
  const fixture = path.join(dir, 'src/presentations/inspection-fixture')
  await (await import('node:fs/promises')).mkdir(fixture, { recursive: true })
  await writeFile(path.join(fixture, 'Talk.tsx'), `import { useEffect, useState } from "react";
import { Presentation, type Step } from "../../presentation-kit";
import "./fixture.css";
function Scene({ payload }: { payload: { index: number } }) {
  const [marker, setMarker] = useState("animating-" + payload.index);
  useEffect(() => { setMarker("animating-" + payload.index); const timer = setTimeout(() => setMarker("settled-" + payload.index), 500); return () => clearTimeout(timer); }, [payload.index]);
  return <div className="fixture-scene"><span data-inspect-settle-marker={marker} />{payload.index === 1 ? <><span className="collision-a">Collision A</span><span className="collision-b">Collision B</span></> : <div data-presentation-allow-overlap className="allowed"><span className="allowed-a">Allowed A</span><span className="allowed-b">Allowed B</span></div>}{payload.index === 3 && <><span className="caption-collision">Caption collision</span><div className="hidden"><span className="hidden-a">Hidden A</span><span className="hidden-b">Hidden B</span></div></>}</div>;
}
const steps: Step<{ index: number }>[] = [1, 2, 3].map(index => ({ id: String(index), era: "fixture", title: "Step " + index, caption: "Caption " + index, Scene, payload: { index } }));
export default function Talk() { return <Presentation steps={steps} title="Inspection fixture" initialMode="browse" />; }
`)
  await writeFile(path.join(fixture, 'fixture.css'), `.fixture-scene{position:absolute;inset:200px 0 auto 0;height:80px}.collision-a,.collision-b,.allowed-a,.allowed-b,.hidden-a,.hidden-b{position:absolute;left:100px;top:0}.collision-b,.allowed-b,.hidden-b{left:110px}.caption-collision{position:absolute;left:calc(50% - 40px);top:280px}.allowed,.hidden{position:relative}.hidden{opacity:0}[data-presentation-caption]{position:absolute;left:0;right:0;bottom:52px;text-align:center} [data-presentation-footer] nav{display:flex;gap:12px;position:absolute;bottom:8px;left:50%;transform:translateX(-50%)}${polished ? '.collision-a,.collision-b,.caption-collision{display:none}' : ''}[data-presentation-attribution]{${polished ? 'color:#345;font-size:14px;text-decoration:none' : ''}}${polished ? '[data-active="true"]{color:white;background:#234;transform:scale(1.1)}' : ''}`)
  const registryPath = path.join(dir, 'src/presentations/index.ts')
  await writeFile(registryPath, (await readFile(registryPath, 'utf8')).replace('export const presentations:', 'export const presentations:').replace('[\n', '[\n  { slug: "inspection-fixture", title: "Inspection fixture", load: () => import("./inspection-fixture/Talk") },\n'))
}

describe('presentation inspection', () => {
  it('captures settled screenshots and reports advisory issues while respecting allowed overlap', { timeout: 180_000 }, async () => {
    const dir = await copyProject()
    try {
      await addFixture(dir, false)
      const build = spawnSync('npm', ['run', 'build'], { cwd: dir, encoding: 'utf8', timeout: 120_000 })
      expect(build.status, `${build.stdout}\n${build.stderr}`).toBe(0)
      const result = spawnSync('node', ['scripts/inspect-presentation.mjs', 'inspection-fixture', '--settle', '550', '--skip-build'], { cwd: dir, encoding: 'utf8', timeout: 120_000 })
      const text = `${result.stdout}\n${result.stderr}`
      expect(result.status, text).toBe(0)
      expect(text).toContain('captured step 1/3:')
      expect(text).toContain('marker=settled-1')
      expect(text).toContain('marker=settled-2')
      expect(text).toContain('marker=settled-3')
      expect(text).toContain('[inspect] WARN step=1 overlap:')
      expect(text).toMatch(/WARN step=3 overlap:.*Caption collision/)
      expect(text).toContain('active-nav:')
      expect(text).toContain('[inspect] WARN step=1 attribution:')
      expect(text).not.toMatch(/WARN step=2 overlap:.*Allowed A|WARN step=2 overlap:.*Allowed B/)
      expect(text).not.toMatch(/Hidden A|Hidden B/)
      expect(text).toContain('[inspect] done: 3 screenshots,')
      const files = (await readdir(path.join(dir, '.presentation-inspection/inspection-fixture'))).sort()
      expect(files).toEqual(['step-01.png', 'step-02.png', 'step-03.png'])
      for (const file of files) expect((await readFile(path.join(dir, '.presentation-inspection/inspection-fixture', file))).byteLength).toBeGreaterThan(100)
    } finally { await rm(dir, { recursive: true, force: true }) }
  })

  it('clears active navigation and attribution warnings when presentation styling fixes them', { timeout: 180_000 }, async () => {
    const dir = await copyProject()
    try {
      await addFixture(dir, true)
      const build = spawnSync('npm', ['run', 'build'], { cwd: dir, encoding: 'utf8', timeout: 120_000 })
      expect(build.status, `${build.stdout}\n${build.stderr}`).toBe(0)
      const result = spawnSync('node', ['scripts/inspect-presentation.mjs', 'inspection-fixture', '--settle', '550', '--skip-build'], { cwd: dir, encoding: 'utf8', timeout: 120_000 })
      const text = `${result.stdout}\n${result.stderr}`
      expect(result.status, text).toBe(0)
      expect(text).not.toContain('active-nav:')
      expect(text).not.toContain('attribution:')
      expect(text).not.toContain('overlap:')
    } finally { await rm(dir, { recursive: true, force: true }) }
  })
})
