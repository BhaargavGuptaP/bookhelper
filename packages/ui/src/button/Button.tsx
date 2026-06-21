import { forwardRef, type ButtonHTMLAttributes, type ReactElement, type ReactNode } from "react";
import { cn } from "../cn.js";
import { VisuallyHidden } from "../a11y/VisuallyHidden.js";

/**
 * `Button` — the foundational interactive primitive.
 *
 * Implements DESIGN-SYSTEM-SPEC §6 "Buttons" + §13 Accessibility:
 *   • Variants: primary / secondary / ghost / danger.
 *   • Sizes: sm / md (default) / lg — all heights from §2.15.
 *   • Min touch target 44×44 enforced via padding even at `sm`.
 *   • Visible focus ring uses `--bh-shadow-focus`.
 *   • Loading state: button stays interactive-disabled, with an
 *     `aria-busy="true"` flag and a visible spinner; the label is preserved
 *     so screen readers don't lose context.
 *   • Disabled state: `aria-disabled` instead of the `disabled` attribute so
 *     the button remains focusable and discoverable (UX §12).
 */
export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "disabled"> {
  readonly variant?: ButtonVariant;
  readonly size?: ButtonSize;
  /** Pseudo-disabled: keeps focusability + announces state. */
  readonly disabled?: boolean;
  /** When true: announces `aria-busy`, suppresses activation, shows spinner. */
  readonly loading?: boolean;
  /** Optional leading icon (positioned via the CSS module). */
  readonly leadingIcon?: ReactNode;
  /** Optional trailing icon. */
  readonly trailingIcon?: ReactNode;
  /**
   * Accessible label override. Required when the button's children are not
   * already meaningful text (icon-only buttons).
   */
  readonly "aria-label"?: string;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "primary",
    size = "md",
    disabled = false,
    loading = false,
    leadingIcon,
    trailingIcon,
    className,
    type = "button",
    onClick,
    children,
    ...rest
  },
  ref,
): ReactElement {
  const inert = disabled || loading;

  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        "bh-button",
        `bh-button--${variant}`,
        `bh-button--${size}`,
        loading && "bh-button--loading",
        className,
      )}
      aria-disabled={disabled || undefined}
      aria-busy={loading || undefined}
      data-variant={variant}
      data-size={size}
      onClick={(e) => {
        // Honor aria-disabled / loading without removing focus.
        if (inert) {
          e.preventDefault();
          e.stopPropagation();
          return;
        }
        onClick?.(e);
      }}
      {...rest}
    >
      {loading ? (
        <span className="bh-button__spinner" aria-hidden="true" />
      ) : leadingIcon ? (
        <span className="bh-button__icon" aria-hidden="true">
          {leadingIcon}
        </span>
      ) : null}
      <span className="bh-button__label">{children}</span>
      {trailingIcon && !loading ? (
        <span className="bh-button__icon" aria-hidden="true">
          {trailingIcon}
        </span>
      ) : null}
      {loading ? <VisuallyHidden>Loading</VisuallyHidden> : null}
    </button>
  );
});
