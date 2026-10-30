import { api, body, json, HttpError } from "@/lib/http";
import { sb, ok, getSettings } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const GET = api(async () => {
  await requireAdmin();
  return json(ok(await sb().from("orders").select("*").order("id", { ascending: false })));
});

// Public: customers place orders. Prices and stock are checked inside the database function.
export const POST = api(async (req) => {
  const b = await body(req);
  const name = String(b.name || "").trim().slice(0, 80);
  const phone = String(b.phone || "").trim().slice(0, 30);
  const wilaya = String(b.wilaya || "").trim().slice(0, 60);
  const addr = String(b.addr || "").trim().slice(0, 300);
  const deliveryType = String(b.delivery || "Home").trim() === "Desk" ? "Desk" : "Home";
  const deliveryFee = Math.round(Number(b.delivery_fee ?? (deliveryType === "Home" ? 0 : 0)));
  if (!name || !wilaya) throw new HttpError(400, "Please fill name, phone and wilaya.");
  if (phone.replace(/\D/g, "").length < 8) throw new HttpError(400, "Please enter a valid phone number.");
  if (!Array.isArray(b.items) || !b.items.length || b.items.length > 20) throw new HttpError(400, "Your cart is empty.");

  const settings = await getSettings();
  const wilayaFee = (settings.wilaya_fees || []).find((row) => row.wilaya === wilaya) || {};
  const fee = deliveryType === "Desk" ? Number(wilayaFee.desk_fee ?? settings.desk_fee ?? 0) : Number(wilayaFee.home_fee ?? settings.home_fee ?? 0);
  if (!Number.isFinite(fee) || fee < 0) throw new HttpError(400, "Invalid delivery fee.");

  const merged = new Map();
  for (const it of b.items) {
    const id = Number(it?.id);
    const q = Math.round(Number(it?.q));
    if (!Number.isInteger(id) || !(q >= 1) || q > 10) throw new HttpError(400, "Invalid cart item.");
    merged.set(id, (merged.get(id) || 0) + q);
  }
  const items = [...merged].map(([id, q]) => ({ id, q }));

  const o = ok(
    await sb().rpc("place_order", {
      p_name: name,
      p_phone: phone,
      p_wilaya: wilaya,
      p_addr: addr,
      p_delivery_type: deliveryType,
      p_delivery_fee: fee,
      p_items: items,
    })
  );
  return json({ id: o.id, total: o.total, items: o.items, delivery_type: o.delivery_type || deliveryType, delivery_fee: o.delivery_fee || fee }, 201);
});
