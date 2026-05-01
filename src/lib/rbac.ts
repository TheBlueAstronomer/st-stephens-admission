import type { UserRole } from '@/generated/prisma/client';

/**
 * Route-to-role permission map.
 * Keys are path prefixes (matched with startsWith).
 * Values are arrays of roles allowed to access that route group.
 * Routes not listed here are accessible to any authenticated user.
 */
export const ROUTE_PERMISSIONS: Record<string, UserRole[]> = {
  '/admin': ['SYSTEM_ADMINISTRATOR'],
  '/applicants': ['ADMISSIONS_STAFF', 'ACADEMIC_STAFF', 'SENIOR_LEADERSHIP', 'SYSTEM_ADMINISTRATOR'],
  '/interviews': ['ADMISSIONS_STAFF', 'ACADEMIC_STAFF', 'SYSTEM_ADMINISTRATOR'],
  '/offers': ['ADMISSIONS_STAFF', 'SYSTEM_ADMINISTRATOR'],
  '/documents': ['ADMISSIONS_STAFF', 'SYSTEM_ADMINISTRATOR'],
  '/dashboard': ['ADMISSIONS_STAFF', 'SENIOR_LEADERSHIP', 'SYSTEM_ADMINISTRATOR'],
  '/reports': ['ADMISSIONS_STAFF', 'SENIOR_LEADERSHIP', 'SYSTEM_ADMINISTRATOR'],
};

/**
 * Navigation items with role visibility per wireframe table.
 */
export interface NavItem {
  label: string;
  href: string;
  icon: string;
  roles: UserRole[];
}

export const NAV_ITEMS: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: 'House',
    roles: ['ADMISSIONS_STAFF', 'SENIOR_LEADERSHIP', 'SYSTEM_ADMINISTRATOR'],
  },
  {
    label: 'Applicants',
    href: '/applicants',
    icon: 'Users',
    roles: ['ADMISSIONS_STAFF', 'ACADEMIC_STAFF', 'SENIOR_LEADERSHIP', 'SYSTEM_ADMINISTRATOR'],
  },
  {
    label: 'Interviews',
    href: '/interviews',
    icon: 'CalendarBlank',
    roles: ['ADMISSIONS_STAFF', 'ACADEMIC_STAFF', 'SYSTEM_ADMINISTRATOR'],
  },
  {
    label: 'Reports',
    href: '/reports',
    icon: 'ChartBar',
    roles: ['ADMISSIONS_STAFF', 'SENIOR_LEADERSHIP', 'SYSTEM_ADMINISTRATOR'],
  },
  {
    label: 'Admin',
    href: '/admin',
    icon: 'Gear',
    roles: ['SYSTEM_ADMINISTRATOR'],
  },
];

/**
 * Public routes that don't require authentication.
 */
export const PUBLIC_ROUTES = ['/login', '/api/auth', '/forms', '/dev/login'];

/**
 * Check if a path is public (no auth required).
 */
export function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + '/'),
  );
}

/**
 * Check if a role is allowed to access a given path.
 * Returns true if no explicit permission is defined (open to any authenticated user).
 */
export function isRoleAllowed(pathname: string, role: UserRole): boolean {
  for (const [prefix, allowedRoles] of Object.entries(ROUTE_PERMISSIONS)) {
    if (pathname === prefix || pathname.startsWith(prefix + '/')) {
      return allowedRoles.includes(role);
    }
  }
  // No explicit restriction — allow any authenticated user
  return true;
}

/**
 * Get nav items visible to a given role.
 */
export function getNavItemsForRole(role: UserRole): NavItem[] {
  return NAV_ITEMS.filter((item) => item.roles.includes(role));
}
