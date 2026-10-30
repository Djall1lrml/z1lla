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
  const op = b.op !== undefined ? Math.round(Number(b.op)) : p;
  if (!(p >= 0) || !(s >= 0) || !(op >= 0)) throw new HttpError(400, "Invalid price or stock");

  const images = Array.isArray(b.i) ? b.i : typeof b.i === "string" && b.i ? [b.i] : [];
  for (const img of images) {
    if (typeof img !== "string" || !img.startsWith("data:image/") || img.length > 600_000) {
      throw new HttpError(400, "Invalid image");
    }
  }

  const row = { n, c: b.c, p, op, s, d: String(b.d || "").slice(0, 300), i: images.length ? images : [] };
  const insertWithPromo = await sb().from("products").insert(row).select("id,n,c,p,s,d,i,op").single();
  if (insertWithPromo.error) {
    if (insertWithPromo.error.code === "42703" && String(insertWithPromo.error.message).includes("op")) {
      const { op: _op, ...legacyRow } = row;
      const data = ok(await sb().from("products").insert(legacyRow).select("id,n,c,p,s,d,i").single());
      return json({ ...data, op: Number(data.p ?? 0) }, 201);
    }
    throw ok(insertWithPromo);
  }
  return json(insertWithPromo.data, 201);
});
