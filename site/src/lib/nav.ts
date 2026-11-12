/**
 * The primary navigation, shared by the desktop rail (Nav.astro) and the
 * phone menu (MobileMenu.astro) so the two can never drift apart.
 */
export type NavLink = { href: string; label: string };

export const navLinks: NavLink[] = [
  { href: '/', label: 'Welcome' },
  { href: '/things-built', label: 'Work' },
  { href: '/blog', label: 'Writing' },
  { href: '/resume', label: 'Resume' },
  // Stacks (/technologies) is hidden for now; the page still builds.
  { href: '/weaknesses', label: 'Weaknesses' },
];

/** True when `href` is the page at `path`, or a page beneath it. */
export function isCurrent(path: string, href: string): boolean {
  if (href === '/') return path === '/';
  return path === href || path.startsWith(`${href}/`);
}
