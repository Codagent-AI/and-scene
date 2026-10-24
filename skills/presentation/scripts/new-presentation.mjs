#!/usr/bin/env node
// Creates and registers a new presentation from the presentation template.
//   node new-presentation.mjs <appDir> <slug> "<Title>"
import { createPresentation } from './lib.mjs'

const [appDir, slug, title] = process.argv.slice(2)
if (!appDir || !slug || !title) {
  console.error('usage: new-presentation.mjs <appDir> <slug> "<Title>"')
  process.exit(1)
}
try {
  const report = createPresentation(appDir, slug, title)
  console.log(JSON.stringify(report, null, 2))
} catch (err) {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
}
