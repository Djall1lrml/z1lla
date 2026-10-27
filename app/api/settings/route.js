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
  if (wa.length < 8) throw new HttpError(400, "Invalid WhatsApp number");
  if (!ig) throw new HttpError(400, "Invalid Instagram handle");
  return json(ok(await sb().from("settings").upsert({ id: 1, wa, ig }).select("wa,ig").single()));
});
