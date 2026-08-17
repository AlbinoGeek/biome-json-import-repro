# `useImportExtensions` + `forceJsExtensions` rewrites already-extensioned non-script imports to `.js`

With `forceJsExtensions: true`, `useImportExtensions` rewrites the extension of relative
imports that **already carry a non-script extension** — `./data.json`, `./style.css` — to
`.js`. The resulting specifier does not resolve, and the fix is classified **safe**, so
`biome check --write` applies it without `--unsafe`.

This is a behaviour change in **2.2.5**. In 2.2.4 the same config on the same input left
those imports alone.

## Reproduce

```
npm install
npx biome lint cases.ts
```

`cases.ts`:

```ts
import { m } from "./mod.js";                         // already correct
import { m as m2 } from "./mod.ts";                   // -> ./mod.js   (intended)
import a from "./data.json" with { type: "json" };    // -> ./data.js  (bug)
import c from "./style.css";                          // -> ./style.js (bug)
```

## Expected

Only script extensions (`.ts`, `.tsx`, `.mts`, `.cts`) map to `.js`. Imports of `.json`,
`.css` and other non-script assets are left alone — which is what 2.2.4 did.

## Actual

```
cases.ts:3:15 lint/correctness/useImportExtensions  FIXABLE
  i Safe fix: Add import extension .js.
  - import a from "./data.json" with { type: "json" };
  + import a from "./data.js" with { type: "json" };
```

After `biome check --write`:

```
Error [ERR_MODULE_NOT_FOUND]: Cannot find module '.../data.js'
```

## Bisection

Same `cases.ts`, same `biome.json`, only the Biome version varies.

| version | `./mod` (no ext) | `./data.json` | `./style.css` |
| --- | --- | --- | --- |
| 2.1.4 | `-> ./mod.js` | untouched | untouched |
| 2.2.3 | `-> ./mod.js` | untouched | untouched |
| 2.2.4 | `-> ./mod.js` | untouched | untouched |
| **2.2.5** | `-> ./mod.js` | **`-> ./data.js`** | **`-> ./style.js`** |
| 2.3.0 | `-> ./mod.js` | `-> ./data.js` | `-> ./style.js` |
| 2.5.8 | `-> ./mod.js` | `-> ./data.js` | `-> ./style.js` |

`forceJsExtensions` was already present and working in 2.2.3/2.2.4 — those versions correctly
rewrote the extensionless `./mod` to `./mod.js`. What 2.2.5 added is rewriting imports that
already had a non-script extension.

## Why this is not a playground link

The rule only fires when the imported file actually resolves on disk — with the sibling files
removed, the diagnostic disappears. It also requires `forceJsExtensions`, and the playground's
linter panel exposes only rule presets and domains, not per-rule options. So neither half of
the setup can be expressed there.

## Workaround

`extensionMappings` covers the documented `"module": "node16"` use case and does not touch
non-script imports:

```json
{
  "linter": {
    "rules": {
      "correctness": {
        "useImportExtensions": {
          "level": "error",
          "options": { "extensionMappings": { "ts": "js", "tsx": "js" } }
        }
      }
    }
  }
}
```

With that config only `./mod.ts` is flagged; `./data.json` and `./style.css` are untouched.
