declare module '@janua/nextjs' {
  import { ReactNode } from 'react';

  interface JanuaConfig {
    baseURL?: string;
  }

  interface JanuaProviderProps {
    children: ReactNode;
    config?: JanuaConfig;
  }

  export function JanuaProvider(props: JanuaProviderProps): JSX.Element;
  export function SignInForm(props: { redirectTo?: string }): JSX.Element;
  export function getSession(
    appId: string,
    apiKey: string,
    jwtSecret: string
  ): Promise<{
    user?: {
      id: string;
      email: string;
      name?: string;
      display_name?: string;
      role?: string;
    };
    session?: unknown;
  } | null>;
}
