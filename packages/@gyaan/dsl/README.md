# @gyaan/dsl

The **contract keystone** of the GYAAN SDK family. `@gyaan/dsl` is *pure spec* — the
slide object-model types, (planned) JSON Schema, pure validators / type-guards,
and version/migration helpers — with **zero runtime dependencies** (no React, no
pptx, no echarts).

That purity is the whole point: the renderer, the importer, and any future
package can depend on `@gyaan/dsl` without pulling in junk.

## Dependency arrows (acyclic)

```
@gyaan/dsl       ->  (nothing)
@gyaan/renderer  ->  @gyaan/dsl
@gyaan/importer  ->  @gyaan/dsl
@gyaan/exporter  ->  @gyaan/dsl     (reserved, future)
```

`@gyaan/dsl` is the only package everything else depends on, and it depends on
nothing.

## What's in here

| Module        | Contents                                                            |
| ------------- | ------------------------------------------------------------------- |
| `slides.ts`   | The slide object model: `Slide`, `PPTElement` and all variants, theme, background, animation, table/chart/code types, plus `ElementTypes` / `ShapePathFormulasKeys` enums. |
| `guards.ts`   | Pure discriminant type-guards (`isTextElement`, …) and `PPT_ELEMENT_TYPES`. |
| `version.ts`  | `DSL_VERSION` + the `DslMigration` shape and (empty) migration registry. |

```ts
import type { Slide, PPTElement } from '@gyaan/dsl';
import { isTextElement, DSL_VERSION } from '@gyaan/dsl';
```

## Status

Both consumers are now wired to `@gyaan/dsl` and no longer vendor their own copy
of the slide types:

- **`@gyaan/importer`**: imports all slide types from `@gyaan/dsl`; vendored
  `gyaan/types/slides.ts` deleted. The importer emits complete DSL `Slide`
  objects directly (the old partial "draft slide" + post-fill step is gone).
- **`@gyaan/renderer`**: imports all slide types from `@gyaan/dsl`; vendored
  `types/slides.ts` deleted. `@gyaan/dsl` is a regular dependency, kept external
  in the rollup build so consumers share one copy. The public
  `@gyaan/renderer/types` surface now re-exports the DSL types.

### Roadmap

- [x] Wire `@gyaan/importer` to import types from `@gyaan/dsl` (vendored copy deleted).
- [x] Wire `@gyaan/renderer` to import types from `@gyaan/dsl` (vendored copy deleted).
- [ ] Add the JSON Schema for the slide contract + a pure schema validator.
- [ ] Promote the `stage` / `scene` / `scene-content` types into the DSL (these
      currently live in `lib/types/stage.ts` and carry deps on `Action`, PBL,
      Widgets, generation types — those pure types need migrating too).
- [ ] Reserve `@gyaan/exporter` as the 4th family member.

## Divergence reconciled (seed provenance)

The seed is the app's `lib/types/slides.ts`, but before this package existed the
contract had been copy-pasted into three places that **drifted apart**. This
package is the **canonical superset**: every field that existed in any copy is
kept, so consumers can adopt the DSL without losing data. Merged-in fields are
annotated `@since-merge` in `slides.ts`.

| Field                                   | app `lib/types` | renderer copy | importer copy | DSL decision |
| --------------------------------------- | :-------------: | :-----------: | :-----------: | ------------ |
| `PPTTextElement.vAlign`                 |        —        |       ✓       |       ✓       | kept |
| `PPTImageElement.softEdge`              |        —        |       ✓       |       ✓       | kept |
| `TableCellBorder` + `TableCell.borders` |        —        |       ✓       |       ✓       | kept |
| `TableCell.padding`                     |        —        |       ✓       |       ✓       | kept |
| `TableCell.vAlign`                      |        —        |  `top/middle/bottom`  | `up/mid/down/top/middle/bottom` | canonical = `top/middle/bottom`; importer already normalizes its `up/mid/down` aliases in `transformParsedToSlides` |
| `PPTTableElement.rowHeights`            |        —        |       ✓       |       ✓       | kept |
| `Slide.script` (speaker notes)          |        —        |       —       |       ✓       | kept |
| `Slide.viewportSize/viewportRatio/theme`|    required     |   required    |   optional    | canonical = **required**; importer now fills them at construction in `transformParsedToSlides` (no partial/draft stage) |
| `SlideData` (deprecated)                |        ✓        |       —       |       ✓       | kept, `@deprecated` |

The importer conforms to the canonical contract: it normalizes cell `vAlign`
aliases and emits the required `Slide` fields on output. The renderer consumes
the same superset (it gains access to `script` and the importer-origin fields it
didn't previously declare).

## Build

Pure TypeScript compiled with `tsc` to ESM + `.d.ts`:

```bash
pnpm --filter @gyaan/dsl build      # -> dist/ (index.js, index.d.ts, …)
pnpm --filter @gyaan/dsl typecheck
```

## License

AGPL-3.0, matching the rest of the family (`@gyaan/dsl`, `@gyaan/importer`,
`@gyaan/renderer`) and the Gyaan root, so the license policy is uniform
across the SDK.
