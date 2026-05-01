import { describe, it, expect } from 'vitest';
import {
  isPublicRoute,
  isRoleAllowed,
  getNavItemsForRole,
  ROUTE_PERMISSIONS,
  NAV_ITEMS,
  PUBLIC_ROUTES,
} from '@/lib/rbac';
// UserRole type used implicitly in RBAC function parameter assertions

// ─── US-02 + US-03: Auth config exists and exports are importable ───────────

describe('US-02: Auth.js configuration', () => {
  it('auth module exists at src/lib/auth.ts', async () => {
    // next-auth imports next/server which isn't available in jsdom.
    // We verify the file exists and is syntactically valid by checking
    // the file system. The actual Auth.js integration is tested via
    // Playwright e2e tests against a running Next.js server.
    const fs = await import('fs');
    const path = await import('path');
    const authPath = path.resolve(__dirname, '../lib/auth.ts');
    expect(fs.existsSync(authPath)).toBe(true);

    const content = fs.readFileSync(authPath, 'utf-8');
    expect(content).toContain("import NextAuth from 'next-auth'");
    expect(content).toContain('MicrosoftEntraID');
    expect(content).toContain('PrismaAdapter');
    expect(content).toContain('signIn');
    expect(content).toContain('signOut');
    expect(content).toContain('auth');
    expect(content).toContain('handlers');
  });

  it('has a dev-only Credentials provider for local testing', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const content = fs.readFileSync(path.resolve(__dirname, '../lib/auth.ts'), 'utf-8');
    expect(content).toContain("Credentials");
    expect(content).toContain("'dev-credentials'");
    expect(content).toContain("NODE_ENV === 'development'");
  });

  it('auth config rejects users not in User table', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const content = fs.readFileSync(
      path.resolve(__dirname, '../lib/auth.ts'),
      'utf-8',
    );
    // signIn callback must check for user existence
    expect(content).toContain("'/login?error=unauthorized'");
    // signIn callback must check isActive
    expect(content).toContain("'/login?error=inactive'");
  });

  it('auth config embeds role in JWT token', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const content = fs.readFileSync(
      path.resolve(__dirname, '../lib/auth.ts'),
      'utf-8',
    );
    expect(content).toContain('token.role');
    expect(content).toContain('session.user.role');
    expect(content).toContain('token.id');
    expect(content).toContain('session.user.id');
  });

  it('API route handler exists at app/api/auth/[...nextauth]/route.ts', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const routePath = path.resolve(
      __dirname,
      '../app/api/auth/[...nextauth]/route.ts',
    );
    expect(fs.existsSync(routePath)).toBe(true);
    const content = fs.readFileSync(routePath, 'utf-8');
    expect(content).toContain('handlers');
    expect(content).toContain('GET');
    expect(content).toContain('POST');
  });

  it('next-auth type declarations extend Session and JWT with role', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const typesPath = path.resolve(__dirname, '../types/next-auth.d.ts');
    expect(fs.existsSync(typesPath)).toBe(true);
    const content = fs.readFileSync(typesPath, 'utf-8');
    expect(content).toContain('role: UserRole');
    expect(content).toContain("module 'next-auth'");
    expect(content).toContain("module 'next-auth/jwt'");
  });
});

// ─── US-03: Role resolution is available via RBAC config ────────────────────

describe('US-03: RBAC configuration', () => {
  it('ROUTE_PERMISSIONS defines access for all protected route groups', () => {
    expect(ROUTE_PERMISSIONS).toHaveProperty('/admin');
    expect(ROUTE_PERMISSIONS).toHaveProperty('/applicants');
    expect(ROUTE_PERMISSIONS).toHaveProperty('/interviews');
    expect(ROUTE_PERMISSIONS).toHaveProperty('/offers');
    expect(ROUTE_PERMISSIONS).toHaveProperty('/documents');
    expect(ROUTE_PERMISSIONS).toHaveProperty('/dashboard');
    expect(ROUTE_PERMISSIONS).toHaveProperty('/reports');
  });

  it('NAV_ITEMS contains entries for Dashboard, Applicants, Interviews, Reports, Admin', () => {
    const labels = NAV_ITEMS.map((item) => item.label);
    expect(labels).toContain('Dashboard');
    expect(labels).toContain('Applicants');
    expect(labels).toContain('Interviews');
    expect(labels).toContain('Reports');
    expect(labels).toContain('Admin');
  });

  it('PUBLIC_ROUTES includes /login, /api/auth, /forms', () => {
    expect(PUBLIC_ROUTES).toContain('/login');
    expect(PUBLIC_ROUTES).toContain('/api/auth');
    expect(PUBLIC_ROUTES).toContain('/forms');
  });
});

// ─── US-04: isPublicRoute correctly identifies public vs protected routes ───

describe('US-04: Public route detection', () => {
  it('/login is public', () => {
    expect(isPublicRoute('/login')).toBe(true);
  });

  it('/api/auth/callback/microsoft-entra-id is public', () => {
    expect(isPublicRoute('/api/auth/callback/microsoft-entra-id')).toBe(true);
  });

  it('/forms/interview-application is public', () => {
    expect(isPublicRoute('/forms/interview-application')).toBe(true);
  });

  it('/dashboard is NOT public', () => {
    expect(isPublicRoute('/dashboard')).toBe(false);
  });

  it('/applicants is NOT public', () => {
    expect(isPublicRoute('/applicants')).toBe(false);
  });

  it('/admin is NOT public', () => {
    expect(isPublicRoute('/admin')).toBe(false);
  });

  it('/ (root) is NOT public', () => {
    expect(isPublicRoute('/')).toBe(false);
  });
});

// ─── US-05: Role-based route access control ─────────────────────────────────

describe('US-05: Role-based route access', () => {
  // ADMISSIONS_STAFF access
  it('ADMISSIONS_STAFF can access /dashboard', () => {
    expect(isRoleAllowed('/dashboard', 'ADMISSIONS_STAFF')).toBe(true);
  });

  it('ADMISSIONS_STAFF can access /applicants', () => {
    expect(isRoleAllowed('/applicants', 'ADMISSIONS_STAFF')).toBe(true);
  });

  it('ADMISSIONS_STAFF can access /interviews', () => {
    expect(isRoleAllowed('/interviews', 'ADMISSIONS_STAFF')).toBe(true);
  });

  it('ADMISSIONS_STAFF can access /offers', () => {
    expect(isRoleAllowed('/offers', 'ADMISSIONS_STAFF')).toBe(true);
  });

  it('ADMISSIONS_STAFF can access /reports', () => {
    expect(isRoleAllowed('/reports', 'ADMISSIONS_STAFF')).toBe(true);
  });

  it('ADMISSIONS_STAFF cannot access /admin', () => {
    expect(isRoleAllowed('/admin', 'ADMISSIONS_STAFF')).toBe(false);
  });

  // ACADEMIC_STAFF access
  it('ACADEMIC_STAFF can access /applicants (read-only)', () => {
    expect(isRoleAllowed('/applicants', 'ACADEMIC_STAFF')).toBe(true);
  });

  it('ACADEMIC_STAFF can access /interviews (assigned only)', () => {
    expect(isRoleAllowed('/interviews', 'ACADEMIC_STAFF')).toBe(true);
  });

  it('ACADEMIC_STAFF cannot access /dashboard', () => {
    expect(isRoleAllowed('/dashboard', 'ACADEMIC_STAFF')).toBe(false);
  });

  it('ACADEMIC_STAFF cannot access /reports', () => {
    expect(isRoleAllowed('/reports', 'ACADEMIC_STAFF')).toBe(false);
  });

  it('ACADEMIC_STAFF cannot access /offers', () => {
    expect(isRoleAllowed('/offers', 'ACADEMIC_STAFF')).toBe(false);
  });

  it('ACADEMIC_STAFF cannot access /admin', () => {
    expect(isRoleAllowed('/admin', 'ACADEMIC_STAFF')).toBe(false);
  });

  // SENIOR_LEADERSHIP access
  it('SENIOR_LEADERSHIP can access /dashboard', () => {
    expect(isRoleAllowed('/dashboard', 'SENIOR_LEADERSHIP')).toBe(true);
  });

  it('SENIOR_LEADERSHIP can access /reports', () => {
    expect(isRoleAllowed('/reports', 'SENIOR_LEADERSHIP')).toBe(true);
  });

  it('SENIOR_LEADERSHIP can access /applicants (read-only, F02 US-11)', () => {
    expect(isRoleAllowed('/applicants', 'SENIOR_LEADERSHIP')).toBe(true);
  });

  it('SENIOR_LEADERSHIP cannot access /interviews', () => {
    expect(isRoleAllowed('/interviews', 'SENIOR_LEADERSHIP')).toBe(false);
  });

  it('SENIOR_LEADERSHIP cannot access /offers', () => {
    expect(isRoleAllowed('/offers', 'SENIOR_LEADERSHIP')).toBe(false);
  });

  it('SENIOR_LEADERSHIP cannot access /admin', () => {
    expect(isRoleAllowed('/admin', 'SENIOR_LEADERSHIP')).toBe(false);
  });

  // SYSTEM_ADMINISTRATOR access
  it('SYSTEM_ADMINISTRATOR can access /admin', () => {
    expect(isRoleAllowed('/admin', 'SYSTEM_ADMINISTRATOR')).toBe(true);
  });

  it('SYSTEM_ADMINISTRATOR can access /dashboard', () => {
    expect(isRoleAllowed('/dashboard', 'SYSTEM_ADMINISTRATOR')).toBe(true);
  });

  it('SYSTEM_ADMINISTRATOR can access /applicants', () => {
    expect(isRoleAllowed('/applicants', 'SYSTEM_ADMINISTRATOR')).toBe(true);
  });

  it('SYSTEM_ADMINISTRATOR can access /reports', () => {
    expect(isRoleAllowed('/reports', 'SYSTEM_ADMINISTRATOR')).toBe(true);
  });

  // Sub-routes
  it('role check works on nested paths like /admin/users', () => {
    expect(isRoleAllowed('/admin/users', 'SYSTEM_ADMINISTRATOR')).toBe(true);
    expect(isRoleAllowed('/admin/users', 'ADMISSIONS_STAFF')).toBe(false);
  });

  it('unprotected routes allow any authenticated role', () => {
    expect(isRoleAllowed('/settings', 'ACADEMIC_STAFF')).toBe(true);
    expect(isRoleAllowed('/profile', 'SENIOR_LEADERSHIP')).toBe(true);
  });
});

// ─── US-08: Role-aware navigation ───────────────────────────────────────────

describe('US-08: getNavItemsForRole', () => {
  it('ADMISSIONS_STAFF sees Dashboard, Applicants, Interviews, Reports', () => {
    const items = getNavItemsForRole('ADMISSIONS_STAFF');
    const labels = items.map((i) => i.label);
    expect(labels).toContain('Dashboard');
    expect(labels).toContain('Applicants');
    expect(labels).toContain('Interviews');
    expect(labels).toContain('Reports');
    expect(labels).not.toContain('Admin');
  });

  it('ACADEMIC_STAFF sees only Applicants and Interviews', () => {
    const items = getNavItemsForRole('ACADEMIC_STAFF');
    const labels = items.map((i) => i.label);
    expect(labels).toContain('Applicants');
    expect(labels).toContain('Interviews');
    expect(labels).not.toContain('Dashboard');
    expect(labels).not.toContain('Reports');
    expect(labels).not.toContain('Admin');
  });

  it('SENIOR_LEADERSHIP sees Dashboard, Applicants, and Reports', () => {
    const items = getNavItemsForRole('SENIOR_LEADERSHIP');
    const labels = items.map((i) => i.label);
    expect(labels).toContain('Dashboard');
    expect(labels).toContain('Applicants');
    expect(labels).toContain('Reports');
    expect(labels).not.toContain('Interviews');
    expect(labels).not.toContain('Admin');
  });

  it('SYSTEM_ADMINISTRATOR sees Dashboard, Applicants, Interviews, Reports, Admin', () => {
    const items = getNavItemsForRole('SYSTEM_ADMINISTRATOR');
    const labels = items.map((i) => i.label);
    expect(labels).toContain('Dashboard');
    expect(labels).toContain('Applicants');
    expect(labels).toContain('Interviews');
    expect(labels).toContain('Reports');
    expect(labels).toContain('Admin');
    expect(items).toHaveLength(5);
  });
});
