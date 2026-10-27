import { api, json } from "@/lib/http";
import { isAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const GET = api(async () => json({ admin: await isAdmin() }));
