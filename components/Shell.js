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

function InstagramLogo() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <defs>
        <linearGradient id="ig-gradient" x1="0%" x2="100%" y1="0%" y2="100%">
          <stop offset="0%" stopColor="#feda75" />
          <stop offset="20%" stopColor="#fa7e1e" />
          <stop offset="50%" stopColor="#d62976" />
          <stop offset="75%" stopColor="#962fbf" />
          <stop offset="100%" stopColor="#4f5bd5" />
        </linearGradient>
      </defs>
      <rect x="2.4" y="2.4" width="19.2" height="19.2" rx="5.5" fill="url(#ig-gradient)" />
      <rect x="7" y="7" width="10" height="10" rx="3" fill="none" stroke="white" strokeWidth="1.6" />
      <circle cx="12" cy="12" r="2.7" fill="none" stroke="white" strokeWidth="1.6" />
      <circle cx="16.5" cy="7.5" r="1.1" fill="white" />
    </svg>
  );
}

function WhatsAppLogo() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M20.52 3.48A11.82 11.82 0 0 0 12.04 1C6.24 1 1.5 5.72 1.5 11.52c0 2.04.54 4.03 1.56 5.77L1.4 22.6l5.47-1.55A10.6 10.6 0 0 0 12.04 21c5.8 0 10.54-4.72 10.54-10.52 0-2.8-1.09-5.45-3.06-7.5Zm-8.48 15.9c-1.7 0-3.37-.46-4.82-1.33l-.34-.2-3.25.92 1-3.16-.22-.35A8.78 8.78 0 0 1 3.26 11.5C3.26 7.14 7.1 3.3 11.44 3.3c2.24 0 4.35 1.02 5.82 2.8a8.83 8.83 0 0 1-5.82 15.28Zm5.12-6.33c-.28-.14-1.66-.82-1.92-.92-.26-.1-.44-.14-.63.14-.18.28-.71.92-.87 1.1-.16.18-.32.2-.6.07-.28-.14-1.18-.44-2.25-1.39-.83-.74-1.39-1.64-1.55-1.92-.16-.28-.02-.43.12-.57.12-.12.28-.32.42-.48.14-.16.18-.28.28-.46.09-.18.05-.34-.02-.48-.07-.14-.63-1.52-.87-2.08-.23-.54-.46-.46-.63-.46l-.54-.01c-.18 0-.48.07-.73.34-.25.27-1 1-1 2.44 0 1.44 1.03 2.82 1.18 3.02.14.2 2.04 3.12 4.94 4.36.69.3 1.23.48 1.65.61.69.22 1.32.19 1.81.11.55-.08 1.66-.68 1.9-1.34.23-.66.23-1.22.16-1.34-.08-.13-.26-.2-.54-.34Z" fill="#25D366"/>
    </svg>
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
        <a className="n social-link" href={`https://instagram.com/${settings.ig}`} target="_blank" rel="noopener noreferrer">
          <InstagramLogo />
          <span>Instagram</span>
        </a>
        <a className="n social-link" href={`https://wa.me/${settings.wa}`} target="_blank" rel="noopener noreferrer">
          <WhatsAppLogo />
          <span>WhatsApp</span>
        </a>
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
