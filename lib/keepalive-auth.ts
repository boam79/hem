export function keepaliveAuthorized(headers: Headers): boolean {
  const secret = process.env.KEEPALIVE_SECRET;
  const cron = process.env.CRON_SECRET;
  const header = headers.get("x-keepalive-secret");
  const auth = headers.get("authorization");
  if (secret && header === secret) return true;
  if (cron && auth === `Bearer ${cron}`) return true;
  return false;
}
