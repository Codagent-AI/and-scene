import { existsSync, mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterAll, describe, expect, it } from 'vitest'
import { OUTLINE } from '../src/presentations/how-to-make-a-presentation/outline'
import {
  EXPECTED_SAMPLE,
  SAMPLE_SLUG,
  VerifyFailure,
  checkRegistration,
  describeStep,
  formatFailure,
  parseArgs,
  parseRegisteredSlugs,
  parseVerifyConfig,
  readVerifyConfig,
  renderFailure,
  renderTargets,
  startPreview,
  stopPreview,
  waitReady,
} from './verify.mjs'

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const scratch = []
afterAll(() => {
  for (const dir of scratch) rmSync(dir, { recursive: true, force: true })
})

function projectWith({ config, registry } = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'verify-unit-'))
  scratch.push(dir)
  mkdirSync(join(dir, 'src', 'presentations'), { recursive: true })
  if (registry !== undefined) writeFileSync(join(dir, 'src', 'presentations', 'index.ts'), registry)
  if (config !== undefined) writeFileSync(join(dir, 'verify.config.json'), config)
  return dir
}

describe('verify pure helpers', () => {
  it('expects the nine normative steps in order', () => {
    expect(EXPECTED_SAMPLE).toHaveLength(9)
    expect(EXPECTED_SAMPLE.map((row) => row.title)).toEqual(OUTLINE.map((row) => row.title))
    expect(EXPECTED_SAMPLE.map((row) => row.caption)).toEqual(OUTLINE.map((row) => row.caption))
  })

  it('detects the sample slug only as a registry entry', () => {
    const registry = `export const presentations = [\n  {\n    slug: '${SAMPLE_SLUG}',\n    title: 'x',\n  },\n]`
    expect(checkRegistration(registry, SAMPLE_SLUG)).toBe(true)
    expect(checkRegistration('// removed: slug: "how-to-make-a-presentation"', SAMPLE_SLUG)).toBe(false)
    expect(checkRegistration(`slug: 'other-talk'`, SAMPLE_SLUG)).toBe(false)
  })

  it('numbers steps 1-based and keeps the 0-based index', () => {
    expect(describeStep(2)).toBe('step 3 (index 2)')
    expect(formatFailure('render', 'boom', 0)).toBe('FAIL [render] step 1 (index 0): boom')
    expect(formatFailure('build', 'npm run build failed')).toBe('FAIL [build] npm run build failed')
  })

  it('parses --root in both forms and rejects unknown arguments', () => {
    expect(parseArgs(['--root', '/tmp/app']).root).toBe('/tmp/app')
    expect(parseArgs(['--root=/tmp/app']).root).toBe('/tmp/app')
    expect(parseArgs([]).root).toBe(process.cwd())
    expect(() => parseArgs(['--bogus'])).toThrow(/unknown argument/)
  })
})

describe('registry slug parsing', () => {
  it('returns every registered slug in order, without duplicates', () => {
    const source = [
      "export const presentations = [",
      "  { slug: 'first-talk', title: 'A', load: () => import('./a') },",
      "  {",
      '    slug: "second-talk",',
      "    title: 'B',",
      "  },",
      "  { slug: 'first-talk', title: 'dup', load: () => import('./a') },",
      "]",
    ].join('\n')
    expect(parseRegisteredSlugs(source)).toEqual(['first-talk', 'second-talk'])
  })

  it('ignores commented-out registrations', () => {
    const source = ["// slug: 'gone'", "/* slug: 'also-gone' */", 'export const presentations = []'].join('\n')
    expect(parseRegisteredSlugs(source)).toEqual([])
  })

  it('returns no slugs for an empty registry', () => {
    expect(parseRegisteredSlugs('export const presentations: readonly PresentationEntry[] = []')).toEqual([])
  })
})

describe('empty registry in registry mode', () => {
  it('fails naming sample without any subprocess', () => {
    const dir = projectWith({ registry: 'export const presentations = []\n' })
    let caught
    try {
      renderTargets(dir, { sample: false })
    } catch (err) {
      caught = err
    }
    expect(caught).toBeInstanceOf(VerifyFailure)
    expect(caught.phase).toBe('sample')
    expect(formatFailure(caught.phase, caught.message, caught.index)).toMatch(/^FAIL \[sample\] no presentations registered/)
  })

  it('lists the registered slugs when sample is off', () => {
    const dir = projectWith({
      registry: "export const presentations = [{ slug: 'alpha', title: 'A', load: () => import('./a') }]\n",
    })
    expect(renderTargets(dir, { sample: false })).toEqual(['alpha'])
    expect(renderTargets(dir, { sample: true })).toEqual([SAMPLE_SLUG])
  })
})

describe('render failure reporting', () => {
  it('reports the captured error at the failing step, preferring the page error', () => {
    const failure = renderFailure(['console.error: noisy', 'pageerror: boom'], 4, 'fallback')
    expect(failure.phase).toBe('render')
    expect(formatFailure(failure.phase, failure.message, failure.index)).toBe(
      'FAIL [render] step 5 (index 4): pageerror: boom (and 1 more)',
    )
  })

  it('falls back to the given message, still at the step, when nothing was captured', () => {
    const failure = renderFailure([], 0, 'no presentation rendered at http://127.0.0.1:1/x')
    expect(formatFailure(failure.phase, failure.message, failure.index)).toBe(
      'FAIL [render] step 1 (index 0): no presentation rendered at http://127.0.0.1:1/x',
    )
  })
})

describe('preview startup', () => {
  it('a missing binary emits error without exit: startup completes and reports the spawn failure', async () => {
    const dir = projectWith()
    const preview = startPreview(join(dir, 'does-not-exist', 'vite'), dir, 1)
    await expect(preview.exited).resolves.toBeDefined()
    expect(preview.spawnError).toBeTruthy()
    await expect(waitReady(preview, 'http://127.0.0.1:1')).rejects.toThrow(/could not start vite preview/)
    await expect(stopPreview(preview)).resolves.toBeUndefined()
  })
})

describe('verify.config.json parsing (strict)', () => {
  it('accepts exactly {"sample": false}', () => {
    expect(parseVerifyConfig('{"sample": false}')).toEqual({ sample: false })
  })

  it('rejects unknown keys', () => {
    expect(() => parseVerifyConfig('{"sample": false, "extra": 1}')).toThrow(/unknown key\(s\): extra/)
    expect(() => parseVerifyConfig('{"other": true}')).toThrow(/unknown key\(s\): other/)
  })

  it('rejects sample: null', () => {
    expect(() => parseVerifyConfig('{"sample": null}')).toThrow(/"sample" must be the boolean false \(got null\)/)
  })

  it('rejects sample: true', () => {
    expect(() => parseVerifyConfig('{"sample": true}')).toThrow(/"sample" must be the boolean false \(got true\)/)
  })

  it('rejects other types for sample', () => {
    expect(() => parseVerifyConfig('{"sample": "false"}')).toThrow(/must be the boolean false/)
    expect(() => parseVerifyConfig('{"sample": 0}')).toThrow(/must be the boolean false/)
    expect(() => parseVerifyConfig('{"sample": []}')).toThrow(/must be the boolean false/)
  })

  it('rejects a file that does not set sample', () => {
    expect(() => parseVerifyConfig('{}')).toThrow(/must set "sample": false/)
  })

  it('rejects malformed JSON and non-object JSON', () => {
    expect(() => parseVerifyConfig('{')).toThrow(/not valid JSON/)
    expect(() => parseVerifyConfig('[]')).toThrow(/must contain a JSON object/)
    expect(() => parseVerifyConfig('null')).toThrow(/must contain a JSON object/)
  })
});

describe('readVerifyConfig', () => {
  it('treats an absent file as sample required (the repository default)', () => {
    expect(readVerifyConfig(projectWith())).toEqual({ sample: true })
  })

  it('reads sample false from the project root', () => {
    expect(readVerifyConfig(projectWith({ config: '{"sample": false}' }))).toEqual({ sample: false })
  })

  it('fails a present but invalid file as the config phase', () => {
    expect(() => readVerifyConfig(projectWith({ config: 'nope' }))).toThrow(/not valid JSON/)
  })
})

describe('contract: the canonical repository always requires the sample', () => {
  it('has no verify.config.json at the repository root', () => {
    expect(existsSync(join(REPO_ROOT, 'verify.config.json'))).toBe(false)
  })
})
