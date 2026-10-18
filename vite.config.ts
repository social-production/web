import { paraglideVitePlugin } from '@inlang/paraglide-js';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig, loadEnv, type ProxyOptions } from 'vite';
import { backendProxyPaths } from './src/lib/dev/backendProxyPaths';
import { I18N_ENABLED } from './src/lib/i18n/config';

const BACKEND_TARGET = 'http://127.0.0.1:8000';

const htmlBypassPaths = new Set([
  '/projects',
  '/events',
  '/platform',
  '/feedback',
  '/messages',
  '/notifications',
  '/search',
  '/onboarding',
  '/invites'
]);

function bypassHtmlNavigation(req: {
  headers?: { accept?: string; upgrade?: string };
  url?: string;
}) {
  if (req.headers?.upgrade) {
    return;
  }
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
      ws: true,
      ...(htmlBypassPaths.has(path) ? { bypass: bypassHtmlNavigation } : {})
    };
  }

  return proxy;
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const useDevProxy = env.VITE_USE_DEV_PROXY === 'true';
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

  const proxy = useDevProxy ? createBackendProxy() : undefined;

  return {
    plugins,
    // MapLibre v6 worker pre-bundling fails under Vite's dep optimizer.
    optimizeDeps: {
      exclude: ['maplibre-gl']
    },
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
