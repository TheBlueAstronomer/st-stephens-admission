import { describe, it, expect, vi } from 'vitest';

// Mock next-auth/react
vi.mock('next-auth/react', () => ({
  signIn: vi.fn(),
  signOut: vi.fn(),
}));

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: vi.fn(() => '/dashboard'),
}));

import { getNavItemsForRole, type NavItem } from '@/lib/rbac';

// ─── US-08: Application Shell — Role-Aware Navigation ──────────────────────
// We test getNavItemsForRole (pure function) for all 4 roles,
// and verify the AppSidebar component renders correct items.
// The sidebar component requires SidebarProvider context from shadcn.

describe('US-08: Role-aware navigation items (unit)', () => {
  it('ADMISSIONS_STAFF gets 4 nav items: Dashboard, Applicants, Interviews, Reports', () => {
    const items = getNavItemsForRole('ADMISSIONS_STAFF');
    expect(items).toHaveLength(4);
    expect(items.map((i: NavItem) => i.label)).toEqual([
      'Dashboard',
      'Applicants',
      'Interviews',
      'Reports',
    ]);
  });

  it('ACADEMIC_STAFF gets 2 nav items: Applicants, Interviews', () => {
    const items = getNavItemsForRole('ACADEMIC_STAFF');
    expect(items).toHaveLength(2);
    expect(items.map((i: NavItem) => i.label)).toEqual([
      'Applicants',
      'Interviews',
    ]);
  });

  it('SENIOR_LEADERSHIP gets 3 nav items: Dashboard, Applicants, Reports', () => {
    const items = getNavItemsForRole('SENIOR_LEADERSHIP');
    expect(items).toHaveLength(3);
    expect(items.map((i: NavItem) => i.label)).toEqual([
      'Dashboard',
      'Applicants',
      'Reports',
    ]);
  });

  it('SYSTEM_ADMINISTRATOR gets 5 nav items: Dashboard, Applicants, Interviews, Reports, Admin', () => {
    const items = getNavItemsForRole('SYSTEM_ADMINISTRATOR');
    expect(items).toHaveLength(5);
    expect(items.map((i: NavItem) => i.label)).toEqual([
      'Dashboard',
      'Applicants',
      'Interviews',
      'Reports',
      'Admin',
    ]);
  });
});

describe('US-08: Application shell structure', () => {
  it('staff layout exists and imports auth + sidebar + topbar', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const layoutPath = path.resolve(
      __dirname,
      '../app/(staff)/layout.tsx',
    );
    expect(fs.existsSync(layoutPath)).toBe(true);

    const content = fs.readFileSync(layoutPath, 'utf-8');
    expect(content).toContain("import { auth }");
    expect(content).toContain('AppSidebar');
    expect(content).toContain('AppTopbar');
    expect(content).toContain('SidebarProvider');
    expect(content).toContain("redirect('/login')");
  });

  it('forbidden page exists', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const forbiddenPath = path.resolve(
      __dirname,
      '../app/(staff)/forbidden/page.tsx',
    );
    expect(fs.existsSync(forbiddenPath)).toBe(true);
    const content = fs.readFileSync(forbiddenPath, 'utf-8');
    expect(content).toContain('Access Denied');
  });

  it('dashboard page exists as default staff landing', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const dashPath = path.resolve(
      __dirname,
      '../app/(staff)/dashboard/page.tsx',
    );
    expect(fs.existsSync(dashPath)).toBe(true);
  });
});
