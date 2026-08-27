import { nanoid } from "nanoid";
import { NANOID_SIZE } from "@/config/limits";

export function newSessionId(): string {
  return nanoid(NANOID_SIZE);
}
