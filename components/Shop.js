"use client";
import Link from "next/link";
import { useStore } from "./Store";
import { CATS, EM, fm } from "@/lib/constants";

export default function Shop({ products, cat, settings }) {
  const { q, add, cart } = useStore();
  const list = products.filter(
    (x) => (cat === "All" || x.c === cat) && x.n.toLowerCase().includes(q.trim().toLowerCase())
  );

  return (
    <>
      <section className="hero">
        <div>
          <span className="pill">VINTAGE TECH · ALGERIA</span>
          <h1>Vintage tech.<br /><span>Zero hype.</span></h1>
          <p>
            Tested vintage digital cameras, PSP, iPods and more, picked one by one and delivered to your door.
            Follow the drops on Instagram @{settings.ig}.
          </p>
          <p>
            <Link className="btn r" href="/#shop">Shop now</Link>{" "}
            <Link className="btn o" href="/#how">How it works</Link>
          </p>
        </div>
        <img src="/logo.jpg" alt="Zilla" />
      </section>

      <div className="wrap">
        <div className="trust">
          <div>✅ <b>Every item tested</b><br /><small className="mu">Working before it ships</small></div>
          <div>🚚 <b>58 wilayas</b><br /><small className="mu">Fast delivery</small></div>
          <div>💵 <b>Cash on delivery</b><br /><small className="mu">Pay when you receive</small></div>
          <div>📸 <b>Real photos</b><br /><small className="mu">What you see is what you get</small></div>
        </div>

        <h2>Browse by category</h2>
        <div className="cats">
          {CATS.map((c) => (
            <Link key={c} className="ct" href={`/?cat=${encodeURIComponent(c)}#shop`}>
              <i>{EM[c]}</i>
              <b>{c}</b>
              <br />
              <small className="mu">{products.filter((x) => x.c === c).length} items</small>
            </Link>
          ))}
        </div>

        <h2 id="shop">
          {cat === "All" ? "All products" : cat}{" "}
          {cat !== "All" && (
            <Link href="/#shop" className="mu" style={{ fontSize: 14, fontWeight: 400 }}>show all</Link>
          )}
        </h2>
        <div className="grid">
          {list.length ? (
            list.map((x) => {
              const inCart = cart.find((c) => c.id === x.id)?.q || 0;
              const out = x.s < 1;
              const maxed = !out && inCart >= x.s;
              return (
                <div className="p" key={x.id}>
                  <div className="ph">
                    {x.i ? <img src={x.i} alt={x.n} /> : EM[x.c] || "📦"}
                    {out ? <span className="tag">SOLD OUT</span> : x.s < 3 ? <span className="tag">LAST {x.s}</span> : null}
                  </div>
                  <div className="pb">
                    <small>{x.c}</small>
                    <b>{x.n}</b>
                    <small>{x.d}</small>
                    <span className="pr">{fm(x.p)}</span>
                    <button className="btn" disabled={out || maxed} onClick={() => add(x)}>
                      {out ? "Sold out" : maxed ? "Max in cart" : "Add to cart"}
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <p>No products found.</p>
          )}
        </div>

        <h2 id="how">How to order</h2>
        <div className="cats">
          <div className="step"><b>1. Pick</b><br /><small className="mu">Add items to your cart</small></div>
          <div className="step"><b>2. Confirm</b><br /><small className="mu">Enter your name, phone and wilaya</small></div>
          <div className="step"><b>3. Receive</b><br /><small className="mu">We call you, you pay on delivery</small></div>
        </div>

        <div className="cta">
          <h2 style={{ margin: "0 0 8px" }}>New vintage drops every week</h2>
          <p>Follow @{settings.ig} on Instagram so you never miss one.</p>
          <a className="btn r" href={`https://instagram.com/${settings.ig}`} target="_blank" rel="noopener noreferrer">
            Follow on Instagram
          </a>
        </div>
      </div>
    </>
  );
}
