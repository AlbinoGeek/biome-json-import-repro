# `forceJsExtensions` rewrites `.json` and `.css` imports to `.js`

```
npm install
npx biome lint cases.ts
```

`./data.json` → `./data.js`, `./style.css` → `./style.js`, offered as a **safe** fix, so
`biome check --write` applies it and the imports stop resolving:

```
Error [ERR_MODULE_NOT_FOUND]: Cannot find module '.../data.js'
```

Only `.ts`/`.tsx` should map to `.js`.

Bisected, same `cases.ts` and `biome.json`, only the version varies:

```
2.1.4 .. 2.2.4   .json / .css untouched
2.2.5 .. 2.5.8   both rewritten to .js
```

Not the option landing: 2.2.4 already honoured `forceJsExtensions`, rewriting an
extensionless `./mod` to `./mod.js`. 2.2.5 added rewriting imports that already had a
non-script extension.

Same bug as #7734, closed once `extensionMappings` landed — `forceJsExtensions` itself
was never fixed.
