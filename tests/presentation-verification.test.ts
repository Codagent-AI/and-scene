import { cp, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { basename, join } from 'node:path'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { afterEach, describe, expect, it } from 'vitest'
import { chromium, type Page } from 'playwright'
import { closePreview } from '../scripts/script-utils.mjs'
import { preview } from 'vite'

const execFileAsync = promisify(execFile)
const repositoryRoot = process.cwd()
const temporaryDirectories: string[] = []

async function disposableCopy() {
  const directory = await mkdtemp(join(tmpdir(), 'and-scene-verification-'))
  temporaryDirectories.push(directory)
  await cp(repositoryRoot, directory, {
    recursive: true,
    filter: (source) => !['node_modules', 'dist', 'artifacts', '.git'].includes(basename(source)),
  })
  await symlink(join(repositoryRoot, 'node_modules'), join(directory, 'node_modules'), 'dir')
  return directory
}

async function verify(directory: string) {
  try {
    const result = await execFileAsync('npm', ['run', 'verify'], { cwd: directory })
    return { code: 0, output: `${result.stdout}\n${result.stderr}` }
  } catch (error) {
    const failure = error as { code?: number; stdout?: string; stderr?: string }
    return { code: failure.code ?? 1, output: `${failure.stdout ?? ''}\n${failure.stderr ?? ''}` }
  }
}

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((directory) => rm(directory, { force: true, recursive: true })))
})

describe('production presentation verification', () => {
  it('E2E-001 builds and renders the canonical sample through every step', async () => {
    const result = await verify(repositoryRoot)

    expect(result.code).toBe(0)
    expect(result.output).toContain('VERIFY PASS: /how-to-make-a-presentation built and rendered 9 steps on 127.0.0.1')
  }, 60_000)

  it('E2E-002 reports the originating browser error and step from an isolated faulty copy', async () => {
    const directory = await disposableCopy()
    const talk = join(directory, 'src/presentations/how-to-make-a-presentation/Talk.tsx')
    const source = await readFile(talk, 'utf8')
    await writeFile(talk, source.replace('export default function Talk() {', "export default function Talk() {\n  throw new Error('controlled browser fault')"))

    const result = await verify(directory)

    expect(result.code).not.toBe(0)
    expect(result.output).toContain('VERIFY FAIL at step 1')
    expect(result.output).toContain('controlled browser fault')
  }, 60_000)
})

async function withReferencePage(check: (page: Page) => Promise<void>) {
  await execFileAsync('npm', ['run', 'build'], { cwd: repositoryRoot })
  const server = await preview({ preview: { host: '127.0.0.1', port: 0, strictPort: true } })
  let browser
  try {
    const address = server.httpServer.address()
    if (!address || typeof address === 'string') throw new Error('preview did not bind a TCP port')
    browser = await chromium.launch({ headless: true })
    const page = await browser.newPage()
    await page.goto(`http://127.0.0.1:${address.port}/how-to-make-a-presentation`, { waitUntil: 'networkidle' })
    await check(page)
  } finally {
    await closePreview(browser, server)
  }
}

describe('reference browser behavior', () => {
  it('places default attribution at bottom right without presentation-owned styles', async () => {
    await withReferencePage(async (page) => {
      const attributionPosition = await page.evaluate(() => {
        const wrapper = document.querySelector('.sample-presentation')!
        wrapper.classList.remove('sample-presentation')
        const bounds = document.querySelector('[data-presentation-attribution]')!.getBoundingClientRect()
        const result = { rightGap: innerWidth - bounds.right, bottomGap: innerHeight - bounds.bottom }
        wrapper.classList.add('sample-presentation')
        return result
      })
      expect(attributionPosition.rightGap).toBeLessThanOrEqual(1)
      expect(attributionPosition.bottomGap).toBeLessThanOrEqual(1)
    })
  }, 30_000)

  it('retains the reveal during reverse-navigation exit and removes it after settling', async () => {
    await withReferencePage(async (page) => {
      await page.locator('[data-presentation-progress]').last().click()
      await page.waitForTimeout(750)

      const observed = await page.evaluate(async () => {
        const continuing = document.querySelector('[data-layout-id="how-to-make-a-presentation:you"]')
        const scene = document.querySelector('[data-presentation-scene]')
        document.querySelector<HTMLButtonElement>('[data-presentation-prev]')!.click()
        await new Promise(requestAnimationFrame)
        return {
          step: document.querySelector('[data-presentation-root]')?.getAttribute('data-step-index'),
          revealPresent: Boolean(document.querySelector('.sample-reveal')),
          sameScene: scene === document.querySelector('[data-presentation-scene]'),
          sameEntity: continuing === document.querySelector('[data-layout-id="how-to-make-a-presentation:you"]'),
        }
      })
      expect(observed).toEqual({ step: '7', revealPresent: true, sameScene: true, sameEntity: true })
      await page.waitForFunction(() => !document.querySelector('.sample-reveal'), undefined, { timeout: 2000 })
      expect(await page.locator('[data-presentation-root]').getAttribute('data-step-index')).toBe('7')
    })
  }, 30_000)
})
