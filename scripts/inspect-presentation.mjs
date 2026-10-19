#!/usr/bin/env node
// Per-step screenshots and advisory visual diagnostics: `npm run inspect -- <slug>`.
import { chromium } from 'playwright'
import { runInspect } from './lib/inspect-run.mjs'
import { projectRoot, readRegistry, runBuild, startPreview } from './lib/preview.mjs'

const code = await runInspect(process.argv.slice(2), {
  root: projectRoot(import.meta.url),
  log: (message) => console.log(`[inspect] ${message}`),
  error: (message) => console.error(message),
  build: runBuild,
  startPreview,
  launchBrowser: () => chromium.launch(),
  readRegistry,
})
process.exit(code)
