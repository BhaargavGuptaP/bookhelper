/**
 * `@bookhelper/reader-ui` — the format-agnostic Reader shell.
 *
 * Presentation only. It consumes `@bookhelper/reader-core` (lifecycle,
 * state, commands, preferences, capabilities) and `@bookhelper/render-engine`
 * (viewport, zoom, virtualization, frames). It never imports a document
 * adapter or pdf.js — the host wires those behind a {@link ReaderBootstrap}.
 *
 * Apps usually render `<Reader bootstrap doc onExit />`. The provider +
 * individual components are exported too for custom layouts.
 */

// Top-level
export { Reader, type ReaderProps } from "./Reader.js";
export { ReaderProvider, type ReaderProviderProps } from "./ReaderProvider.js";
export { ReaderShell } from "./ReaderShell.js";

// Components
export { ReaderToolbar } from "./ReaderToolbar.js";
export { ReaderViewport } from "./ReaderViewport.js";
export { ReaderPage, type ReaderPageProps } from "./ReaderPage.js";
export { ReaderSidebar } from "./ReaderSidebar.js";
export { TableOfContents } from "./TableOfContents.js";
export { ReaderStatusBar } from "./ReaderStatusBar.js";
export { ReaderPreferencesPanel } from "./ReaderPreferencesPanel.js";

// Context
export {
  useReaderContext,
  type ReaderContextValue,
  type ReaderActions,
  type ReaderChromeState,
  type ReaderPhase,
} from "./context.js";

// Hosting seams
export type {
  OpenedReader,
  PageContentLoader,
  ReaderBootstrap,
  ReaderDocMeta,
  ReaderPageContent,
  ReaderSessionRecord,
  ReaderSettings,
  ReaderSourceType,
  ReaderStorage,
  ReaderTocNode,
} from "./types.js";

// Persistence + environment helpers (host may reuse)
export {
  createLocalReaderStorage,
  createMemoryReaderStorage,
  sessionKey,
  SETTINGS_KEY,
  SESSION_KEY_PREFIX,
} from "./persistence.js";
export { createBrowserReaderEnvironment } from "./environment.js";
export { memoizePageLoader } from "./content-cache.js";

// Pure helpers (exported for tests / host reuse)
export {
  resolveReaderIntent,
  isEditableTarget,
  type ReaderIntent,
  type KeyChord,
} from "./keyboard.js";
export { pageWidthForMeasure, lineHeightForSpacing, clamp } from "./layout.js";
export {
  useResolvedReaderTheme,
  useEffectiveReducedMotion,
  type ResolvedReaderTheme,
} from "./use-theme.js";
