import { api, body, json, HttpError } from "@/lib/http";
import { sb, ok } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { CATS } from "@/lib/constants";

export const dynamic = "force-dynamic";

export const PATCH = api(async (req, { params }) => {
  await requireAdmin();
  const id = Number((await params).id);
  const b = await body(req);

  let current;
  const currentRes = await sb().from("products").select("p,op").eq("id", id).maybeSingle();
  if (currentRes.error) {
    if (currentRes.error.code === "42703" && String(currentRes.error.message).includes("op")) {
      current = await ok(await sb().from("products").select("p").eq("id", id).maybeSingle());
    } else {
      throw ok(currentRes);
    }
  } else {
    current = currentRes.data;
  }
  if (!current) throw new HttpError(404, "Product not found");

  const patch = {};
  if (b.p !== undefined) {
    const p = Math.round(Number(b.p));
    if (!(p >= 0)) throw new HttpError(400, "Invalid price");
    patch.p = p;
    if (!(current.op > 0)) patch.op = current.p ?? p;
  }
  if (b.s !== undefined) {
    const s = Math.round(Number(b.s));
    if (!(s >= 0)) throw new HttpError(400, "Invalid stock");
    patch.s = s;
  }
  if (b.n !== undefined) {
    const n = String(b.n).trim().slice(0, 120);
    if (!n) throw new HttpError(400, "Name required");
    patch.n = n;
  }
  if (b.d !== undefined) patch.d = String(b.d).slice(0, 300);
  if (b.c !== undefined) {
    if (!CATS.includes(b.c)) throw new HttpError(400, "Invalid category");
    patch.c = b.c;
  }
  if (b.op !== undefined) {
    const op = Math.round(Number(b.op));
    if (!(op >= 0)) throw new HttpError(400, "Invalid original price");
    patch.op = op;
  }
  if (!Object.keys(patch).length) throw new HttpError(400, "Nothing to update");

  const updateRes = await sb().from("products").update(patch).eq("id", id).select("id,n,c,p,s,d,i,op").maybeSingle();
  if (updateRes.error) {
    if (updateRes.error.code === "42703" && String(updateRes.error.message).includes("op")) {
      const { op: _op, ...legacyPatch } = patch;
      const data = ok(await sb().from("products").update(legacyPatch).eq("id", id).select("id,n,c,p,s,d,i").maybeSingle());
      if (!data) throw new HttpError(404, "Product not found");
      return json({ ...data, op: Number(data.p ?? 0) });
    }
    throw ok(updateRes);
  }
  if (!updateRes.data) throw new HttpError(404, "Product not found");
  return json(updateRes.data);
});

export const DELETE = api(async (_req, { params }) => {
  await requireAdmin();
  const id = Number((await params).id);
  const data = ok(await sb().from("products").delete().eq("id", id).select("id"));
  if (!data?.length) throw new HttpError(404, "Product not found");
  return json({ ok: true });
});
