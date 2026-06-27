import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig, loadEnv } from 'vite';

const BACKEND_TARGET = 'http://127.0.0.1:8000';

const backendProxyPaths = [
  '/auth',
  '/bootstrap',
  '/onboarding',
  '/feeds',
  '/content',
  '/projects',
  '/events',
  '/governance',
  '/messages',
  '/notifications',
  '/users',
  '/search',
  '/scopes',
  '/platform',
  '/board',
  '/healthz',
  '/readyz'
];

function createBackendProxy() {
  const proxy: Record<string, { target: string; changeOrigin: boolean }> = {};

  for (const path of backendProxyPaths) {
    proxy[path] = { target: BACKEND_TARGET, changeOrigin: true };
  }

  return proxy;
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const useDevProxy = env.VITE_USE_DEV_PROXY === 'true';
  const lanHmrHost = env.VITE_LAN_HMR_HOST?.trim();

  return {
    plugins: [sveltekit()],
    server: {
      host: true,
      allowedHosts: true,
      strictPort: true,
      hmr: lanHmrHost
        ? {
            host: lanHmrHost,
            port: Number(env.VITE_DEV_PORT || 5173)
          }
        : undefined,
      proxy: useDevProxy ? createBackendProxy() : undefined
    }
  };
});
