"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "./Store";
import { DELIVERY_TYPES, WILAYAS, fm } from "@/lib/constants";

export default function Cart() {
  const { cart, open, setOpen, remove, clear, total, settings } = useStore();
  const router = useRouter();
  const [f, setF] = useState({ name: "", phone: "", wilaya: WILAYAS[0], delivery: "Home", addr: "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState(null);

  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));
  const selectedWilayaFee = (settings?.wilaya_fees || []).find((row) => row.wilaya === f.wilaya) || {};
  const deliveryFee = Number(f.delivery === "Home" ? (selectedWilayaFee.home_fee ?? settings?.home_fee ?? 0) : (selectedWilayaFee.desk_fee ?? settings?.desk_fee ?? 0));
  const grandTotal = total + deliveryFee;
  const close = () => {
    setOpen(false);
    setDone(null);
    setErr("");
  };

  async function submit() {
    setErr("");
    if (!f.name.trim() || !f.phone.trim() || !f.wilaya.trim()) return setErr("Please fill name, phone and wilaya.");
    setBusy(true);
    try {
      const r = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...f,
          delivery_fee: deliveryFee,
          items: cart.map((c) => ({ id: c.id, q: c.q })),
        }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || "Something went wrong. Please try again.");
      setDone({ ...d, name: f.name, phone: f.phone, wilaya: f.wilaya, addr: f.addr, delivery: f.delivery, delivery_fee: deliveryFee });
      clear();
      router.refresh(); // refresh stock on the page
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  let body;
  if (done) {
    const msg =
      `New order #${done.id}\n` +
      done.items.map((i) => `${i.q}x ${i.n}`).join("\n") +
      `\nTotal: ${done.total} DA\n${done.name} | ${done.phone} | ${done.wilaya} | ${done.delivery} | ${done.addr}`;
    body = (
      <>
        <h3>Order sent ✅</h3>
        <p>
          Your order number: <b>#{done.id}</b>. Keep it for <i>Suivi commande</i>.
        </p>
        <p>Thank you {done.name}! We will call you to confirm. You can also send it on WhatsApp:</p>
        <a className="btn" style={{ display: "block" }} target="_blank" rel="noopener noreferrer"
           href={`https://wa.me/${settings.wa}?text=${encodeURIComponent(msg)}`}>
          Send via WhatsApp
        </a>
        <br />
        <button className="btn o" onClick={close}>Close</button>
      </>
    );
  } else if (!cart.length) {
    body = <p>Your cart is empty.</p>;
  } else {
    body = (
      <>
        {cart.map((c) => (
          <div className="row cart-line" key={c.id}>
            <div className="cart-line-meta">
              <span className="cart-line-name">{c.n}</span>
              <small className="mu">{fm(c.p)} × {c.q}</small>
            </div>
            <div className="cart-line-total">{fm(c.p * c.q)}</div>
            <button className="btn o cart-remove" aria-label="Remove" onClick={() => remove(c.id)}>✕</button>
          </div>
        ))}
        <div style={{ display: "grid", gap: 8, margin: "10px 0" }}>
          <div><b>Delivery</b></div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {DELIVERY_TYPES.map((type) => {
              const fee = Number(type === "Home" ? (selectedWilayaFee.home_fee ?? settings?.home_fee ?? 0) : (selectedWilayaFee.desk_fee ?? settings?.desk_fee ?? 0));
              return (
                <button
                  key={type}
                  type="button"
                  className={"btn" + (f.delivery === type ? "" : " o")}
                  style={{ flex: 1, minWidth: 90 }}
                  onClick={() => setF((s) => ({ ...s, delivery: type }))}
                >
                  {type} · {fm(fee)}
                </button>
              );
            })}
          </div>
          <div><b>Products: {fm(total)}</b></div>
          <div><b>Delivery: {fm(deliveryFee)}</b></div>
          <div><b>Total: {fm(grandTotal)}</b></div>
        </div>
        <div className="f" style={{ gridTemplateColumns: "1fr" }}>
          <input placeholder="Full name" value={f.name} onChange={set("name")} autoComplete="name" />
          <input placeholder="Phone" value={f.phone} onChange={set("phone")} autoComplete="tel" inputMode="tel" />
          <select value={f.wilaya} onChange={set("wilaya")}>
            {WILAYAS.map((w) => <option key={w} value={w}>{w}</option>)}
          </select>
          <textarea placeholder="Address / delivery desk" value={f.addr} onChange={set("addr")} />
        </div>
        {err && <p className="err">{err}</p>}
        <button className="btn r" style={{ width: "100%" }} disabled={busy} onClick={submit}>
          {busy ? "Sending…" : `Confirm order · ${fm(grandTotal)}`}
        </button>
      </>
    );
  }

  return (
    <div className={"dr" + (open ? " on" : "")}>
      <div className="row">
        <b>Your cart</b>
        <button className="btn o" onClick={close}>Close</button>
      </div>
      {body}
    </div>
  );
}
