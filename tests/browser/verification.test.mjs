import assert from 'node:assert/strict'
import { cp, mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { test } from 'node:test'
import { disposableProject, npmScript, repository } from './project.mjs'

const sampleSlug = 'how-to-make-a-presentation'

function previewUrl(output) {
  return output.match(/^Production preview ready at (http:\/\/127\.0\.0\.1:\d+\/)$/m)?.[1]
}

async function assertPreviewStopped(url) {
  assert.ok(url, 'a preview started')
  await assert.rejects(fetch(url, { signal: AbortSignal.timeout(1_000) }), {
    message: 'fetch failed',
  })
}

test('E2E-001 reference presentation passes production verification', async (t) => {
  const { status, output } = await npmScript(repository, 'verify')
  assert.equal(status, 0, output)
  assert.match(output, /Build passed/)
  const url = previewUrl(output)
  assert.ok(url, output)
  assert.equal(output.includes(`Registered route ${url}${sampleSlug}`), true, output)
  const indices = [...output.matchAll(/^Rendered step \d+\/9 \(index (\d+)\)$/gm)].map((match) => Number(match[1]))
  assert.deepEqual(indices, [0, 1, 2, 3, 4, 5, 6, 7, 8])
  assert.match(output, /Verification passed for how-to-make-a-presentation/)
  await assertPreviewStopped(url)
  t.diagnostic(output.trim())
})

async function createVerificationCopy(t) {
  const root = await disposableProject(t)
  await mkdir(join(root, 'tests'))
  const files = [
    'index.html', 'package.json', 'package-lock.json', 'tsconfig.json',
    'tsconfig.app.json', 'tsconfig.node.json', 'vite.config.ts', 'scripts', 'src', 'public',
    'tests/fixtures',
  ]
  await Promise.all(files.map((file) => cp(join(repository, file), join(root, file), { recursive: true })))
  return root
}

async function update(root, file, edit) {
  const path = join(root, file)
  const original = await readFile(path, 'utf8')
  const edited = edit(original)
  assert.notEqual(edited, original, `fixture edit must change ${file}`)
  await writeFile(path, edited)
}

function appendMain(root, code) {
  return update(root, 'src/main.tsx', (source) => `${source}\n${code}\n`)
}

function faultOnSecondStep(root, fault) {
  return appendMain(root, `
    const watch = new MutationObserver(() => {
      if (document.querySelector('[data-presentation][data-step-index="1"]')) {
        watch.disconnect()
        ${fault}
      }
    })
    watch.observe(document.body, { attributes: true, childList: true, subtree: true })
  `)
}

async function alterSampleOutline(root) {
  const directory = join(root, 'src', 'presentations', sampleSlug)
  const files = (await readdir(directory, { recursive: true })).filter((file) => /\.tsx?$/.test(file))
  for (const file of files) {
    const relative = join('src', 'presentations', sampleSlug, file)
    const original = await readFile(join(root, relative), 'utf8')
    if (original.includes('You have a topic')) {
      await update(root, relative, (source) => source.replace('You have a topic', 'The skill interviews you'))
      return
    }
  }
  assert.fail('first title source was found')
}

test('E2E-002 verification failures are actionable and clean up preview processes', async (t) => {
  const faults = [
    {
      name: 'whole-application type/build error',
      inject: (root) => appendMain(root, "const typeFault: number = 'invalid'; console.log(typeFault)"),
      message: /Verification failed \[build\]: npm run build exited with \d+/,
      browser: false,
    },
    {
      name: 'missing reference registration',
      inject: (root) => update(root, 'src/presentations/index.ts', (source) =>
        source.replace(/(["'])how-to-make-a-presentation\1/, "'missing-reference'")),
      message: /Verification failed \[registration\]: missing registered route \/how-to-make-a-presentation/,
      browser: true,
    },
    {
      name: 'out-of-order reference title',
      inject: alterSampleOutline,
      message: /Verification failed \[reference outline step 1 \(index 0\)\]: reference outline mismatch for title/,
      browser: true,
    },
    {
      name: 'console error on a later step',
      inject: (root) => faultOnSecondStep(root, "console.error('fixture console fault')"),
      message: /Verification failed \[render step 2 \(index 1\)\]: console error: fixture console fault/,
      browser: true,
    },
    {
      name: 'uncaught page error on a later step',
      inject: (root) => faultOnSecondStep(root, "throw new Error('fixture page fault')"),
      message: /Verification failed \[render step 2 \(index 1\)\]: page error: fixture page fault/,
      browser: true,
    },
    {
      name: 'stalled step transition',
      inject: (root) => appendMain(root, `
        window.addEventListener('keydown', (event) => {
          if (event.key === 'ArrowRight') event.stopImmediatePropagation()
        }, true)
      `),
      message: /Verification failed \[render step 2 \(index 1\)\]:/,
      browser: true,
    },
  ]

  for (const { name, inject, message, browser } of faults) {
    await t.test(name, async (faultTest) => {
      const root = await createVerificationCopy(faultTest)
      await inject(root)
      const { status, output } = await npmScript(root, 'verify')
      assert.ok(status > 0, output)
      assert.match(output, message, output)
      assert.doesNotMatch(output, /Verification passed/)
      faultTest.diagnostic(output.match(/^Verification failed .*$/m)?.[0])
      if (browser) {
        await assertPreviewStopped(previewUrl(output))
      } else {
        assert.equal(previewUrl(output), undefined, output)
      }
    })
  }
})
