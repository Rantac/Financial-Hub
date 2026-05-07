import NextAuth, { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: 'superadmin' | 'user';
    } & DefaultSession['user'];
  }

  interface User {
    role: 'superadmin' | 'user';
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: 'superadmin' | 'user';
  }
}
