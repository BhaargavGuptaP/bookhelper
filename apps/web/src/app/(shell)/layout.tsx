import type { ReactElement, ReactNode } from "react";
import { AppRail } from "~/shell/AppRail";
import { BottomNav } from "~/shell/BottomNav";

/**
 * Shell-wrapped layout for non-Reader surfaces.
 *
 * The Reader (when it lands) will live in a sibling route group that does
 * NOT include the rail — UX-SPECIFICATION §2.0 requires "Reader takes the
 * full canvas (rail auto-hides)."
 */
export default function ShellLayout({ children }: { readonly children: ReactNode }): ReactElement {
  return (
    <div className="bh-shell">
      <AppRail />
      {children}
      <BottomNav />
    </div>
  );
}
