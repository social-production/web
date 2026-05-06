import { error } from "@sveltejs/kit";
import { b as getProject } from "../../../../chunks/details.js";
const load = async ({ params }) => {
  const project = await getProject(params.slug);
  if (!project) {
    throw error(404, "Project not found");
  }
  return { project };
};
export {
  load
};
