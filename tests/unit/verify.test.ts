import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import {
  VerifyFailure,
  checkRegistrySource,
  checkStepCount,
  checkStepIndex,
  compareStep,
  formatFailure,
  parseArgs,
  previewCommand,
  previewUrl,
  validateConfig,
} from '../../scripts/verify.mjs'

const step = { era: 'the ask', title: 'You have a topic', caption: 'It starts with you.' }

describe('parseArgs', () => {
  it('defaults to no config override and a full build', () => {
    expect(parseArgs([])).toEqual({ configPath: null, skipBuild: false })
  })

  it('accepts --config in both forms and --skip-build', () => {
    expect(parseArgs(['--config', 'a.json', '--skip-build'])).toEqual({ configPath: 'a.json', skipBuild: true })
    expect(parseArgs(['--config=b.json']).configPath).toBe('b.json')
  })

  it('rejects unknown arguments and a dangling --config', () => {
    expect(() => parseArgs(['--nope'])).toThrow(/unknown argument/)
    expect(() => parseArgs(['--config'])).toThrow(/requires a path/)
  })
})

describe('validateConfig', () => {
  const valid = { slug: 'talk-one', steps: [step] }

  it('accepts a well-formed step table', () => {
    expect(validateConfig(valid)).toBeNull()
  })

  it('rejects a non-object, a bad slug, and an empty or missing step list', () => {
    expect(validateConfig(null)).toMatch(/JSON object/)
    expect(validateConfig({ ...valid, slug: 'Bad Slug' })).toMatch(/slug/)
    expect(validateConfig({ ...valid, steps: [] })).toMatch(/non-empty array/)
    expect(validateConfig({ slug: 'talk-one' })).toMatch(/non-empty array/)
  })

  it('rejects a step missing era, title or caption, or with a blank value', () => {
    for (const key of ['era', 'title', 'caption']) {
      const broken = { ...step, [key]: '   ' }
      expect(validateConfig({ ...valid, steps: [step, broken] })).toBe(`config.steps[1].${key} must be a non-empty string`)
    }
    const noCaption = { era: step.era, title: step.title }
    expect(validateConfig({ ...valid, steps: [noCaption] })).toMatch(/steps\[0\]\.caption/)
  })
})

describe('checkRegistrySource', () => {
  const source = `
import type { PresentationEntry } from './registry'
export const presentations = [
  {
    slug: 'talk-one',
    title: 'One',
    load: () => import('./talk-one/Talk'),
  },
]`

  it('finds the slug and returns its lazy loader specifier', () => {
    expect(checkRegistrySource(source, 'talk-one')).toEqual({ error: null, loader: './talk-one/Talk' })
  })

  it('fails when the slug is not registered', () => {
    expect(checkRegistrySource(source, 'other').error).toMatch(/no entry with slug 'other'/)
  })

  it('fails when the entry has no lazy loader', () => {
    const eager = "export const presentations = [{ slug: 'talk-one', title: 'One', load: Talk }]"
    expect(checkRegistrySource(eager, 'talk-one').error).toMatch(/no lazy loader/)
  })
})

describe('checkStepCount and checkStepIndex', () => {
  it('accepts the expected count and reports a missing or wrong hook', () => {
    expect(checkStepCount(9, '9')).toBeNull()
    expect(checkStepCount(9, null)).toMatch(/missing data-step-count/)
    expect(checkStepCount(9, '8')).toMatch(/is 8, expected 9/)
    expect(checkStepCount(9, 'nine')).toMatch(/not an integer/)
  })

  it('matches the index hook against the expected index', () => {
    expect(checkStepIndex(3, '3')).toBeNull()
    expect(checkStepIndex(3, null)).toMatch(/missing data-step-index/)
    expect(checkStepIndex(3, '2')).toMatch(/expected 3/)
  })
})

describe('compareStep', () => {
  it('passes when title and browse caption match exactly', () => {
    expect(compareStep(step, { title: step.title, caption: step.caption })).toBeNull()
  })

  it('reports a title mismatch, a missing caption, and a caption mismatch', () => {
    expect(compareStep(step, { title: 'Other', caption: step.caption })).toMatch(/title is "Other"/)
    expect(compareStep(step, { title: step.title, caption: null })).toMatch(/not rendered/)
    expect(compareStep(step, { title: step.title, caption: 'Changed' })).toMatch(/caption is "Changed"/)
  })
})

describe('preview addressing', () => {
  it('builds URLs on the IPv4 loopback address only', () => {
    expect(previewUrl(4321)).toBe('http://127.0.0.1:4321/')
    expect(previewUrl(4321, '/talk')).toBe('http://127.0.0.1:4321/talk')
  })

  it('starts vite preview bound to 127.0.0.1 on the given port with strict port', () => {
    const { command, args } = previewCommand('/proj', 4321)
    expect(command).toBe(process.execPath)
    expect(args.slice(1)).toEqual(['preview', '--host', '127.0.0.1', '--port', '4321', '--strictPort'])
    expect(args[0]).toBe(path.join('/proj', 'node_modules', 'vite', 'bin', 'vite.js'))
  })
})

describe('formatFailure and VerifyFailure', () => {
  it('prints a phase, step index or dash, and message', () => {
    expect(formatFailure('transition', 4, 'ArrowRight did not advance')).toBe(
      'verify: FAIL phase=transition step=4 ArrowRight did not advance',
    )
    expect(formatFailure('build', null, 'npm run build failed')).toBe('verify: FAIL phase=build step=- npm run build failed')
  })

  it('carries phase and step on the error', () => {
    const error = new VerifyFailure('render', 2, 'boom')
    expect(error.phase).toBe('render')
    expect(error.step).toBe(2)
    expect(error.message).toBe('boom')
  })
})

describe('verify.config.json', () => {
  it('is a valid nine-step table with unique titles', () => {
    const config = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'scripts', 'verify.config.json'), 'utf8'))
    expect(validateConfig(config)).toBeNull()
    expect(config.steps).toHaveLength(9)
    expect(new Set(config.steps.map((s: { title: string }) => s.title)).size).toBe(9)
  })
})
