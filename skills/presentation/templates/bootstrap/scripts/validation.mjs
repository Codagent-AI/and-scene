export function validateOutline(actual, expected) {
  if (!actual || actual.length !== expected.length)
    throw new Error('sample outline has incorrect step count')
  expected.forEach((step, index) => {
    for (const key of ['id', 'era', 'title', 'caption']) {
      if (actual[index][key] !== step[key])
        throw new Error(`sample outline mismatch at step ${index}: ${key}`)
    }
  })
}
export function assertNoErrors(errors, step) {
  if (errors.length)
    throw new Error(`render failed at step ${step}: ${errors.join('; ')}`)
}
