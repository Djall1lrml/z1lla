import Link from "next/link";
import { CATS } from "@/lib/constants";

export default function Footer({ settings }) {
  const year = new Date().getFullYear();
  return (
    <footer>
      <div className="fg">
        <div>
          <div className="tl" style={{ marginBottom: 10 }}>
            <img src="/logo.jpg" alt="" />
            ZILLA
          </div>
          <p>Vintage digital cameras, PSP, iPods and more. Tested, cleaned and delivered across Algeria.</p>
        </div>
        <div>
          <b>Shop</b>
          {CATS.map((c) => (
            <Link key={c} className="fl" href={`/?cat=${encodeURIComponent(c)}#shop`}>{c}</Link>
          ))}
        </div>
        <div>
          <b>Help</b>
          <Link className="fl" href="/suivi">Suivi commande</Link>
          <span className="fl">Delivery to 58 wilayas</span>
          <span className="fl">Cash on delivery</span>
        </div>
        <div>
          <b>Contact</b>
          <a className="fl" href={`https://wa.me/${settings.wa}`} target="_blank" rel="noopener noreferrer">WhatsApp</a>
          <a className="fl" href={`https://instagram.com/${settings.ig}`} target="_blank" rel="noopener noreferrer">Instagram @{settings.ig}</a>
        </div>
      </div>
      <div className="fb">© {year} Zilla Store. All rights reserved.</div>
    </footer>
  );
}
