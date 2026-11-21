import assert from 'node:assert/strict'
import { cp, mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { test } from 'node:test'
import { inflateSync } from 'node:zlib'
import { disposableProject, npmScript, repository } from './project.mjs'

const testApp = `
const host = document.querySelector('main')
if (location.pathname === '/') {
  host.innerHTML = '<a href="/inspection-fixture">Inspection fixture</a>'
} else {
  host.setAttribute('data-presentation', '')
  host.setAttribute('data-step-count', '2')
  const mark = (color) => {
    document.body.style.background = color
  }
  const place = (text, x, y) =>
    '<span style="position:absolute;left:' + x + 'px;top:' + y + 'px">' + text + '</span>'
  function render(index) {
    host.setAttribute('data-step-index', String(index))
    host.innerHTML = [
      place('Collision Alpha', 140, 100),
      index === 0 ? place('Collision Beta', 145, 102) : '',
      '<section data-presentation-allow-overlap>' +
        place('Intentional Alpha', 140, 150) + place('Intentional Beta', 145, 152) + '</section>',
      '<div style="position:absolute;left:300px;top:220px">' +
        '<button data-presentation-progress-item data-presentation-active="true"' +
        (index === 1 ? ' style="font-weight:bold"' : '') + '>1</button>' +
        '<button data-presentation-progress-item>2</button></div>',
      '<a href="https://github.com/Codagent-AI/and-scene" data-presentation-attribution ' +
        'style="position:absolute;right:12px;bottom:12px;' +
        (index === 0 ? 'font-size:8px' : 'font-size:14px;color:#182d2a') + '">made by and-scene</a>',
    ].join('')
    if (index === 1) {
      mark('#d01000')
      setTimeout(() => mark('#10a020'), 110)
    }
  }
  render(0)
  window.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowRight') render(1)
  })
}
`

async function materializeFixture(t) {
  const root = await disposableProject(t)
  await cp(join(repository, 'scripts'), join(root, 'scripts'), { recursive: true })
  await writeFile(join(root, 'package.json'), JSON.stringify({
    private: true, type: 'module', scripts: {
      build: 'vite build',
      inspect: 'node scripts/inspect-presentation.mjs',
    },
  }))
  await writeFile(join(root, 'index.html'), `<!doctype html>
<html lang="en"><head><meta charset="UTF-8"><link rel="icon" href="data:,"></head>
<body><main style="min-height:100vh"></main><script type="module" src="/fixture.mjs"></script></body></html>`)
  await writeFile(join(root, 'fixture.mjs'), testApp)
  return root
}

function pngDetails(content) {
  assert.equal(content.subarray(1, 4).toString(), 'PNG')
  const width = content.readUInt32BE(16)
  const height = content.readUInt32BE(20)
  assert.equal(content[24], 8, '8-bit screenshot channels')
  assert.ok([2, 6].includes(content[25]), 'RGB or RGBA screenshot')

  const imageData = []
  for (let offset = 8; offset < content.length;) {
    const length = content.readUInt32BE(offset)
    if (content.toString('ascii', offset + 4, offset + 8) === 'IDAT') {
      imageData.push(content.subarray(offset + 8, offset + 8 + length))
    }
    offset += length + 12
  }

  // All PNG filters leave the first pixel's RGB bytes unchanged because it has no neighbors.
  const rgb = [...inflateSync(Buffer.concat(imageData)).subarray(1, 4)]
  return { width, height, rgb }
}

test('INT-002 screenshot helper emits settled artifacts and advisory warnings', async (t) => {
  const root = await materializeFixture(t)
  const directory = join(root, 'artifacts', 'presentations', 'inspection-fixture', '1440x900')
  await mkdir(directory, { recursive: true })
  await writeFile(join(directory, 'step-09.png'), 'stale')
  const result = await npmScript(root, 'inspect', ['--', 'inspection-fixture', '--settle-ms', '200'])
  assert.equal(result.status, 0, result.output)
  t.diagnostic(result.output.split('\n').filter((line) => /^(Captured step|Step \d+ warning)/.test(line)).join('\n'))

  await t.test('captures all steps at the standard viewport after the configured settle interval', async () => {
    const names = await readdir(directory)
    assert.deepEqual(names.sort(), ['step-01.png', 'step-02.png'])
    for (const name of names) {
      const { width, height } = pngDetails(await readFile(join(directory, name)))
      assert.deepEqual({ width, height }, { width: 1440, height: 900 })
    }
    const { rgb } = pngDetails(await readFile(join(directory, 'step-02.png')))
    assert.deepEqual(rgb, [16, 160, 32], 'the delayed visual update is in the actual screenshot')
    assert.match(result.output, /Captured step 2 after 200ms/)
  })

  await t.test('warns on an unmarked collision and honors the explicit overlap subtree', () => {
    assert.match(result.output, /Step 1 warning: overlap between text "Collision Alpha" and text "Collision Beta"/)
    assert.doesNotMatch(result.output, /warning:.*Intentional (Alpha|Beta)/)
    assert.doesNotMatch(result.output, /Step 2 warning: overlap/)
  })

  await t.test('warns about active chrome and attribution without failing inspection', () => {
    assert.match(result.output, /Step 1 warning: indistinct active progress indicator/)
    assert.match(result.output, /Step 1 warning: undersized attribution .*\[data-presentation-attribution\]/)
    assert.match(result.output, /Step 1 warning: browser-default attribution/)
    assert.doesNotMatch(result.output, /Step 2 warning:/)
  })
})
