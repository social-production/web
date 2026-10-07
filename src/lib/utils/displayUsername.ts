/** Long names are cut here so share and sort controls keep their own space. */
export const USERNAME_DISPLAY_LIMIT = 18;

export function displayUsername(username: string) {
  if (username.length <= USERNAME_DISPLAY_LIMIT) {
    return username;
  }

  return `${username.slice(0, USERNAME_DISPLAY_LIMIT - 1)}…`;
}
