"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const Ctx = createContext(null);
export const useStore = () => useContext(Ctx);

export default function StoreProvider({ settings, children }) {
  const [cart, setCart] = useState([]);
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState(false);
  const [q, setQ] = useState("");
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    try {
      const c = JSON.parse(localStorage.getItem("zc") || "[]");
      if (Array.isArray(c)) setCart(c);
    } catch {}
    setTheme(document.documentElement.dataset.theme || "light");
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem("zc", JSON.stringify(cart));
    } catch {}
  }, [cart, ready]);

  const toggleTheme = useCallback(() => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("zt", next);
    } catch {}
  }, [theme]);

  // p = { id, n, p, s } (s = stock). Never lets the cart exceed stock.
  const add = useCallback((p) => {
    setCart((c) => {
      const i = c.findIndex((x) => x.id === p.id);
      if (i === -1) return [...c, { id: p.id, n: p.n, p: p.p, s: p.s, q: 1 }];
      if (c[i].q >= p.s) return c;
      return c.map((x, k) => (k === i ? { ...x, q: x.q + 1, s: p.s } : x));
    });
    setOpen(true);
  }, []);

  const remove = useCallback((id) => setCart((c) => c.filter((x) => x.id !== id)), []);
  const clear = useCallback(() => setCart([]), []);

  const value = useMemo(
    () => ({
      settings,
      cart,
      add,
      remove,
      clear,
      open,
      setOpen,
      menu,
      setMenu,
      q,
      setQ,
      theme,
      toggleTheme,
      count: cart.reduce((s, c) => s + c.q, 0),
      total: cart.reduce((s, c) => s + c.p * c.q, 0),
    }),
    [settings, cart, add, remove, clear, open, menu, q, theme, toggleTheme]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
