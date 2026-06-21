/**
 * `@bookhelper/reader-core` — the format-agnostic Reader Platform.
 *
 * Sprint 3A scope: this package contains **interfaces + a minimal
 * in-process runtime** for the BookHelper reader. It deliberately
 * implements no rendering, no PDF/EPUB/Markdown handling, no search,
 * no highlights, no AI. Those become {@link DocumentAdapter}s and
 * {@link ReaderPlugin}s built on top of this platform — see
 * `../README.md` for the why.
 *
 * Public modules:
 *
 *   • {@link ReaderEngine}     top-level entry, holds adapter registry
 *   • {@link ReaderSession}    one document being read
 *   • {@link ReaderStore}      single source of truth for session state
 *   • {@link ReaderEventBus}   typed pub/sub for plugins to observe
 *   • {@link ReaderCommandBus} typed command dispatcher with undo/redo
 *   • {@link ReaderContext}    narrow API plugins are handed on activate
 *   • {@link ReaderPlugin}     the extension boundary
 *   • {@link DocumentAdapter}  the format boundary
 *
 * Cross-cutting types:
 *
 *   • {@link Locator}, {@link Position}     the universal coordinate system
 *   • {@link ReaderCapabilities}            per-adapter feature flags
 *   • {@link ReaderPreferences}             user-facing reading settings
 *   • {@link LifecycleState}                idle→opening→ready→closed FSM
 *   • Typed errors in `./errors`
 *
 * The locator system (READER-SPEC §4) and the capability matrix are
 * the load-bearing contracts here — adapters and plugins should be
 * implemented against them rather than against any concrete
 * implementation in this package.
 */

// ─── Locator / Document Model ─────────────────────────────────────────
export type {
  BlockId,
  DocVersion,
  DocumentId,
  NativeAnchor,
  Position,
  PointLocator,
  RangeLocator,
  Locator,
  QuoteAnchor,
} from "./locator.js";
export {
  comparePositions,
  compareLocators,
  isPointLocator,
  isRangeLocator,
  locatorEnd,
  locatorStart,
} from "./locator.js";

export type {
  BlockSummary,
  DocumentManifest,
  RenderMode,
  Toc,
  TocEntry,
  WritingDirection,
} from "./document-model.js";

// ─── Capabilities ─────────────────────────────────────────────────────
export type { CapabilityFlag, LayoutMode, ReaderCapabilities } from "./capabilities.js";
export { emptyCapabilities, hasCapability } from "./capabilities.js";

// ─── Preferences ──────────────────────────────────────────────────────
export type {
  FlowDirection,
  FontFamily,
  LineSpacing,
  Measure,
  ReaderPreferences,
  ReadingTheme,
} from "./preferences.js";
export { defaultPreferences, withPreferences } from "./preferences.js";

// ─── Lifecycle ────────────────────────────────────────────────────────
export type { LifecycleState } from "./lifecycle.js";
export { canTransition, isInteractive, isTerminal, lifecycleTransitions } from "./lifecycle.js";

// ─── Errors ───────────────────────────────────────────────────────────
export {
  AdapterError,
  CapabilityNotSupportedError,
  CommandExecutionError,
  CommandNotFoundError,
  DuplicatePluginError,
  LocatorResolutionError,
  PluginActivationError,
  ReaderError,
  ReaderLifecycleError,
  errorCodeFor,
} from "./errors.js";

// ─── State ────────────────────────────────────────────────────────────
export type { ReaderPluginStateMap, ReaderState, ReaderStore, StateSelector, StateSubscriber } from "./state.js";
export { createStore, initialState, select } from "./state.js";

// ─── Events ───────────────────────────────────────────────────────────
export type {
  ReaderEventBus,
  ReaderEventEmitter,
  ReaderEventListener,
  ReaderEventMap,
  ReaderEventName,
  Unsubscribe,
} from "./events.js";
export { createEventBus } from "./events.js";

// ─── Commands ─────────────────────────────────────────────────────────
export type {
  ReaderCommandBus,
  ReaderCommandHandler,
  ReaderCommandMap,
  ReaderCommandName,
  ReaderCommandPayload,
  ReaderCommandResult,
  UndoableInvocation,
} from "./commands.js";
export { createCommandBus } from "./commands.js";

// ─── Layout / Navigation ──────────────────────────────────────────────
export type { LayoutEngine, LayoutWindow, Viewport } from "./layout.js";
export type {
  NavigationEngine,
  NavigationResolution,
  StepDirection,
  StepGrain,
} from "./navigation.js";

// ─── Adapter ──────────────────────────────────────────────────────────
export type {
  AdapterOpenInput,
  DocumentAdapter,
  DocumentSession,
  LocatorResolution,
} from "./adapter.js";

// ─── Plugins / Context ────────────────────────────────────────────────
export type { PluginRegistration, ReaderPlugin, ReaderPluginFactory } from "./plugin.js";
export type { ReaderContext } from "./context.js";
export { createContext } from "./context.js";

// ─── Logger ───────────────────────────────────────────────────────────
export type { Logger } from "./logger.js";
export { noopLogger } from "./logger.js";

// ─── Session / Engine ────────────────────────────────────────────────
export type { OpenInput, ReaderSession, ReaderSessionOptions } from "./session.js";
export { createReaderSession } from "./session.js";

export type {
  AdapterPredicate,
  AdapterRegistration,
  CreateSessionInput,
  ReaderEngine,
  ReaderEngineOptions,
} from "./engine.js";
export { createReaderEngine } from "./engine.js";
