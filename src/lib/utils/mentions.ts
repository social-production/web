export function activeMention(value: string, cursor: number) {
  const upto = value.slice(0, Math.max(0, cursor));
  const match = upto.match(/(^|[^\w])@([A-Za-z0-9_-]{1,32})$/);
  if (!match) {
    return null;
  }
  const query = match[2];
  return { query, start: cursor - query.length - 1 };
}

export function insertMention(value: string, start: number, cursor: number, username: string) {
  const next = `${value.slice(0, start)}@${username} ${value.slice(cursor)}`;
  return { value: next, caret: start + username.length + 2 };
}
