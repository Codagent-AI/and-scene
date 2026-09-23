import { mkdtemp, mkdir, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { runRenderVerification } from '../verification-runner.mjs'

const roots: string[] = []
async function fixture({ fault = '' } = {}) {
  const root = await mkdtemp(join(tmpdir(), 'and-scene-verify-'))
  roots.push(root)
  await symlink(join(process.cwd(), 'node_modules'), join(root, 'node_modules'), 'dir')
  await mkdir(join(root, 'dist'), { recursive: true })
  const page = `<!doctype html><html><body><main data-step-count="2" data-step-index="0"><button>next</button></main><script>const root=document.querySelector('main');document.querySelector('button').onclick=()=>{${fault === 'stuck' ? '' : "root.dataset.stepIndex='1';"}${fault === 'console' ? "console.error('fixture render fault');" : ''}};document.addEventListener('keydown',e=>{if(e.key==='ArrowRight')document.querySelector('button').click()})</script></body></html>`
  await writeFile(join(root, 'dist/index.html'), page)
  return root
}
afterEach(async () => { await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true }))) })

describe('production render verification fault reporting', () => {
  it('names the active step when a console error occurs during a transition', async () => {
    const root = await fixture({ fault: 'console' })
    const outcome = await runRenderVerification({ root, route: '/', expectedSteps: 2, port: 43081 })
    expect(outcome.ok).toBe(false)
    expect(outcome.error).toContain('step 2')
    expect(outcome.error).toContain('fixture render fault')
  }, 30000)

  it('names the step when the public step index does not advance', async () => {
    const root = await fixture({ fault: 'stuck' })
    const outcome = await runRenderVerification({ root, route: '/', expectedSteps: 2, port: 43082 })
    expect(outcome.ok).toBe(false)
    expect(outcome.error).toContain('step 2')
    expect(outcome.error).toContain('expected data-step-index=1')
  }, 30000)
})
