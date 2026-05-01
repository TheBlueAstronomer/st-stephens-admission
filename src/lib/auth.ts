import NextAuth from 'next-auth';
import type { Provider } from 'next-auth/providers';
import MicrosoftEntraID from 'next-auth/providers/microsoft-entra-id';
import Credentials from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/lib/db';
import type { UserRole } from '@/generated/prisma/client';

const providers: Provider[] = [
  MicrosoftEntraID({
    clientId: process.env.AZURE_AD_CLIENT_ID!,
    clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
    issuer: `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID}/v2.0`,
  }),
];

// Dev-only credentials provider — sign in by email without Microsoft
if (process.env.NODE_ENV === 'development') {
  providers.push(
    Credentials({
      id: 'dev-credentials',
      name: 'Dev Login',
      credentials: {
        email: { label: 'Email', type: 'email' },
      },
      async authorize(credentials) {
        const email = credentials?.email as string | undefined;
        if (!email) return null;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !user.isActive) return null;

        return { id: user.id, email: user.email, name: user.name, role: user.role, isActive: user.isActive };
      },
    }),
  );
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers,
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider !== 'microsoft-entra-id') return true;

      const email = user.email;
      if (!email) return '/login?error=no-email';

      const dbUser = await prisma.user.findUnique({ where: { email } });

      if (!dbUser) return '/login?error=unauthorized';
      if (!dbUser.isActive) return '/login?error=inactive';

      return true;
    },

    async jwt({ token, user, account }) {
      // On initial sign-in, look up the user from DB and embed role
      if (account && user?.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email },
        });
        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role as UserRole;
        }
      }
      return token;
    },

    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
      }
      return session;
    },
  },
});
