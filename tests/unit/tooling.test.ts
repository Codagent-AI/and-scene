import { describe, it, expect } from 'vitest'
import { scaffoldPlan, bootstrapPath, presentationPath } from '../../skills/presentation/scaffold-plan.mjs'
import { browserFailure } from '../../scripts/browser.mjs'
import { inspectPresentation } from '../../scripts/inspect-presentation.mjs'
describe('scaffold planning', () => {
  const directory = '/project'
  it('I-22 detects semantic anchors and skips complete scaffolds', () => {
    expect(scaffoldPlan({ directory, anchors: { build: true, kit: true, index: true }, nonEmpty: true }).missing).toEqual([])
  })
  it('I-23 plans all missing or just partial anchors without replacing present contracts', () => {
    expect(scaffoldPlan({ directory, anchors: {} }).missing).toEqual(['build', 'kit', 'index'])
    expect(scaffoldPlan({ directory, anchors: { build: true } }).missing).toEqual(['kit', 'index'])
    expect(scaffoldPlan({ directory, anchors: { kit: true, index: true } }).missing).toEqual(['build'])
  })
  it('I-26 resolves templates from skill location independent of caller', () => {
    expect(bootstrapPath).toMatch(/skills\/presentation\/templates\/bootstrap\/$/)
    expect(presentationPath).toMatch(/skills\/presentation\/templates\/presentation\/$/)
  })
  it('I-27 resolves standalone monorepo and existing nested apps', () => {
    expect(scaffoldPlan({ directory, anchors: {} }).target).toBe(directory)
    expect(scaffoldPlan({ directory, anchors: { build: true }, monorepo: true }).target).toBe('/project/presentations')
    expect(scaffoldPlan({ directory, anchors: { build: true }, monorepo: true }).missing).toContain('build')
    expect(scaffoldPlan({ directory, anchors: { build: true }, monorepo: true, existingApp: true }).target).toBe(directory)
  })
  it('I-28 requires confirmation before nonempty writes when kit or index missing', () => {
    expect(scaffoldPlan({ directory, anchors: {}, nonEmpty: true }).confirmationRequired).toBe(true)
    expect(scaffoldPlan({ directory, anchors: {} }).confirmationRequired).toBe(false)
    expect(scaffoldPlan({ directory, anchors: { build: true, kit: true, index: true }, nonEmpty: true }).confirmationRequired).toBe(false)
  })
})
describe('tooling failures', () => {
  it('I-49 classifies step browser faults actionably', () => { expect(browserFailure(4, ['console boom', 'page boom']).message).toBe('render step 4: console boom; page boom') })
  it('I-51 and I-52 reject unsafe slug and insufficient settle time', async () => {
    await expect(inspectPresentation({ slug: '../unsafe' })).rejects.toThrow('slug')
    await expect(inspectPresentation({ slug: 'valid', settleMs: 10 })).rejects.toThrow('at least 850')
  })
})
