import adapterNode from '@sveltejs/adapter-node';
import adapterVercel from '@sveltejs/adapter-vercel';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    // Vercel sets VERCEL=1 during its builds; local/Docker keep the Node adapter.
    adapter: process.env.VERCEL ? adapterVercel() : adapterNode()
  }
};

export default config;
