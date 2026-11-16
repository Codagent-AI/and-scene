import { command } from './browser.mjs'
// One bounded broader run. Unit tests remain separate from slower process/browser tests.
await command('npm', ['test', '--', '--reporter=verbose'])
await command('npm', ['run', 'test:types'])
await command('npm', ['run', 'test:integration'])
