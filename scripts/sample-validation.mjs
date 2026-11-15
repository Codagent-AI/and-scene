export function validateSample(actual, expected) {
  if (actual.length !== expected.length) throw new Error('sample: missing or incorrect step count')
  for (let i = 0; i < expected.length; i++) {
    for (const key of ['id', 'era', 'title', 'caption']) if (actual[i][key] !== expected[i][key]) throw new Error(`sample: step ${i}: incorrect ${key}`)
  }
}
