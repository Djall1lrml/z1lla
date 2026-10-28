"use client";
import Link from "next/link";
import { useState } from "react";
import { useStore } from "@/components/Store";
import { EM, fm } from "@/lib/constants";

export default function ProductDetail({ product, related }) {
  const { add } = useStore();
  const images = Array.isArray(product.i) && product.i.length ? product.i : [];
  const [active, setActive] = useState(0);
  const activeImage = images[active] || "";
  const out = product.s < 1;

  return (
    <div className="wrap" style={{ paddingTop: 28, paddingBottom: 48 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
        <Link href="/#shop" className="mu" style={{ textDecoration: "none" }}>← Back to shop</Link>
        <span className="pill">{product.c}</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.15fr) minmax(0, 0.85fr)", gap: 28 }} className="product-detail-layout">
        <div style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 18, padding: 18 }}>
          <div style={{ aspectRatio: "1 / 1", background: "linear-gradient(135deg,#eaf7ee,#f6d5c8)", borderRadius: 16, overflow: "hidden", border: "1px solid var(--line)" }}>
            {activeImage ? (
              <img src={activeImage} alt={product.n} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <div style={{ display: "grid", placeItems: "center", height: "100%", fontSize: 64 }}>{EM[product.c] || "📦"}</div>
            )}
          </div>

          {images.length > 1 && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(80px, 1fr))", gap: 10, marginTop: 14 }}>
              {images.map((img, idx) => (
                <button
                  key={`${img}-${idx}`}
                  type="button"
                  onClick={() => setActive(idx)}
                  style={{
                    border: idx === active ? "2px solid var(--g)" : "1px solid var(--line)",
                    borderRadius: 12,
                    overflow: "hidden",
                    padding: 0,
                    background: "transparent",
                    height: 86,
                    cursor: "pointer",
                  }}
                >
                  <img src={img} alt={`${product.n} ${idx + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </button>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div>
            <small className="mu" style={{ textTransform: "uppercase", letterSpacing: 1.3 }}>{product.c}</small>
            <h1 style={{ margin: "8px 0 10px", fontSize: "clamp(2rem, 4vw, 3rem)", lineHeight: 1.1 }}>{product.n}</h1>
            <div style={{ fontSize: 32, fontWeight: 900, color: "var(--g)" }}>{fm(product.p)}</div>
          </div>

          <div className="step" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <span className="mu">Availability</span>
              <strong style={{ color: !out ? "var(--g)" : "var(--r)" }}>
                {!out ? `${product.s} in stock` : "Sold out"}
              </strong>
            </div>
            <p style={{ margin: 0, color: "var(--mu)", lineHeight: 1.7 }}>{product.d || "No description provided for this item."}</p>
            <div className="product-detail-actions">
              <Link href="/#shop" className="btn o">Continue shopping</Link>
              <button className="btn r" disabled={out} onClick={() => add({ ...product, p: product.p, s: product.s })}>
                {out ? "Sold out" : "Add to cart"}
              </button>
            </div>
          </div>

          <div className="step">
            <b>Why buy this item?</b>
            <ul style={{ margin: "10px 0 0", paddingLeft: 18, color: "var(--mu)", lineHeight: 1.8 }}>
              <li>Fully tested before shipping</li>
              <li>Authentic vintage condition with honest listing</li>
              <li>Cash on delivery across Algeria</li>
            </ul>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 40 }}>
        <h2 style={{ marginBottom: 16 }}>You may also like</h2>
        <div className="grid">
          {related.length ? (
            related.map((item) => {
              const itemOut = item.s < 1;
              const img = item.i?.[0];
              return (
                <Link href={`/products/${item.id}`} key={item.id} className="p" style={{ textDecoration: "none" }}>
                  <div className="ph">
                    {img ? <img src={img} alt={item.n} /> : EM[item.c] || "📦"}
                    {itemOut ? <span className="tag">SOLD OUT</span> : item.s < 3 ? <span className="tag">LAST {item.s}</span> : null}
                  </div>
                  <div className="pb">
                    <small>{item.c}</small>
                    <b>{item.n}</b>
                    <small>{item.d}</small>
                    <span className="pr">{fm(item.p)}</span>
                  </div>
                </Link>
              );
            })
          ) : (
            <p className="mu">No related products in this category yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
