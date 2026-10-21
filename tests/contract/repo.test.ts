import { execFileSync } from 'node:child_process'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { ROOT, TEMPLATE, TEST_FILE, json, rel, text, walk } from './helpers'

const git = (...args: string[]) => execFileSync('git', args, { cwd: ROOT, encoding: 'utf8' })
const nonTest = (files: string[]) => files.filter((f) => !TEST_FILE.test(f))

async function expectMirrored(dir: string) {
  const canonical = nonTest(await walk(path.join(ROOT, dir)))
  const copy = nonTest(await walk(path.join(TEMPLATE, dir)))
  expect(rel(TEMPLATE, copy), `${dir}: missing or extra files in the template`).toEqual(rel(ROOT, canonical))
  for (const file of canonical) {
    const twin = path.join(TEMPLATE, path.relative(ROOT, file))
    expect(await text(twin), `${path.relative(ROOT, file)} drifted from its template copy`).toBe(await text(file))
  }
}

describe('template parity', () => {
  it('keeps every non-test scene-kit file byte-identical to the bootstrap copy', async () => {
    await expectMirrored('src/presentation-kit')
  })

  it('keeps the verification and inspection scripts and their helpers byte-identical', async () => {
    await expectMirrored('scripts/lib')
    for (const file of ['scripts/verify.mjs', 'scripts/inspect-presentation.mjs']) {
      expect(await text(path.join(TEMPLATE, file)), file).toBe(await text(path.join(ROOT, file)))
    }
  })

  it('keeps the shared host files aligned', async () => {
    for (const file of ['src/Router.tsx', 'src/Landing.tsx', 'src/routes.ts', 'src/main.tsx', 'src/index.css', 'tsconfig.json', 'tsconfig.app.json', 'tsconfig.node.json', 'vite.config.ts', 'index.html', 'public/favicon.svg']) {
      expect(await text(path.join(TEMPLATE, file)), file).toBe(await text(path.join(ROOT, file)))
    }
  })

  it('differs only in configuration: the root requires the sample, the template its starter', async () => {
    const root = await json(path.join(ROOT, 'scripts/verify.config.json'))
    const template = await json(path.join(TEMPLATE, 'scripts/verify.config.json'))
    expect(root.sample.slug).toBe('how-to-make-a-presentation')
    expect(root.sample.steps).toHaveLength(9)
    expect(template).toEqual({ sample: null })
  })

  it('keeps the template dependencies at least as complete as the root runtime set', async () => {
    const root = await json(path.join(ROOT, 'package.json'))
    const template = await json(path.join(TEMPLATE, 'package.json'))
    expect(template.dependencies).toEqual(root.dependencies)
    for (const name of Object.keys(root.devDependencies).filter((n) => !/vitest|jsdom|testing-library|pngjs/.test(n))) {
      expect(template.devDependencies, name).toHaveProperty(name)
      expect(template.devDependencies[name], name).toBe(root.devDependencies[name])
    }
  })
})

describe('verification timing', () => {
  it('waits longer per step than the slowest kit entrance, so late errors are attributed', async () => {
    const constants = await text(path.join(ROOT, 'src/presentation-kit/constants.ts'))
    const num = (name: string) => Number(new RegExp(`export const ${name} = ([0-9.]+)`).exec(constants)![1])
    const entrance = (num('ENTER_DELAY') + num('ENTER_T')) * 1000
    const settle = Number(/const SETTLE_MS = (\d+)/.exec(await text(path.join(ROOT, 'scripts/verify.mjs')))![1])
    expect(settle).toBeGreaterThan(entrance)
  })
})

describe('npm scripts', () => {
  it('keeps npm test to the fast unit and contract projects', async () => {
    const pkg = await json(path.join(ROOT, 'package.json'))
    expect(pkg.scripts.test).toBe('vitest run')
    const unit = await text(path.join(ROOT, 'vitest.config.ts'))
    expect(unit).not.toContain('tests/integration')
    const integration = await text(path.join(ROOT, 'vitest.integration.config.ts'))
    expect(integration).toContain("include: ['tests/integration/**/*.test.ts']")
    expect(pkg.scripts['test:integration']).toBe('vitest run --config vitest.integration.config.ts')
    for (const name of ['verify', 'inspect', 'build', 'lint']) expect(pkg.scripts).toHaveProperty(name)
  })

  it('starts no browser or server from the unit tests', async () => {
    const files = [...(await walk(path.join(ROOT, 'src'))), ...(await walk(path.join(ROOT, 'scripts'))), ...(await walk(path.join(ROOT, 'skills/presentation/scripts')))]
    for (const file of files.filter((f) => TEST_FILE.test(f))) {
      expect(await text(file), file).not.toMatch(/chromium\.launch|launchBrowser|startPreview|spawn\(\s*['"]npm['"]/)
    }
  })
})

describe('repository hygiene', () => {
  const generated = [
    'dist/index.html', 'node_modules/x', '.presentation-inspect/how-to-make-a-presentation/step-01.png',
    'skills/presentation/templates/bootstrap/dist/x', 'skills/presentation/templates/bootstrap/node_modules/x',
    'skills/presentation/templates/bootstrap/.presentation-inspect/a/step-01.png',
  ]
  it.each(generated)('ignores generated path %s', (file) => {
    expect(() => git('check-ignore', '-q', file)).not.toThrow()
  })

  it('tracks no generated output, dependency directories or inspection screenshots', () => {
    const tracked = git('ls-files').split('\n')
    expect(tracked.filter((f) => /(^|\/)(dist|node_modules|\.presentation-inspect)\//.test(f))).toEqual([])
  })

  it('adds no hosted CI configuration', () => {
    const tracked = git('ls-files').split('\n')
    expect(tracked.filter((f) => /^\.github\/workflows\/|^\.gitlab-ci|^\.circleci\/|^azure-pipelines|^Jenkinsfile/.test(f))).toEqual([])
  })
})
