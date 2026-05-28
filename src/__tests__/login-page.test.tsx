import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// Mock next-auth/react to avoid importing next/server
vi.mock('next-auth/react', () => ({
  signIn: vi.fn(),
  signOut: vi.fn(),
}));

import { LoginCard } from '@/features/auth/components/login-card';

// ─── US-07: Login Screen ────────────────────────────────────────────────────

describe('US-07: Login Card', () => {
  it('renders the Microsoft sign-in button', () => {
    render(<LoginCard />);
    expect(screen.getByText('Sign in with Microsoft')).toBeInTheDocument();
  });

  it('renders the Staff Portal badge', () => {
    render(<LoginCard />);
    expect(screen.getByText('Staff Portal')).toBeInTheDocument();
  });

  it('renders the heading "Sign in to Admissions"', () => {
    render(<LoginCard />);
    expect(screen.getByText('Sign in to Admissions')).toBeInTheDocument();
  });

  it('does NOT show an error alert when no error prop', () => {
    render(<LoginCard />);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('shows unauthorized error message when error=unauthorized', () => {
    render(<LoginCard error="unauthorized" />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(
      screen.getByText(/not authorised to access the admissions system/i),
    ).toBeInTheDocument();
  });

  it('shows inactive error message when error=inactive', () => {
    render(<LoginCard error="inactive" />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(
      screen.getByText(/account has been deactivated/i),
    ).toBeInTheDocument();
  });

  it('shows session expired message for unknown error codes', () => {
    render(<LoginCard error="something-else" />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(
      screen.getByText(/session has expired/i),
    ).toBeInTheDocument();
  });
});
