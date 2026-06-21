import { forwardRef, type InputHTMLAttributes, type ReactElement } from "react";
import { cn } from "../cn.js";

/**
 * `Input` — text field primitive (DSS §6 / §13).
 *
 * • 36px height (`--bh-size-lg`), 8px radius, 1.5px border on focus.
 * • Visible focus ring via `--bh-shadow-focus`.
 * • Optional leading slot (icon/affordance) — purely visual.
 */
export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  readonly invalid?: boolean;
  readonly leading?: ReactElement;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, invalid, leading, ...rest },
  ref,
): ReactElement {
  return (
    <span className={cn("bh-input", invalid && "bh-input--invalid", className)}>
      {leading ? (
        <span className="bh-input__leading" aria-hidden="true">
          {leading}
        </span>
      ) : null}
      <input
        ref={ref}
        className="bh-input__control"
        aria-invalid={invalid || undefined}
        {...rest}
      />
    </span>
  );
});
