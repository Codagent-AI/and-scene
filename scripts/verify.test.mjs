import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'
import { OUTLINE } from '../src/presentations/how-to-make-a-presentation/outline'
import {
  EXPECTED_SAMPLE,
  SAMPLE_SLUG,
  checkRegistration,
  describeStep,
  formatFailure,
  parseArgs,
  parseRegisteredSlugs,
  parseVerifyConfig,
  readVerifyConfig,
} from './verify.mjs'

describe('verify pure helpers', () => {
  it('expects the nine normative steps in order', () => {
    expect(EXPECTED_SAMPLE).toHaveLength(9)
    expect(EXPECTED_SAMPLE.map((row) => row.title)).toEqual(OUTLINE.map((row) => row.title))
    expect(EXPECTED_SAMPLE.map((row) => row.caption)).toEqual(OUTLINE.map((row) => row.caption))
  })

  it('detects the sample slug only as a registry entry', () => {
    const registry = `export const presentations = [\n  {\n    slug: '${SAMPLE_SLUG}',\n    title: 'x',\n  },\n]`
    expect(checkRegistration(registry, SAMPLE_SLUG)).toBe(true)
    expect(checkRegistration('// removed: slug: "how-to-make-a-presentation"', SAMPLE_SLUG)).toBe(false)
    expect(checkRegistration(`slug: 'other-talk'`, SAMPLE_SLUG)).toBe(false)
  })

  it('numbers steps 1-based and keeps the 0-based index', () => {
    expect(describeStep(2)).toBe('step 3 (index 2)')
    expect(formatFailure('render', 'boom', 0)).toBe('FAIL [render] step 1 (index 0): boom')
    expect(formatFailure('build', 'npm run build failed')).toBe('FAIL [build] npm run build failed')
  })

  it('parses --root in both forms and rejects unknown arguments', () => {
    expect(parseArgs(['--root', '/tmp/app']).root).toBe('/tmp/app')
    expect(parseArgs(['--root=/tmp/app']).root).toBe('/tmp/app')
    expect(parseArgs([]).root).toBe(process.cwd())
    expect(() => parseArgs(['--bogus'])).toThrow(/unknown argument/)
  })
})

describe("registry slug parsing", () => {
  it("returns every registered slug in order, without duplicates", () => {
    const source = [
      "export const presentations = [",
      "  { slug: 'first-talk', title: 'A', load: () => import('./a') },",
      "  {",
      "    slug: \"second-talk\",",
      "    title: 'B',",
      "  },",
      "  { slug: 'first-talk', title: 'dup', load: () => import('./a') },",
      "]",
    ].join("\n");
    expect(parseRegisteredSlugs(source)).toEqual(["first-talk", "second-talk"]);
  });

  it("ignores commented-out registrations", () => {
    const source = [
      "// slug: 'gone'",
      "/* slug: 'also-gone' */",
      "export const presentations = []",
    ].join("\n");
    expect(parseRegisteredSlugs(source)).toEqual([]);
  });

  it("returns no slugs for an empty registry", () => {
    expect(parseRegisteredSlugs("export const presentations: readonly PresentationEntry[] = []")).toEqual([]);
  });
});

describe("verify.config.json", () => {
  it("defaults to sample required when the object omits sample", () => {
    expect(parseVerifyConfig("{}")).toEqual({ sample: true });
    expect(parseVerifyConfig('{"sample": true}')).toEqual({ sample: true });
    expect(parseVerifyConfig('{"sample": false}')).toEqual({ sample: false });
  });

  it("rejects malformed JSON, non-object JSON and non-boolean sample values", () => {
    expect(() => parseVerifyConfig("{")).toThrow(/not valid JSON/);
    expect(() => parseVerifyConfig("[]")).toThrow(/must contain a JSON object/);
    expect(() => parseVerifyConfig('{"sample": "no"}')).toThrow(/"sample" must be true or false/);
  });

  describe("readVerifyConfig", () => {
    const dirs = [];
    afterAll(() => {
      for (const dir of dirs) rmSync(dir, { recursive: true, force: true });
    });
    const projectWith = (contents) => {
      const dir = mkdtempSync(join(tmpdir(), "verify-config-"));
      dirs.push(dir);
      if (contents !== undefined) writeFileSync(join(dir, "verify.config.json"), contents);
      return dir;
    };

    it("treats an absent file as sample required (the repository default)", () => {
      expect(readVerifyConfig(projectWith())).toEqual({ sample: true });
    });

    it("reads sample false from the project root", () => {
      expect(readVerifyConfig(projectWith('{"sample": false}'))).toEqual({ sample: false });
    });

    it("fails a present but malformed file as the config phase", () => {
      expect(() => readVerifyConfig(projectWith("nope"))).toThrow(/not valid JSON/);
    });
  });
});
