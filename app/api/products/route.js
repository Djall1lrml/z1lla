import { api, body, json, HttpError } from "@/lib/http";
import { sb, ok, getProducts } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { CATS } from "@/lib/constants";

export const dynamic = "force-dynamic";

export const GET = api(async () => json(await getProducts()));

export const POST = api(async (req) => {
  await requireAdmin();
  const b = await body(req);
  const n = String(b.n || "").trim().slice(0, 120);
  if (!n) throw new HttpError(400, "Name required");
  if (!CATS.includes(b.c)) throw new HttpError(400, "Invalid category");
  const p = Math.round(Number(b.p));
  const s = Math.round(Number(b.s));
  if (!(p >= 0) || !(s >= 0)) throw new HttpError(400, "Invalid price or stock");
  const i = String(b.i || "");
  if (i && (!i.startsWith("data:image/") || i.length > 600_000)) throw new HttpError(400, "Invalid image");
  const row = { n, c: b.c, p, s, d: String(b.d || "").slice(0, 300), i };
  const data = ok(await sb().from("products").insert(row).select("id,n,c,p,s,d,i").single());
  return json(data, 201);
});
