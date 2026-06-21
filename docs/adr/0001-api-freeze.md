# ADR-0001 — Reader Platform API Freeze

**Date:** 2026-06-21  
**Status:** Accepted  
**Deciders:** Platform team (Sprint 0.6 validation)  
**Supersedes:** —  
**Superseded by:** —

---

## Context

After completing the PDF adapter (Sprint 3B) and the Reader Shell UI (Sprint 3C), the core Reader Platform consists of three packages:

| Package                     | Role                                                         |
| --------------------------- | ------------------------------------------------------------ |
| `@bookhelper/reader-core`   | Lifecycle FSM, state store, command/event buses, plugin host |
| `@bookhelper/render-engine` | Viewport math, virtualization, frame emission                |
| `@bookhelper/reader-ui`     | Format-agnostic React shell, bootstrap seam                  |

Sprint 0.6 validated the architecture against the full planned feature set (EPUB, Search, Highlights, Annotations, Bookmarks, AI, Collaboration, Knowledge Graph, Learning Engine). The conclusion: all planned features can be added as new adapters, new plugins, or new composition roots — **without modifying any interface below**.

Two genuine gaps were found and fixed in Sprint 0.6 before freezing:

1. `ReaderCapabilities` was missing `ocr: boolean` — needed to distinguish "no text" from "OCR text available" in scanned-PDF and image-only EPUB documents.
2. `pluginState: Record<string, unknown>` provided no key isolation or type safety — replaced with a typed `ReaderPluginStateMap` using the same declaration-merging pattern as `ReaderCommandMap` and `ReaderEventMap`.

With those changes in place, the interfaces below are stable.

---

## Decision

The following interfaces and types are **frozen**. No breaking change may be made to them without:

1. Bumping the affected package to the next major version, **and**
2. A new ADR that supersedes the relevant entry in the table below.

"Breaking change" means: removing a field, narrowing a field's type, changing a method signature, or removing an export. **Additive changes** (new optional fields, new declaration-merge slots, new members of a union that the platform owns) are allowed without a new ADR; they must be documented in the package changelog.

### Frozen APIs

#### `@bookhelper/reader-core`

| Export                                      | Kind      | Additive-only rule                                                   |
| ------------------------------------------- | --------- | -------------------------------------------------------------------- |
| `ReaderEngine`                              | interface | New optional methods allowed                                         |
| `ReaderSession`                             | interface | New read-only properties allowed                                     |
| `DocumentAdapter`                           | interface | New optional capabilities/methods allowed                            |
| `ReaderPlugin`                              | interface | `requires` field additions allowed                                   |
| `ReaderContext`                             | interface | New optional properties/methods allowed                              |
| `Locator` / `PointLocator` / `RangeLocator` | types     | No changes — all stored annotations depend on shape                  |
| `ReaderCapabilities`                        | interface | Additive-only; new flags default `false` in `emptyCapabilities`      |
| `ReaderCommandMap`                          | interface | Additive-only via declaration merging                                |
| `ReaderEventMap`                            | interface | Additive-only via declaration merging                                |
| `ReaderPluginStateMap`                      | interface | Additive-only via declaration merging                                |
| `ReaderPreferences`                         | interface | Additive-only; new fields must have defaults in `defaultPreferences` |

#### `@bookhelper/render-engine`

| Export                                | Kind      | Additive-only rule                                 |
| ------------------------------------- | --------- | -------------------------------------------------- |
| `RuntimeFrame`                        | type      | New optional fields allowed                        |
| `OverlayLayer` / `OverlaysController` | interface | `category` union may grow; existing methods stable |

#### `@bookhelper/reader-ui`

| Export            | Kind      | Additive-only rule                |
| ----------------- | --------- | --------------------------------- |
| `ReaderBootstrap` | interface | Composition-root contract; stable |

---

## Not Frozen

The following are still evolving. Callers should not depend on their shape remaining stable across sprints.

| Export                               | Package       | Reason                                                                           |
| ------------------------------------ | ------------- | -------------------------------------------------------------------------------- |
| `ReaderState` concrete fields        | reader-core   | `pluginState` typing evolved in 0.6; `highlights`/`annotations` fields will grow |
| `RenderRuntime` implementation class | render-engine | Virtualization internals may change                                              |
| `ReaderStorage` interface            | reader-ui     | Will gain slots for highlights, annotations                                      |
| `OpenedReader` interface             | reader-ui     | Will gain TOC invalidation callback for dynamic EPUB TOC                         |
| `ReaderDocMeta`                      | reader-ui     | `pageCount` semantics will tighten post-EPUB                                     |

---

## Consequences

**Positive:**

- Adapter authors (EPUB, DOCX, HTML, …) can implement `DocumentAdapter` against a stable contract.
- Plugin authors can augment `ReaderCommandMap`, `ReaderEventMap`, and `ReaderPluginStateMap` without waiting for core changes.
- The Reader Shell UI (`reader-ui`) can be upgraded independently of any adapter, because the `ReaderBootstrap` seam is frozen.
- Stored `Locator` values (annotations, bookmarks, highlights) are safe across reader upgrades: the coordinate schema will not change.

**Constraints accepted:**

- New capabilities must default to `false` in `emptyCapabilities` — existing adapters that do not set the new flag must behave as "feature absent".
- New command/event/state map slots must be additive and must not collide with the `bookhelper.*` namespace used by first-party plugins.
- Any breaking change requires a new ADR, a major version bump, and a migration guide. The bar is high; exhausting additive options first is required.

---

## References

- Sprint 0.6 full validation report: [`docs/SPRINT-0.6-PLATFORM-VALIDATION.md`](../SPRINT-0.6-PLATFORM-VALIDATION.md)
- `ReaderCapabilities` with `ocr` flag: `packages/reader-core/src/capabilities.ts`
- `ReaderPluginStateMap` declaration-merge pattern: `packages/reader-core/src/state.ts`
- `DocumentAdapter` interface: `packages/reader-core/src/adapter.ts`
- `RuntimeFrame` contract: `packages/render-engine/src/types.ts`
- `ReaderBootstrap` seam: `packages/reader-ui/src/types.ts`
