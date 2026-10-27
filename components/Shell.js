"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useStore } from "./Store";
import Cart from "./Cart";

function Logo({ text = true }) {
  return (
    <Link href="/" className="tl">
      <img src="/logo.jpg" alt="" />
      {text && <span className="tx">ZILLA</span>}
    </Link>
  );
}

function Sidebar() {
  const { settings, menu, setMenu } = useStore();
  const path = usePathname();
  const close = () => setMenu(false);
  return (
    <>
      <aside className={"sb" + (menu ? " on" : "")}>
        <div className="lg">
          <img src="/logo.jpg" alt="" />
          ZILLA
        </div>
        <Link href="/" onClick={close} className={"n" + (path === "/" ? " on" : "")}>🏠 Home</Link>
        <Link href="/#shop" onClick={close} className="n">🛍️ Shop</Link>
        <Link href="/suivi" onClick={close} className={"n" + (path === "/suivi" ? " on" : "")}>📦 Suivi commande</Link>
        <hr />
        <a className="n" href={`https://instagram.com/${settings.ig}`} target="_blank" rel="noopener noreferrer">📸 Instagram</a>
        <a className="n" href={`https://wa.me/${settings.wa}`} target="_blank" rel="noopener noreferrer">💬 WhatsApp</a>
      </aside>
      <div className={"ovl" + (menu ? " on" : "")} onClick={close} />
    </>
  );
}

function Header() {
  const { q, setQ, count, setOpen, theme, toggleTheme, setMenu } = useStore();
  const path = usePathname();
  const admin = path.startsWith("/admin");
  const home = path === "/";
  return (
    <header>
      {!admin && (
        <button className="btn o ham" aria-label="Menu" onClick={() => setMenu(true)}>☰</button>
      )}
      <Logo />
      {admin ? (
        <nav className="tn">
          <Link href="/" className="tb">← Store</Link>
        </nav>
      ) : (
        <nav className="tn">
          <Link href="/" className={"tb" + (home ? " on" : "")}>Home</Link>
          <Link href="/#shop" className="tb">Shop</Link>
          <Link href="/suivi" className={"tb" + (path === "/suivi" ? " on" : "")}>Suivi commande</Link>
        </nav>
      )}
      {!admin && home && (
        <input
          className="search-input"
          placeholder="Search vintage tech…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => document.getElementById("shop")?.scrollIntoView({ behavior: "smooth" })}
        />
      )}
      <button className="btn o" id="th" onClick={toggleTheme} aria-label="Toggle theme">
        {theme === "light" ? "🌙" : "☀️"}
      </button>
      {!admin && (
        <button className="btn" onClick={() => setOpen(true)}>Cart ({count})</button>
      )}
    </header>
  );
}

export default function Shell({ footer, children }) {
  const path = usePathname();
  const admin = path.startsWith("/admin");
  return (
    <>
      <div className="lay">
        {!admin && <Sidebar />}
        <div className="mn">
          <Header />
          {children}
          {!admin && footer}
        </div>
      </div>
      {!admin && <Cart />}
    </>
  );
}
