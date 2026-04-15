import { SiteNavbar } from "./site-navbar";

export function PublicPageShell({
  children,
}) {
  return (
    <div className="site-shell">
      <SiteNavbar />
      <div className="site-main">{children}</div>
    </div>
  );
}
