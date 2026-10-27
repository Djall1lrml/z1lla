// Supabase (Postgres) data layer. Server-side only: it uses the service role key,
// which must never be exposed to the browser (do NOT prefix it with NEXT_PUBLIC_).
import { createClient } from "@supabase/supabase-js";
import { HttpError } from "./http";

let client;
export function sb() {
  if (!client) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new HttpError(500, "Database is not configured (set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY).");
    client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  }
  return client;
}

// Unwrap a Supabase response. Errors raised by our SQL functions (P0001) become 409s.
export function ok({ data, error }) {
  if (error) {
    if (error.code === "P0001") throw new HttpError(error.message === "Order not found" ? 404 : 409, error.message);
    console.error("Supabase error:", error);
    throw new HttpError(500, "Database error");
  }
  return data;
}

export async function getProducts() {
  return ok(await sb().from("products").select("id,n,c,p,s,d,i").order("id", { ascending: false }));
}

export async function getSettings() {
  const fallback = { wa: "213000000000", ig: "zilla.store" };
  try {
    const data = ok(await sb().from("settings").select("wa,ig").eq("id", 1).maybeSingle());
    return data || fallback;
  } catch {
    return fallback;
  }
}
