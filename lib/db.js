// Supabase (Postgres) data layer. Server-side only: it uses the service role key,
// which must never be exposed to the browser (do NOT prefix it with NEXT_PUBLIC_).
import { createClient } from "@supabase/supabase-js";
import { HttpError } from "./http";
import { WILAYAS } from "./constants";

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

function normalizeImages(value) {
  if (Array.isArray(value)) return value;
  if (typeof value !== "string") return [];
  const trimmed = value.trim();
  if (!trimmed) return [];
  if (trimmed.startsWith("[")) {
    try {
      const parsed = JSON.parse(trimmed);
      return Array.isArray(parsed) ? parsed.filter((item) => typeof item === "string") : [];
    } catch {
      return [];
    }
  }
  return [trimmed];
}

export async function getProducts() {
  const { data, error } = await sb().from("products").select("id,n,c,p,s,d,i,op").order("id", { ascending: false });
  if (error) {
    if (error.code === "42703" && String(error.message).includes("op")) {
      const legacy = await ok(await sb().from("products").select("id,n,c,p,s,d,i").order("id", { ascending: false }));
      return legacy.map((product) => ({ ...product, i: normalizeImages(product.i), op: Number(product.p ?? 0) }));
    }
    throw ok({ data, error });
  }
  return data.map((product) => ({ ...product, i: normalizeImages(product.i), op: Number(product.op ?? product.p ?? 0) }));
}

export async function getProductById(id) {
  const { data, error } = await sb().from("products").select("id,n,c,p,s,d,i,op").eq("id", id).maybeSingle();
  if (error) {
    if (error.code === "42703" && String(error.message).includes("op")) {
      const legacy = await ok(await sb().from("products").select("id,n,c,p,s,d,i").eq("id", id).maybeSingle());
      if (!legacy) return null;
      return { ...legacy, i: normalizeImages(legacy.i), op: Number(legacy.p ?? 0) };
    }
    throw ok({ data, error });
  }
  if (!data) return null;
  return { ...data, i: normalizeImages(data.i), op: Number(data.op ?? data.p ?? 0) };
}

export async function getSettings() {
  const fallback = {
    wa: "213000000000",
    ig: "zilla.store",
    home_fee: 0,
    desk_fee: 0,
    wilaya_fees: WILAYAS.map((wilaya) => ({ wilaya, home_fee: 0, desk_fee: 0 })),
  };

  try {
    let settingsResult;
    try {
      settingsResult = await sb().from("settings").select("wa,ig,home_fee,desk_fee").eq("id", 1).maybeSingle();
    } catch {
      settingsResult = await sb().from("settings").select("wa,ig").eq("id", 1).maybeSingle();
    }

    const settings = settingsResult?.data || {};
    const defaultHomeFee = Number(settings.home_fee ?? 0);
    const defaultDeskFee = Number(settings.desk_fee ?? 0);

    let fees = [];
    try {
      const feesResult = await sb().from("wilaya_fees").select("wilaya,home_fee,desk_fee").order("wilaya", { ascending: true });
      fees = Array.isArray(feesResult?.data) ? feesResult.data : [];
    } catch {
      fees = [];
    }

    const map = new Map(
      fees.map((row) => [
        String(row.wilaya || ""),
        { wilaya: String(row.wilaya || ""), home_fee: Number(row.home_fee ?? 0), desk_fee: Number(row.desk_fee ?? 0) },
      ])
    );

    const wilayaFees = WILAYAS.map((wilaya) => ({
      wilaya,
      home_fee: Number(map.get(wilaya)?.home_fee ?? defaultHomeFee),
      desk_fee: Number(map.get(wilaya)?.desk_fee ?? defaultDeskFee),
    }));

    return {
      wa: settings.wa || fallback.wa,
      ig: settings.ig || fallback.ig,
      home_fee: defaultHomeFee,
      desk_fee: defaultDeskFee,
      wilaya_fees: wilayaFees,
    };
  } catch (error) {
    const message = error && error.message ? String(error.message) : "";
    if (message.includes("does not exist") || message.includes("42703") || message.includes("42P01")) {
      return fallback;
    }
    return fallback;
  }
}
