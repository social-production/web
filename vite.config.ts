import { paraglideVitePlugin } from '@inlang/paraglide-js';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig, loadEnv, type ProxyOptions } from 'vite';
import { backendProxyPaths } from './src/lib/dev/backendProxyPaths';
import { I18N_ENABLED } from './src/lib/i18n/config';

const BACKEND_TARGET = 'http://127.0.0.1:8000';
const SUPABASE_TARGET_DEFAULT = 'http://127.0.0.1:54321';

const htmlBypassPaths = new Set([
  '/projects',
  '/events',
  '/platform',
  '/messages',
  '/notifications',
  '/search'
]);

function bypassHtmlNavigation(req: { headers?: { accept?: string }; url?: string }) {
  const accept = req.headers?.accept ?? '';
  if (accept.includes('text/html')) {
    return req.url;
  }
}

function createBackendProxy(): Record<string, ProxyOptions> {
  const proxy: Record<string, ProxyOptions> = {};

  for (const path of backendProxyPaths) {
    proxy[path] = {
      target: BACKEND_TARGET,
      changeOrigin: true,
      ...(htmlBypassPaths.has(path) ? { bypass: bypassHtmlNavigation } : {})
    };
  }

  return proxy;
}

/** Same-origin proxy so the browser never talks directly to :54321 (avoids PNA/CORS/LAN 503s). */
function createSupabaseProxy(target: string): Record<string, ProxyOptions> {
  const proxy: Record<string, ProxyOptions> = {};
  for (const path of ['/auth/v1', '/functions/v1', '/rest/v1', '/storage/v1']) {
    proxy[path] = {
      target,
      changeOrigin: true,
      // Kong/edge can be slow on cold isolates; do not let the proxy give up early.
      timeout: 120_000,
      proxyTimeout: 120_000
    };
  }
  return proxy;
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const backend = (env.VITE_BACKEND ?? 'fastapi').trim().toLowerCase();
  const useDevProxy = env.VITE_USE_DEV_PROXY === 'true';
  const supabaseTarget = (env.VITE_SUPABASE_URL ?? SUPABASE_TARGET_DEFAULT).replace(/\/$/, '');
  const lanHmrHost = env.VITE_LAN_HMR_HOST?.trim();
  const plugins = [
    ...(I18N_ENABLED
      ? [
          paraglideVitePlugin({
            project: './project.inlang',
            outdir: './src/lib/paraglide'
          })
        ]
      : []),
    sveltekit()
  ];

  const proxy =
    backend === 'supabase'
      ? createSupabaseProxy(supabaseTarget)
      : useDevProxy
        ? createBackendProxy()
        : undefined;

  return {
    plugins,
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
      proxy
    }
  };
});
