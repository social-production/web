import adapterNode from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapterNode(),
    // Registration is gated by VITE_PWA_ENABLED in the root layout.
    serviceWorker: {
      register: false
    }
  }
};

export default config;
