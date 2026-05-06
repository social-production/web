import { f as bind_props } from "./renderer.js";
import { E as EventCard } from "./EventCard.js";
import { P as ProjectCard } from "./ProjectCard.js";
import { T as ThreadCard } from "./ThreadCard.js";
function PublicFeedCard($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let item = $$props["item"];
    if (item.kind === "project") {
      $$renderer2.push("<!--[0-->");
      ProjectCard($$renderer2, { item });
    } else if (item.kind === "thread") {
      $$renderer2.push("<!--[1-->");
      ThreadCard($$renderer2, { item });
    } else {
      $$renderer2.push("<!--[-1-->");
      EventCard($$renderer2, { item });
    }
    $$renderer2.push(`<!--]-->`);
    bind_props($$props, { item });
  });
}
export {
  PublicFeedCard as P
};
