/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BACKEND?: string;
  readonly VITE_API_URL?: string;
  readonly VITE_USE_DEV_PROXY?: string;
  readonly VITE_API_BEARER_TOKEN?: string;
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_SUPABASE_FUNCTIONS_URL?: string;
  readonly VITE_SUPABASE_SAME_ORIGIN?: string;
  readonly VITE_SIGNUP_ENABLED?: string;
  readonly VITE_PWA_ENABLED?: string;
  readonly VITE_PUSH_ENABLED?: string;
  readonly VITE_TURNSTILE_SITE_KEY?: string;
}

declare module '*?worker&url' {
  const workerUrl: string;
  export default workerUrl;
}
