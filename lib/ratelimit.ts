import { IP_SESSION_PER_HOUR } from "@/config/limits";

export function clientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }
  return headers.get("x-real-ip") || "unknown";
}

export function hourKey(ip: string, at: Date): string {
  const y = at.getUTCFullYear();
  const mo = String(at.getUTCMonth() + 1).padStart(2, "0");
  const d = String(at.getUTCDate()).padStart(2, "0");
  const h = String(at.getUTCHours()).padStart(2, "0");
  return `ip:${ip}:${y}${mo}${d}${h}`;
}

export function wouldExceed(count: number, limit = IP_SESSION_PER_HOUR): boolean {
  return count >= limit;
}
