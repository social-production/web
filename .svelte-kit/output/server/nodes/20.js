import * as universal from '../entries/pages/search/_page.ts.js';

export const index = 20;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/search/_page.svelte.js')).default;
export { universal };
export const universal_id = "src/routes/search/+page.ts";
export const imports = ["_app/immutable/nodes/20.tgqM2joT.js","_app/immutable/chunks/BUhjs0ca.js","_app/immutable/chunks/CTP_sk8P.js","_app/immutable/chunks/BaheMG_i.js","_app/immutable/chunks/kQDwlutK.js","_app/immutable/chunks/BfXBhBuV.js","_app/immutable/chunks/DC4PtBbO.js","_app/immutable/chunks/BifhI8mU.js","_app/immutable/chunks/CKFfB9eO.js","_app/immutable/chunks/DuWrDhcz.js","_app/immutable/chunks/B3-XwVGj.js","_app/immutable/chunks/8gkOnl04.js"];
export const stylesheets = ["_app/immutable/assets/20.CpP2UhjC.css"];
export const fonts = [];
