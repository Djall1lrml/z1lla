import { api, json } from "@/lib/http";
import { endSession } from "@/lib/auth";

export const POST = api(async () => {
  await endSession();
  return json({ ok: true });
});
