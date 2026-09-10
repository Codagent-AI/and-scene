import { expect, test } from 'vitest'
import { createFaultFixture, runVerification } from './verify-fault-fixture.mjs'

test('reports a malformed reference sample from an isolated checkout', async () => {
  const fixture = await createFaultFixture('missing-registration')
  try {
    const result = await runVerification(fixture)
    expect(result.code).not.toBe(0)
    expect(result.output).toContain('reference sample registration is missing')
  } finally {
    await fixture.cleanup()
  }
})

test('reports the offending browser step from an isolated runtime fault', async () => {
  const fixture = await createFaultFixture('runtime-error')
  try {
    const result = await runVerification(fixture)
    expect(result.code).not.toBe(0)
    expect(result.output).toContain('step 1: fixture runtime error')
  } finally {
    await fixture.cleanup()
  }
})

test('reports isolated build and stalled-transition faults as failures', async () => {
  const buildFixture = await createFaultFixture('build-error')
  const transitionFixture = await createFaultFixture('stalled-transition')
  try {
    const build = await runVerification(buildFixture)
    const transition = await runVerification(transitionFixture)
    expect(build.code).not.toBe(0)
    expect(build.output).toContain('npm run build exited')
    expect(transition.code).not.toBe(0)
    expect(transition.output).toContain('transition failed at step 2')
  } finally {
    await buildFixture.cleanup()
    await transitionFixture.cleanup()
  }
}, 15_000)
