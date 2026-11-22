import { existsSync } from "node:fs";
import {
  readFile,
  readdir,
  mkdir,
  copyFile,
  writeFile,
} from "node:fs/promises";
import { resolve, join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
export const templateRoot = fileURLToPath(
  new URL("../skills/presentation/templates/bootstrap/", import.meta.url),
);
export function resolveTarget(
  root,
  {
    anchors = [],
    workspaces = false,
    pnpm = false,
    packages = false,
    apps = false,
  } = {},
) {
  return anchors.includes("kit") ||
    anchors.includes("index") ||
    !(workspaces || pnpm || packages || apps)
    ? root
    : join(root, "presentations");
}
export async function scaffold(root, { anchors = [], confirmed = false } = {}) {
  root = resolve(root);
  const pkg = existsSync(join(root, "package.json"))
    ? JSON.parse(await readFile(join(root, "package.json"), "utf8"))
    : {};
  const target = resolveTarget(root, {
    anchors,
    workspaces: !!pkg.workspaces,
    pnpm: existsSync(join(root, "pnpm-workspace.yaml")),
    packages: existsSync(join(root, "packages")),
    apps: existsSync(join(root, "apps")),
  });
  if (anchors.length === 3) return { target, written: [] };
  if (
    (await readdir(root)).length &&
    (!anchors.includes("kit") || !anchors.includes("index")) &&
    !confirmed
  )
    throw new Error(`Confirm scaffold target before writes: ${target}`);
  const effectiveAnchors = target === root ? anchors : [];
  const written = [];
  async function copy(dir = "", dest = target) {
    for (const e of await readdir(join(templateRoot, dir), {
      withFileTypes: true,
    })) {
      const rel = join(dir, e.name);
      if (
        (effectiveAnchors.includes("kit") &&
          rel.startsWith("src/presentation-kit")) ||
        (effectiveAnchors.includes("index") &&
          rel.startsWith("src/presentations"))
      )
        continue;
      if (
        effectiveAnchors.includes("build") &&
        rel !== "src" &&
        !rel.startsWith("src/presentation-kit") &&
        !rel.startsWith("src/presentations") &&
        !rel.startsWith("scripts")
      )
        continue;
      const out = join(dest, rel);
      if (e.isDirectory()) {
        await mkdir(out, { recursive: true });
        await copy(rel, dest);
      } else if (!existsSync(out)) {
        await mkdir(dirname(out), { recursive: true });
        await copyFile(join(templateRoot, rel), out);
        written.push(rel);
      }
    }
  }
  await mkdir(target, { recursive: true });
  await copy();
  // A build anchor is preserved; dependencies required by missing anchors are additive.
  const manifest = join(target, "package.json");
  if (existsSync(manifest)) {
    const existing = JSON.parse(await readFile(manifest, "utf8"));
    const required = JSON.parse(
      await readFile(join(templateRoot, "package.json"), "utf8"),
    );
    for (const field of ["dependencies", "devDependencies"])
      existing[field] = { ...required[field], ...existing[field] };
    existing.scripts = { ...required.scripts, ...existing.scripts };
    await writeFile(manifest, JSON.stringify(existing, null, 2) + "\n");
  }
  return { target, written };
}
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const root = process.argv[2] || process.cwd();
  const anchors = (
    process.argv.find((a) => a.startsWith("--anchors="))?.slice(10) || ""
  )
    .split(",")
    .filter(Boolean);
  scaffold(root, { anchors, confirmed: process.argv.includes("--confirmed") })
    .then((r) => console.log(JSON.stringify(r, null, 2)))
    .catch((e) => {
      console.error(e.message);
      process.exitCode = 1;
    });
}
