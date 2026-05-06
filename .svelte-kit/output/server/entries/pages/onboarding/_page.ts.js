import { a as getOnboarding } from "../../../chunks/account.js";
const load = async () => {
  return {
    onboarding: await getOnboarding()
  };
};
export {
  load
};
