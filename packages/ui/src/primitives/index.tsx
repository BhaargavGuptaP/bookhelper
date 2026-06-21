"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type ReactElement,
  type ReactNode,
} from "react";
import { cn } from "../cn.js";

/**
 * A small bundle of additional Atlas primitives consumed by Sprint 2's
 * Library UX. Each component is plain CSS + tokens (no Radix, no Tailwind),
 * fulfilling DESIGN-SYSTEM-SPEC §1 (token-driven) and §13 (accessibility).
 */

// ── Card ───────────────────────────────────────────────────────────────
export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  readonly interactive?: boolean;
  readonly selected?: boolean;
  readonly elevation?: "flat" | "raised";
}

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { interactive, selected, elevation = "raised", className, ...rest },
  ref,
): ReactElement {
  return (
    <div
      ref={ref}
      className={cn(
        "bh-card",
        `bh-card--${elevation}`,
        interactive && "bh-card--interactive",
        selected && "bh-card--selected",
        className,
      )}
      data-selected={selected || undefined}
      {...rest}
    />
  );
});

// ── Badge ──────────────────────────────────────────────────────────────
export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  readonly tone?: "neutral" | "accent" | "success" | "warning" | "danger" | "info";
}
export function Badge({ tone = "neutral", className, ...rest }: BadgeProps): ReactElement {
  return <span className={cn("bh-badge", `bh-badge--${tone}`, className)} {...rest} />;
}

// ── Skeleton ───────────────────────────────────────────────────────────
export function Skeleton({
  className,
  width,
  height,
  radius = "var(--bh-radius-sm)",
  ...rest
}: HTMLAttributes<HTMLDivElement> & {
  readonly width?: number | string;
  readonly height?: number | string;
  readonly radius?: string;
}): ReactElement {
  return (
    <div
      className={cn("bh-skeleton", className)}
      style={{ width, height, borderRadius: radius, ...rest.style }}
      aria-hidden="true"
      {...rest}
    />
  );
}

// ── Spinner (calm progress indicator) ──────────────────────────────────
export function Spinner({
  size = 16,
  label = "Loading",
}: {
  readonly size?: number;
  readonly label?: string;
}): ReactElement {
  return (
    <span
      className="bh-spinner"
      role="status"
      aria-label={label}
      style={{ width: size, height: size }}
    />
  );
}

// ── IconButton ─────────────────────────────────────────────────────────
export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  readonly label: string;
  readonly variant?: "ghost" | "secondary";
}
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { label, variant = "ghost", className, children, ...rest },
  ref,
): ReactElement {
  return (
    <button
      ref={ref}
      type="button"
      aria-label={label}
      title={label}
      className={cn("bh-icon-button", `bh-icon-button--${variant}`, className)}
      {...rest}
    >
      <span aria-hidden="true">{children}</span>
    </button>
  );
});

// ── Checkbox ───────────────────────────────────────────────────────────
export interface CheckboxProps {
  readonly checked: boolean;
  readonly indeterminate?: boolean;
  readonly onChange: (next: boolean) => void;
  readonly label: string;
  readonly id?: string;
  readonly className?: string;
}
export function Checkbox({
  checked,
  indeterminate,
  onChange,
  label,
  id,
  className,
}: CheckboxProps): ReactElement {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = !!indeterminate;
  }, [indeterminate]);
  return (
    <label className={cn("bh-checkbox", className)}>
      <input
        id={id}
        ref={ref}
        type="checkbox"
        checked={checked}
        aria-label={label}
        onChange={(e) => onChange(e.currentTarget.checked)}
        className="bh-checkbox__input"
      />
      <span aria-hidden="true" className="bh-checkbox__box" />
      <span className="bh-checkbox__label">{label}</span>
    </label>
  );
}

// ── SegmentedControl ───────────────────────────────────────────────────
export function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
}: {
  readonly value: T;
  readonly options: ReadonlyArray<{
    readonly value: T;
    readonly label: ReactNode;
    readonly ariaLabel?: string;
  }>;
  readonly onChange: (next: T) => void;
  readonly ariaLabel: string;
}): ReactElement {
  return (
    <div className="bh-segmented" role="radiogroup" aria-label={ariaLabel}>
      {options.map((o) => {
        const selected = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={o.ariaLabel ?? (typeof o.label === "string" ? o.label : undefined)}
            className={cn("bh-segmented__item", selected && "bh-segmented__item--on")}
            onClick={() => onChange(o.value)}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

// ── Menu (controlled popover with keyboard nav) ────────────────────────
export interface MenuItem {
  readonly id: string;
  readonly label: ReactNode;
  readonly onSelect: () => void;
  readonly destructive?: boolean;
  readonly disabled?: boolean;
}

export function Menu({
  trigger,
  items,
  align = "start",
}: {
  readonly trigger: (props: {
    open: boolean;
    ref: React.Ref<HTMLButtonElement>;
    onClick: () => void;
  }) => ReactElement;
  readonly items: readonly MenuItem[];
  readonly align?: "start" | "end";
}): ReactElement {
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent): void => {
      const t = e.target as Node;
      if (
        menuRef.current &&
        !menuRef.current.contains(t) &&
        triggerRef.current &&
        !triggerRef.current.contains(t)
      ) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIdx((i) => Math.min(i + 1, items.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIdx((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        const it = items[activeIdx];
        if (it && !it.disabled) {
          it.onSelect();
          setOpen(false);
        }
      }
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, activeIdx, items]);

  return (
    <span className="bh-menu">
      {trigger({
        open,
        ref: triggerRef,
        onClick: () => setOpen((v) => !v),
      })}
      {open ? (
        <div
          ref={menuRef}
          role="menu"
          className={cn("bh-menu__popover", `bh-menu__popover--${align}`)}
        >
          {items.map((it, i) => (
            <button
              key={it.id}
              role="menuitem"
              type="button"
              disabled={it.disabled}
              aria-disabled={it.disabled || undefined}
              className={cn(
                "bh-menu__item",
                it.destructive && "bh-menu__item--destructive",
                i === activeIdx && "bh-menu__item--active",
              )}
              onMouseEnter={() => setActiveIdx(i)}
              onClick={() => {
                if (it.disabled) return;
                it.onSelect();
                setOpen(false);
              }}
            >
              {it.label}
            </button>
          ))}
        </div>
      ) : null}
    </span>
  );
}

// ── Dialog (modal, focus-trapped) ──────────────────────────────────────
export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  size = "md",
}: {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly title: string;
  readonly description?: string;
  readonly children?: ReactNode;
  readonly footer?: ReactNode;
  readonly size?: "sm" | "md" | "lg";
}): ReactElement | null {
  const titleId = useId();
  const descId = useId();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    // Focus first focusable in the dialog.
    requestAnimationFrame(() => {
      const focusable = ref.current?.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      focusable?.[0]?.focus();
    });
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === "Escape") {
        e.preventDefault();
        onOpenChange(false);
      } else if (e.key === "Tab" && ref.current) {
        const focusable = Array.from(
          ref.current.querySelectorAll<HTMLElement>(
            'button:not([disabled]), [href], input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])',
          ),
        ).filter((el) => !el.hasAttribute("aria-hidden"));
        if (focusable.length === 0) return;
        const first = focusable[0]!;
        const last = focusable[focusable.length - 1]!;
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      prev?.focus();
    };
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <div
      className="bh-dialog__overlay"
      role="presentation"
      onClick={(e) => {
        // Dismiss only on a click of the backdrop itself, not on clicks that
        // bubble up from the dialog's contents. This avoids needing a
        // (non-interactive) click handler on the dialog element. Keyboard
        // dismissal is handled by the Escape key above.
        if (e.target === e.currentTarget) onOpenChange(false);
      }}
    >
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        className={cn("bh-dialog", `bh-dialog--${size}`)}
      >
        <h2 id={titleId} className="bh-dialog__title">
          {title}
        </h2>
        {description ? (
          <p id={descId} className="bh-dialog__description">
            {description}
          </p>
        ) : null}
        <div className="bh-dialog__body">{children}</div>
        {footer ? <div className="bh-dialog__footer">{footer}</div> : null}
      </div>
    </div>
  );
}

// ── Toast (single live region; consumers manage the stack) ─────────────
export interface ToastDescriptor {
  readonly id: string;
  readonly title: string;
  readonly description?: string;
  readonly tone?: "neutral" | "success" | "danger";
  readonly action?: { readonly label: string; readonly onClick: () => void };
}

export function ToastRegion({
  toasts,
  onDismiss,
}: {
  readonly toasts: readonly ToastDescriptor[];
  readonly onDismiss: (id: string) => void;
}): ReactElement {
  return (
    <div className="bh-toasts" role="region" aria-label="Notifications" aria-live="polite">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn("bh-toast", `bh-toast--${t.tone ?? "neutral"}`)}
          role="status"
        >
          <div className="bh-toast__body">
            <div className="bh-toast__title">{t.title}</div>
            {t.description ? <div className="bh-toast__desc">{t.description}</div> : null}
          </div>
          {t.action ? (
            <button type="button" className="bh-toast__action" onClick={t.action.onClick}>
              {t.action.label}
            </button>
          ) : null}
          <button
            type="button"
            className="bh-toast__close"
            aria-label="Dismiss notification"
            onClick={() => onDismiss(t.id)}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}

/** A minimal toast hook scoped to a component tree (consumers compose). */
export function useToasts(): {
  toasts: ToastDescriptor[];
  push: (t: Omit<ToastDescriptor, "id">) => string;
  dismiss: (id: string) => void;
} {
  const [toasts, setToasts] = useState<ToastDescriptor[]>([]);
  const push = useCallback((t: Omit<ToastDescriptor, "id">): string => {
    const id = `t_${Math.random().toString(36).slice(2)}`;
    setToasts((cur) => [...cur, { id, ...t }]);
    return id;
  }, []);
  const dismiss = useCallback((id: string) => {
    setToasts((cur) => cur.filter((t) => t.id !== id));
  }, []);
  return { toasts, push, dismiss };
}
