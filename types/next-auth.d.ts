import { DefaultSession } from 'next-auth';

// Module augmentation for NextAuth session user to include internal app fields
declare module 'next-auth' {
  interface Session {
    user: DefaultSession['user'] & {
      id?: string;
      nickname?: string | null;
      groupCode?: string | null;
    };
  }
}

export {};
