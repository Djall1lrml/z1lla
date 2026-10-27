import { api, json, HttpError } from "@/lib/http";
import { sb, ok } from "@/lib/db";

export const dynamic = "force-dynamic";

const digits = (s) => String(s || "").replace(/\D/g, "");

// Public order tracking: needs both the order number and the phone used at checkout.
export const GET = api(async (req) => {
  const sp = new URL(req.url).searchParams;
  const no = Number(String(sp.get("no") || "").replace("#", ""));
  const phone = digits(sp.get("phone"));
  if (!Number.isInteger(no) || no < 1 || phone.length < 8) throw new HttpError(400, "Enter your order number and phone.");
  const o = ok(await sb().from("orders").select("id,date,st,total,items,phone").eq("id", no).maybeSingle());
  if (!o || digits(o.phone).slice(-9) !== phone.slice(-9))
    throw new HttpError(404, "No order found with these details. Check the number and phone.");
  return json({ id: o.id, date: o.date, st: o.st, total: o.total, items: o.items.map((i) => ({ n: i.n, q: i.q })) });
});
