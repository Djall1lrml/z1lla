import crypto from "crypto";
import { cookies } from "next/headers";
import { HttpError } from "./http";

const NAME = "zilla_admin";
const DAY = 86400;
const prod = process.env.NODE_ENV === "production";

const secret = () => process.env.ADMIN_SECRET || (prod ? null : "dev-secret-change-me");
const password = () => process.env.ADMIN_PASSWORD || (prod ? null : "zilla123");

const sha = (v) => crypto.createHash("sha256").update(String(v)).digest();
const sign = (v) => crypto.createHmac("sha256", secret()).update(v).digest("hex");

export function checkPassword(input) {
  const real = password();
  if (!real || !secret()) return false; // production without env vars: login disabled
  return crypto.timingSafeEqual(sha(input), sha(real));
}

export async function startSession() {
  const exp = String(Date.now() + 7 * DAY * 1000);
  (await cookies()).set(NAME, `${exp}.${sign(exp)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: prod,
    path: "/",
    maxAge: 7 * DAY,
  });
}

export async function endSession() {
  (await cookies()).delete(NAME);
}

export async function isAdmin() {
  if (!secret()) return false;
  const v = (await cookies()).get(NAME)?.value;
  if (!v) return false;
  const [exp, sig] = v.split(".");
  if (!exp || !sig || Number(exp) < Date.now()) return false;
  const a = Buffer.from(sig);
  const b = Buffer.from(sign(exp));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export async function requireAdmin() {
  if (!(await isAdmin())) throw new HttpError(401, "Unauthorized");
}
