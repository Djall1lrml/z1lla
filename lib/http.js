import { NextResponse } from "next/server";

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export const json = (data, status = 200) => NextResponse.json(data, { status });

export async function body(req) {
  try {
    const b = await req.json();
    if (!b || typeof b !== "object") throw 0;
    return b;
  } catch {
    throw new HttpError(400, "Invalid JSON body");
  }
}

export function api(fn) {
  return async (req, ctx) => {
    try {
      return await fn(req, ctx);
    } catch (e) {
      if (e instanceof HttpError) return json({ error: e.message }, e.status);
      console.error(e);
      return json({ error: "Server error" }, 500);
    }
  };
}
