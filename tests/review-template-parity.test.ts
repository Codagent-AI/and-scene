import { readFileSync } from 'node:fs'
import { expect, it } from 'vitest'
it.each(['scripts/browser.mjs', 'scripts/diagnostics.mjs', 'src/main.tsx', 'src/PresentationErrorBoundary.tsx'])('review fixes keep bootstrap bytes aligned: %s', file => {
  expect(readFileSync(`skills/presentation/templates/bootstrap/${file}`, 'utf8')).toBe(readFileSync(file, 'utf8'))
})
