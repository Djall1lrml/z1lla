import { api, body, json, HttpError } from "@/lib/http";
import { checkPassword, startSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

// very small in-memory brute-force guard: 8 attempts / 10 min / IP
const tries = new Map();

export const POST = api(async (req) => {
  const ip = (req.headers.get("x-forwarded-for") || "local").split(",")[0].trim();
  const now = Date.now();
  const t = tries.get(ip);
  if (t && now - t.t < 600_000 && t.n >= 8) throw new HttpError(429, "Too many attempts. Try again later.");
  const { password } = await body(req);
  if (!checkPassword(String(password ?? ""))) {
    tries.set(ip, { n: t && now - t.t < 600_000 ? t.n + 1 : 1, t: t && now - t.t < 600_000 ? t.t : now });
    throw new HttpError(401, "Wrong password");
  }
  tries.delete(ip);
  await startSession();
  return json({ ok: true });
});
