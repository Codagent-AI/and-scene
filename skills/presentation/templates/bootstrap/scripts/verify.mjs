// Build the whole app, then render every configured presentation in Chromium
// against a production preview on 127.0.0.1. Exits non-zero on any failure.
import { readConfig, projectRoot } from './lib/config.mjs'
import { formatFailure, formatPass } from './lib/report.mjs'
import { runVerify } from './lib/verify-core.mjs'

try {
  const config = await readConfig()
  const results = await runVerify({ root: projectRoot, config })
  console.log(formatPass(results))
  process.exitCode = 0
} catch (err) {
  console.error(formatFailure(err))
  process.exitCode = 1
}
