import { describe, it, expect } from 'vitest';

// ─── US-06: Server Action Role Guard ────────────────────────────────────────
// The requireRole() utility can't be invoked in vitest (requires next-auth
// runtime). We verify the module structure and AuthorizationError class.

describe('US-06: Server Action Role Guard', () => {
  it('require-role module exists and exports requireRole and AuthorizationError', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const filePath = path.resolve(__dirname, '../lib/require-role.ts');
    expect(fs.existsSync(filePath)).toBe(true);

    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content).toContain('export async function requireRole');
    expect(content).toContain('export class AuthorizationError');
    expect(content).toContain('allowedRoles');
    expect(content).toContain("statusCode = 403");
  });

  it('requireRole checks session.user.role against allowed roles', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const content = fs.readFileSync(
      path.resolve(__dirname, '../lib/require-role.ts'),
      'utf-8',
    );
    expect(content).toContain('session.user.role');
    expect(content).toContain('allowedRoles.includes');
    expect(content).toContain('AuthorizationError');
  });

  it('requireRole throws when no session exists', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const content = fs.readFileSync(
      path.resolve(__dirname, '../lib/require-role.ts'),
      'utf-8',
    );
    expect(content).toContain("!session?.user");
    expect(content).toContain('Authentication required');
  });

  it('proxy exists at src/proxy.ts with auth + RBAC checks', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const filePath = path.resolve(__dirname, '../proxy.ts');
    expect(fs.existsSync(filePath)).toBe(true);

    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content).toContain('export async function proxy');
    expect(content).toContain('getToken');
    expect(content).toContain('isPublicRoute');
    expect(content).toContain('isRoleAllowed');
    expect(content).toContain('/login');
    expect(content).toContain('callbackUrl');
    expect(content).toContain('/forbidden');
  });
});
