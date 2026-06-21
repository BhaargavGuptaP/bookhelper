/**
 * @bookhelper/ui — shared React primitives.
 *
 * Sprint 1 surface: ThemeProvider + a single `Button` primitive (so the web
 * shell has *something* concrete on top of the tokens). Everything else
 * (inputs, dialogs, palette) lands in its own sprint when the corresponding
 * UX flow is built.
 */
export { cn } from "./cn.js";
export {
  ThemeProvider,
  useTheme,
  themeStorageKey,
  themePreferences,
  resolveAppTheme,
  type ThemePreference,
} from "./theme/ThemeProvider.js";
export { ThemeScript } from "./theme/ThemeScript.js";
export { Button, type ButtonProps } from "./button/Button.js";
export { Input, type InputProps } from "./input/Input.js";
export {
  Card,
  type CardProps,
  Badge,
  type BadgeProps,
  Skeleton,
  Spinner,
  IconButton,
  type IconButtonProps,
  Checkbox,
  type CheckboxProps,
  SegmentedControl,
  Menu,
  type MenuItem,
  Dialog,
  ToastRegion,
  type ToastDescriptor,
  useToasts,
} from "./primitives/index.js";
export { VisuallyHidden } from "./a11y/VisuallyHidden.js";
