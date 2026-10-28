/* Shared dashboard navigation, used by the sidebar and the mobile menu. */

export type NavItem = { label: string; href: string; icon: React.ReactNode; badge?: number };

export const PRIMARY: NavItem[] = [
  { label: "Overview", href: "/dashboard", icon: <IconGrid /> },
  { label: "Orders", href: "/dashboard/orders", icon: <IconBox /> },
  { label: "Transactions", href: "/dashboard/transactions", icon: <IconSwap /> },
  { label: "Disputes", href: "/dashboard/disputes", icon: <IconScale /> },
  { label: "Documents", href: "/dashboard/documents", icon: <IconDoc /> },
];

export const SECONDARY: NavItem[] = [
  { label: "Wallet", href: "/dashboard/wallet", icon: <IconWallet /> },
  { label: "Settings", href: "/dashboard/settings", icon: <IconCog /> },
];

export function isActive(pathname: string, href: string) {
  return href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);
}

export function IconGrid() { return <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="7" height="7" rx="1.6" stroke="currentColor" strokeWidth="1.7"/><rect x="14" y="3" width="7" height="7" rx="1.6" stroke="currentColor" strokeWidth="1.7"/><rect x="3" y="14" width="7" height="7" rx="1.6" stroke="currentColor" strokeWidth="1.7"/><rect x="14" y="14" width="7" height="7" rx="1.6" stroke="currentColor" strokeWidth="1.7"/></svg>; }
export function IconBox() { return <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M3 7l9-4 9 4v10l-9 4-9-4z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/><path d="M3 7l9 4 9-4M12 11v10" stroke="currentColor" strokeWidth="1.3"/></svg>; }
export function IconSwap() { return <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M4 8h13l-3-3M20 16H7l3 3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>; }
export function IconScale() { return <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M12 3v18M6 7h12M6 7l-3 6h6zM18 7l3 6h-6z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/></svg>; }
export function IconDoc() { return <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M6 3h8l4 4v14H6z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/><path d="M14 3v4h4M9 13h6M9 17h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>; }
export function IconWallet() { return <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><rect x="3" y="6" width="18" height="13" rx="2.5" stroke="currentColor" strokeWidth="1.7"/><path d="M3 10h18M16 14h.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>; }
export function IconCog() { return <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.7"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>; }
