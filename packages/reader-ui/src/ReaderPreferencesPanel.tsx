"use client";

/**
 * **ReaderPreferencesPanel** — the live reading-settings sheet.
 *
 * Non-modal (the page stays visible for live preview, per spec). Every
 * control writes straight through reader-core (`setPreferences`) or the
 * shell chrome actions; nothing is buffered, so changes apply instantly and
 * persist via the provider's debounced writer. Theme, text size, line
 * spacing, reading width, page gap, sidebar width, reduced motion (and
 * high-contrast as a theme) are all here.
 */

import { useEffect, useId, useRef } from "react";
import { Checkbox, IconButton, SegmentedControl } from "@bookhelper/ui";
import type { FontFamily, LineSpacing, Measure, ReadingTheme } from "@bookhelper/reader-core";
import { useReaderContext } from "./context.js";
import { CloseIcon } from "./icons.js";

const THEMES: ReadonlyArray<{ value: ReadingTheme; label: string }> = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "sepia", label: "Sepia" },
  { value: "dark", label: "Dark" },
  { value: "high-contrast", label: "Contrast" },
];

const FONTS: ReadonlyArray<{ value: FontFamily; label: string }> = [
  { value: "serif", label: "Serif" },
  { value: "sans-serif", label: "Sans" },
  { value: "dyslexic", label: "Reader" },
  { value: "monospace", label: "Mono" },
];

const SPACINGS: ReadonlyArray<{ value: LineSpacing; label: string }> = [
  { value: "compact", label: "Compact" },
  { value: "comfortable", label: "Default" },
  { value: "relaxed", label: "Relaxed" },
];

const MEASURES: ReadonlyArray<{ value: Measure; label: string }> = [
  { value: "narrow", label: "Narrow" },
  { value: "medium", label: "Medium" },
  { value: "wide", label: "Wide" },
];

export function ReaderPreferencesPanel(): React.JSX.Element | null {
  const { chrome, preferences, actions } = useReaderContext();
  const headingId = useId();
  const panelRef = useRef<HTMLDivElement | null>(null);
  const restoreRef = useRef<HTMLElement | null>(null);

  // Focus management: focus the panel on open, restore focus on close.
  useEffect(() => {
    restoreRef.current = (document.activeElement as HTMLElement | null) ?? null;
    panelRef.current?.focus();
    const toRestore = restoreRef.current;
    return () => {
      toRestore?.focus?.();
    };
  }, []);

  if (!chrome.preferencesOpen) return null;

  return (
    <div
      className="bh-reader-prefs"
      role="dialog"
      aria-modal="false"
      aria-labelledby={headingId}
      ref={panelRef}
      tabIndex={-1}
    >
      <div className="bh-reader-prefs__header">
        <h2 id={headingId} className="bh-reader-prefs__title">
          Reading preferences
        </h2>
        <IconButton label="Close preferences" onClick={actions.togglePreferences}>
          <CloseIcon />
        </IconButton>
      </div>

      <div className="bh-reader-prefs__body">
        <Field label="Theme">
          <SegmentedControl<ReadingTheme>
            ariaLabel="Reading theme"
            value={preferences.theme}
            options={THEMES}
            onChange={actions.setTheme}
          />
        </Field>

        <Field label="Typeface">
          <SegmentedControl<FontFamily>
            ariaLabel="Reading typeface"
            value={preferences.fontFamily}
            options={FONTS}
            onChange={(fontFamily) => actions.setPreferences({ fontFamily })}
          />
        </Field>

        <RangeField
          label="Text size"
          value={preferences.fontScale}
          min={0.8}
          max={1.6}
          step={0.05}
          format={(v) => `${Math.round(v * 100)}%`}
          onChange={(fontScale) => actions.setPreferences({ fontScale })}
        />

        <Field label="Line spacing">
          <SegmentedControl<LineSpacing>
            ariaLabel="Line spacing"
            value={preferences.lineSpacing}
            options={SPACINGS}
            onChange={(lineSpacing) => actions.setPreferences({ lineSpacing })}
          />
        </Field>

        <Field label="Reading width">
          <SegmentedControl<Measure>
            ariaLabel="Reading width"
            value={preferences.measure}
            options={MEASURES}
            onChange={(measure) => actions.setPreferences({ measure })}
          />
        </Field>

        <RangeField
          label="Page gap"
          value={chrome.pageGap}
          min={0}
          max={80}
          step={4}
          format={(v) => `${Math.round(v)}px`}
          onChange={actions.setPageGap}
        />

        <RangeField
          label="Contents panel width"
          value={chrome.sidebarWidth}
          min={220}
          max={480}
          step={8}
          format={(v) => `${Math.round(v)}px`}
          onChange={actions.setSidebarWidth}
        />

        <div className="bh-reader-prefs__toggles">
          <Checkbox
            label="Reduce motion"
            checked={preferences.reducedMotion}
            onChange={(reducedMotion) => actions.setPreferences({ reducedMotion })}
          />
          <Checkbox
            label="Focus mode"
            checked={chrome.focusMode}
            onChange={() => actions.toggleFocusMode()}
          />
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  readonly label: string;
  readonly children: React.ReactNode;
}): React.JSX.Element {
  return (
    <div className="bh-reader-prefs__field">
      <span className="bh-reader-prefs__label">{label}</span>
      {children}
    </div>
  );
}

function RangeField({
  label,
  value,
  min,
  max,
  step,
  format,
  onChange,
}: {
  readonly label: string;
  readonly value: number;
  readonly min: number;
  readonly max: number;
  readonly step: number;
  readonly format: (v: number) => string;
  readonly onChange: (v: number) => void;
}): React.JSX.Element {
  const id = useId();
  return (
    <div className="bh-reader-prefs__field">
      <label className="bh-reader-prefs__label" htmlFor={id}>
        {label}
        <span className="bh-reader-prefs__value">{format(value)}</span>
      </label>
      <input
        id={id}
        type="range"
        className="bh-reader-prefs__range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number.parseFloat(e.currentTarget.value))}
      />
    </div>
  );
}
