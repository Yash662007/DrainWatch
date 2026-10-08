import { randomBytes } from "crypto";

export function generateId(prefix: string) {
  const time = Date.now().toString(36).toUpperCase();
  const rand = randomBytes(2).toString("hex").toUpperCase();
  return `${prefix}-${time}${rand}`;
}
