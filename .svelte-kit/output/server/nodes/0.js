import * as universal from '../entries/pages/_layout.ts.js';

export const index = 0;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/_layout.svelte.js')).default;
export { universal };
export const universal_id = "src/routes/+layout.ts";
export const imports = ["_app/immutable/nodes/0.B3Omakcd.js","_app/immutable/chunks/C8BZa76B.js","_app/immutable/chunks/CWeFt6jb.js","_app/immutable/chunks/DO0mf8hQ.js","_app/immutable/chunks/DmmZ4dUA.js","_app/immutable/chunks/D10GFEir.js","_app/immutable/chunks/BriRf5Ew.js","_app/immutable/chunks/qg8vPTS7.js","_app/immutable/chunks/kFa3k0gM.js","_app/immutable/chunks/DRCqAsnK.js","_app/immutable/chunks/Crk0g78b.js","_app/immutable/chunks/CHcPgaOC.js","_app/immutable/chunks/BIGFs4IE.js","_app/immutable/chunks/Bgm58JKr.js","_app/immutable/chunks/C5EuFZRK.js","_app/immutable/chunks/Ch6pQuGq.js","_app/immutable/chunks/ZBRnF01E.js","_app/immutable/chunks/lxeEh-JU.js","_app/immutable/chunks/DHutl17Y.js","_app/immutable/chunks/BLLF-Nh-.js","_app/immutable/chunks/oxMorc5X.js","_app/immutable/chunks/Co5Z38PE.js","_app/immutable/chunks/BwYMiQlm.js","_app/immutable/chunks/Bfc47y5P.js","_app/immutable/chunks/CnTf928e.js","_app/immutable/chunks/BGe2dR8i.js","_app/immutable/chunks/DVRpEZq1.js"];
export const stylesheets = ["_app/immutable/assets/CountBadge.CLQ_VzHe.css","_app/immutable/assets/SubjectTablet.B2rIXRdg.css","_app/immutable/assets/0.CgkbCWvh.css"];
export const fonts = [];
