import { paraglideVitePlugin } from '@inlang/paraglide-js';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig, loadEnv } from 'vite';
import { backendProxyPaths } from './src/lib/dev/backendProxyPaths';
import { I18N_ENABLED } from './src/lib/i18n/config';

const BACKEND_TARGET = 'http://127.0.0.1:8000';

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

function createBackendProxy() {
  const proxy: Record<
    string,
    {
      target: string;
      changeOrigin: boolean;
      bypass?: (req: { headers?: { accept?: string }; url?: string }) => string | undefined;
    }
  > = {};

  for (const path of backendProxyPaths) {
    proxy[path] = {
      target: BACKEND_TARGET,
      changeOrigin: true,
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
      proxy: useDevProxy ? createBackendProxy() : undefined
    }
  };
});
