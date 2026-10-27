"use client";
import { useState } from "react";
import { fm, STEPS, STEP_LABELS } from "@/lib/constants";

export default function Suivi() {
  const [no, setNo] = useState("");
  const [phone, setPhone] = useState("");
  const [res, setRes] = useState(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function track(e) {
    e.preventDefault();
    setErr("");
    setRes(null);
    setBusy(true);
    try {
      const r = await fetch(`/api/track?no=${encodeURIComponent(no.trim())}&phone=${encodeURIComponent(phone.trim())}`);
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || "Something went wrong.");
      setRes(d);
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  const idx = res ? STEPS.indexOf(res.st) : -1;

  return (
    <div className="wrap" style={{ maxWidth: 640, paddingTop: 30 }}>
      <h2>📦 Suivi commande</h2>
      <p className="mu">Enter your order number and phone to see where your order is.</p>
      <form onSubmit={track}>
        <div className="f">
          <input placeholder="Order number (e.g. 10001)" value={no} onChange={(e) => setNo(e.target.value)} inputMode="numeric" />
          <input placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" />
        </div>
        <button className="btn" disabled={busy}>{busy ? "Searching…" : "Track"}</button>
      </form>

      <div style={{ marginTop: 20 }}>
        {err && <p className="err">{err}</p>}
        {res && (
          <div className="step">
            <b style={{ fontSize: 18 }}>Order #{res.id}</b>
            <br />
            <small className="mu">{new Date(res.date).toLocaleString()}</small>
            <p>
              {res.items.map((x, i) => (
                <span key={i}>{x.q}× {x.n}<br /></span>
              ))}
            </p>
            <p>Total: <b>{fm(res.total)}</b></p>
            {res.st === "Cancelled" ? (
              <p className="err">This order was cancelled.</p>
            ) : (
              <div style={{ display: "flex", gap: 6 }}>
                {STEP_LABELS.map((l, k) => (
                  <div key={l} style={{ flex: 1, textAlign: "center", fontSize: 13 }}>
                    <div style={{ height: 8, borderRadius: 4, marginBottom: 6, background: k <= idx ? "var(--g)" : "var(--line)" }} />
                    {l}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
