import { api, body, json, HttpError } from "@/lib/http";
import { sb, ok } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { STATUSES } from "@/lib/constants";

export const dynamic = "force-dynamic";

export const PATCH = api(async (req, { params }) => {
  await requireAdmin();
  const id = Number((await params).id);
  const { st } = await body(req);
  if (!STATUSES.includes(st)) throw new HttpError(400, "Invalid status");
  // The SQL function also returns stock on cancel / takes it again on reopen.
  return json(ok(await sb().rpc("set_order_status", { p_id: id, p_st: st })));
});
