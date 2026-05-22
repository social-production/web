import { error } from "@sveltejs/kit";
import { m as getPost } from "../../../../chunks/details.js";
const load = async ({ params }) => {
  const post = await getPost(params.id);
  if (!post) {
    throw error(404, "Post not found");
  }
  return { post };
};
export {
  load
};
