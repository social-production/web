import * as universal from '../entries/pages/search/_page.ts.js';

export const index = 25;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/search/_page.svelte.js')).default;
export { universal };
export const universal_id = "src/routes/search/+page.ts";
export const imports = ["_app/immutable/nodes/25.CyMhAeDG.js","_app/immutable/chunks/DmmZ4dUA.js","_app/immutable/chunks/D10GFEir.js","_app/immutable/chunks/BriRf5Ew.js","_app/immutable/chunks/qg8vPTS7.js","_app/immutable/chunks/Crk0g78b.js","_app/immutable/chunks/CHcPgaOC.js","_app/immutable/chunks/Bgm58JKr.js","_app/immutable/chunks/C5EuFZRK.js","_app/immutable/chunks/BwYMiQlm.js","_app/immutable/chunks/Ch6pQuGq.js"];
export const stylesheets = ["_app/immutable/assets/25.CpP2UhjC.css"];
export const fonts = [];
