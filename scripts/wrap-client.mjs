/**
 * Post-build wrapper for @deepseek-ai/dsh-client-ui-aqua.
 *
 * DSH client modules must register through `window.__ModuleLoader__.load({ id, factory })`
 * with CSS injected at runtime as `<style data-plugin-css>` tags. tsdown emits plain ESM
 * (`lib/client.mjs`) plus an externalized `lib/style.css`, so this script converts the
 * output into the ModuleLoader bundle the host expects (`lib/client.js`).
 *
 * Steps:
 *  1. Strip the `import './style.css';` side-effect import.
 *  2. Convert the static ESM imports into `require()` destructuring.
 *  3. Convert the named `export { ... }` into `exports.*` assignments.
 *  4. Inline `lib/style.css` as a `\0dsh-css:` region injected via a <style> tag.
 *  5. Wrap everything in `window.__ModuleLoader__.load({...})`.
 *  6. Rename `lib/index.mjs` / `lib/invariant.mjs` to `.js` (they are plain ESM and
 *     the package is `"type": "module"`, so the `.js` extension is correct).
 *
 * Usage: `node scripts/wrap-client.mjs` (run after `tsdown`).
 */
import { readFileSync, writeFileSync, renameSync, existsSync, rmSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const libDir = join(root, 'lib')
const PACKAGE_ID = '@deepseek-ai/dsh-client-ui-aqua'

const srcPath = join(libDir, 'client.mjs')
const cssPath = join(libDir, 'style.css')
const outPath = join(libDir, 'client.js')

let code = readFileSync(srcPath, 'utf8')
const css = [
  // The bundler tree-shakes side-effect-only CSS imports (the global theme
  // stylesheet and the @font-face sheet export nothing JS consumes), so their
  // content never reaches lib/style.css. Inlining them here restores it.
  join(root, 'src/client/aqua.module.css'),
  join(root, 'src/client/fonts.module.css'),
  cssPath,
]
  .map((p) => readFileSync(p, 'utf8'))
  .join('\n')

/** Convert a static named-import statement into require + destructuring. */
const importDecl = (spec, names) => {
  const key = spec.replace(/[^a-zA-Z0-9]+/g, '_')
  return `let ${key} = require(${JSON.stringify(spec)});\nlet ${names} = ${key};`
}

// Generic transform: every top-level `import { names } from "spec";` becomes
// `let <key> = require("spec"); let { names } = <key>;`. Side-effect imports
// are dropped (the only one is './style.css', whose content we inline below).
code = code.replace(/^import '[^']+';\r?\n?/gm, '').replace(
  /^import \{([^}]+)\} from "([^"]+)";\r?\n?/gm,
  (_m, names, spec) => importDecl(spec, `{${names}}`) + '\n',
)

code = code.replace(/^export \{ apply, inject \};\r?\n?$/m, 'exports.apply = apply;\nexports.inject = inject;')

if (/^import |^export /m.test(code)) {
  throw new Error(
    'wrap-client.mjs: leftover ESM import/export statements — update the replacement table:\n' +
      (code.match(/^(import|export) .*$/gm) ?? []).join('\n'),
  )
}

const cssLiteral = '`' + css.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${') + '`'

const cssRegion = `//#region \\0dsh-css:style.css
const css$0 = ${cssLiteral};
const tagId$0 = "${PACKAGE_ID}/style.css";
if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$0) + "]") === null) {
	const tag = document.createElement("style");
	tag.dataset.plugin = "${PACKAGE_ID}";
	tag.dataset.pluginCss = tagId$0;
	tag.textContent = css$0;
	document.head.appendChild(tag);
}
//#endregion
`

const bundle = `window.__ModuleLoader__.load({
	id: ${JSON.stringify(PACKAGE_ID)},
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
${cssRegion}${code}
		return module.exports;
	}
});
`

writeFileSync(outPath, bundle, 'utf8')

// Plain-ESM side entries: .mjs -> .js so package.json exports resolve.
for (const entry of ['index', 'invariant']) {
  const from = join(libDir, `${entry}.mjs`)
  const to = join(libDir, `${entry}.js`)
  if (existsSync(from)) renameSync(from, to)
}

// Intermediates no longer needed.
rmSync(srcPath, { force: true })

console.log(`wrap-client: wrote ${outPath}`)
