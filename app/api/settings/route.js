import { api, body, json, HttpError } from "@/lib/http";
import { sb, ok, getSettings } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const GET = api(async () => json(await getSettings()));

export const PUT = api(async (req) => {
  await requireAdmin();
  const b = await body(req);
  const wa = String(b.wa || "").replace(/\D/g, "");
  const ig = String(b.ig || "").trim().replace(/^@/, "").replace(/[^\w.]/g, "");
  const homeFee = Number(b.home_fee ?? 0);
  const deskFee = Number(b.desk_fee ?? 0);
  if (wa.length < 8) throw new HttpError(400, "Invalid WhatsApp number");
  if (!ig) throw new HttpError(400, "Invalid Instagram handle");
  if (!Number.isFinite(homeFee) || homeFee < 0) throw new HttpError(400, "Invalid home delivery fee");
  if (!Number.isFinite(deskFee) || deskFee < 0) throw new HttpError(400, "Invalid desk delivery fee");

  let base;
  try {
    base = ok(await sb().from("settings").upsert({ id: 1, wa, ig, home_fee: homeFee, desk_fee: deskFee }).select("wa,ig,home_fee,desk_fee").single());
  } catch (error) {
    base = ok(await sb().from("settings").upsert({ id: 1, wa, ig }).select("wa,ig").single());
    base.home_fee = homeFee;
    base.desk_fee = deskFee;
  }

  const wilayaRows = Array.isArray(b.wilaya_fees) ? b.wilaya_fees : [];
  if (wilayaRows.length) {
    const rows = wilayaRows
      .map((row) => ({
        wilaya: String(row.wilaya || "").trim(),
        home_fee: Math.round(Number(row.home_fee ?? 0)),
        desk_fee: Math.round(Number(row.desk_fee ?? 0)),
      }))
      .filter((row) => row.wilaya && Number.isFinite(row.home_fee) && Number.isFinite(row.desk_fee));

    if (rows.length) {
      const { error } = await sb().from("wilaya_fees").upsert(rows, { onConflict: "wilaya" });
      if (error) {
        if (error.code === "42P01" || error.code === "42703") {
          // Table or column not available yet; keep the global settings update but do not crash.
        } else {
          throw new HttpError(500, error.message || "Database error");
        }
      }
    }
  }

  let finalFees = [];
  try {
    finalFees = await sb().from("wilaya_fees").select("wilaya,home_fee,desk_fee").order("wilaya", { ascending: true }).then((r) => r.data || []);
  } catch {
    finalFees = [];
  }
  return json({ ...base, wilaya_fees: finalFees });
});
