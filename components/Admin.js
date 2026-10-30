"use client";
import { useCallback, useEffect, useState } from "react";
import { CATS, STATUSES, WILAYAS, fm } from "@/lib/constants";

async function call(url, method = "GET", data) {
  const r = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : undefined,
    body: data ? JSON.stringify(data) : undefined,
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) {
    const e = new Error(d.error || "Request failed");
    e.status = r.status;
    throw e;
  }
  return d;
}

// Resize an image file to a JPEG data URL (max 700px) so it stays small.
function resize(file) {
  return new Promise((res, rej) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const s = Math.min(1, 700 / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * s);
      c.height = Math.round(img.height * s);
      c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      res(c.toDataURL("image/jpeg", 0.8));
    };
    img.onerror = () => rej(new Error("Could not read image"));
    img.src = url;
  });
}

function Login({ onDone }) {
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  async function go(e) {
    e.preventDefault();
    setErr("");
    try {
      await call("/api/login", "POST", { password: pw });
      onDone();
    } catch (e) {
      setErr(e.message);
    }
  }
  return (
    <form className="wrap" style={{ maxWidth: 360, paddingTop: 60 }} onSubmit={go}>
      <h2>Admin login</h2>
      <input type="password" placeholder="Password" value={pw} onChange={(e) => setPw(e.target.value)} autoFocus />
      {err && <p className="err">{err}</p>}
      <br />
      <br />
      <button className="btn">Sign in</button>
    </form>
  );
}

function Dashboard({ orders, products }) {
  const live = orders.filter((o) => o.st !== "Cancelled");
  const revenue = orders.filter((o) => o.st === "Delivered").reduce((s, o) => s + o.total, 0);
  const pending = live.filter((o) => o.st === "New" || o.st === "Confirmed").length;
  const low = products.filter((p) => p.s < 3).length;
  const by = STATUSES.map((s) => ({ s, n: orders.filter((o) => o.st === s).length }));
  const max = Math.max(1, ...by.map((x) => x.n));
  return (
    <>
      <div className="stats">
        <div className="st"><b>{orders.length}</b>Orders</div>
        <div className="st"><b>{pending}</b>To handle</div>
        <div className="st"><b>{fm(revenue)}</b>Delivered revenue</div>
        <div className="st"><b>{low}</b>Low / sold-out products</div>
      </div>
      <div className="step">
        <b>Orders by status</b>
        <div className="bars">
          {by.map((x) => (
            <div key={x.s}>
              {x.n}
              <i style={{ height: `${(x.n / max) * 100}%` }} />
              {x.s}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function Orders({ orders, reload, setErr }) {
  const [filter, setFilter] = useState("All");
  const list = orders.filter((o) => filter === "All" || o.st === filter);
  async function setSt(id, st) {
    try {
      await call(`/api/orders/${id}`, "PATCH", { st });
      await reload();
    } catch (e) {
      setErr(e.message);
      reload();
    }
  }
  return (
    <>
      <div style={{ maxWidth: 220, margin: "14px 0" }}>
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option>All</option>
          {STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>
      <div className="tbl">
        <table>
          <thead>
            <tr><th>#</th><th>Date</th><th>Customer</th><th>Items</th><th>Total</th><th>Status</th></tr>
          </thead>
          <tbody>
            {list.map((o) => (
              <tr key={o.id}>
                <td>{o.id}</td>
                <td>{new Date(o.date).toLocaleString()}</td>
                <td>
                  {o.name}<br />
                  <a href={`tel:${o.phone}`}>{o.phone}</a><br />
                  <small className="mu">{o.wilaya}{o.addr ? ` · ${o.addr}` : ""}</small>
                </td>
                <td>{(o.items || []).map((i, k) => <div key={k}>{i.q}× {i.n}</div>)}</td>
                <td>{fm(o.total)}</td>
                <td>
                  <select value={o.st} onChange={(e) => setSt(o.id, e.target.value)}>
                    {STATUSES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </td>
              </tr>
            ))}
            {!list.length && <tr><td colSpan={6} className="mu">No orders.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}

function Products({ products, reload, setErr }) {
  const empty = { n: "", c: CATS[0], p: "", s: "1", d: "", i: [] };
  const [f, setF] = useState(empty);
  const [busy, setBusy] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(empty);
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));
  const setEdit = (k) => (e) => setEditForm((s) => ({ ...s, [k]: e.target.value }));
  const previewImages = Array.isArray(f.i) ? f.i : typeof f.i === "string" && f.i ? [f.i] : [];

  async function pick(e) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    try {
      setF((s) => ({ ...s, i: [] }));
      const images = await Promise.all(files.map((file) => resize(file)));
      setF((s) => ({ ...s, i: images }));
    } catch (e) {
      setErr(e.message);
    }
  }

  async function add(e) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      await call("/api/products", "POST", {
        ...f,
        i: Array.isArray(f.i) ? f.i : f.i ? [f.i] : [],
        p: Number(f.p),
        s: Number(f.s),
      });
      setF(empty);
      e.target.reset();
      await reload();
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function patch(id, data) {
    try {
      await call(`/api/products/${id}`, "PATCH", data);
      await reload();
    } catch (e) {
      setErr(e.message);
    }
  }

  async function saveEdit(e) {
    e.preventDefault();
    if (editingId == null) return;
    try {
      await patch(editingId, {
        n: editForm.n,
        c: editForm.c,
        p: Number(editForm.p),
        s: Number(editForm.s),
        d: editForm.d,
      });
      setEditingId(null);
      setEditForm(empty);
    } catch (e) {
      setErr(e.message);
    }
  }

  async function del(p) {
    if (!confirm(`Delete "${p.n}"?`)) return;
    try {
      await call(`/api/products/${p.id}`, "DELETE");
      await reload();
    } catch (e) {
      setErr(e.message);
    }
  }

  return (
    <>
      <form onSubmit={add} className="step" style={{ marginTop: 14 }}>
        <b>Add product</b>
        <div className="f">
          <input placeholder="Name" value={f.n} onChange={set("n")} required />
          <select value={f.c} onChange={set("c")}>{CATS.map((c) => <option key={c}>{c}</option>)}</select>
          <input placeholder="Price (DA)" type="number" min="0" value={f.p} onChange={set("p")} required />
          <input placeholder="Stock" type="number" min="0" value={f.s} onChange={set("s")} required />
        </div>
        <textarea placeholder="Description" value={f.d} onChange={set("d")} />
        <div className="f">
          <input type="file" accept="image/*" multiple onChange={pick} />
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {previewImages.map((img, idx) => (
              <img key={`${img}-${idx}`} src={img} alt="" style={{ height: 60, width: 60, objectFit: "cover", borderRadius: 8 }} />
            ))}
          </div>
        </div>
        <button className="btn" disabled={busy}>{busy ? "Saving…" : "Add"}</button>
      </form>

      <div className="tbl">
        <table>
          <thead><tr><th></th><th>Product</th><th>Price</th><th>Stock</th><th></th></tr></thead>
          <tbody>
            {products.map((p) => {
              const productImages = Array.isArray(p.i) ? p.i : p.i ? [p.i] : [];
              const firstImage = productImages[0];
              const isEditing = editingId === p.id;
              const original = Number(p.op ?? p.p ?? 0);
              const promo = original > 0 && p.p < original;
              return (
                <tr key={p.id}>
                  <td>{firstImage ? <img src={firstImage} alt="" style={{ width: 44, height: 44, objectFit: "cover", borderRadius: 8 }} /> : null}</td>
                  <td>
                    {isEditing ? (
                      <div style={{ display: "grid", gap: 8, minWidth: 260 }}>
                        <input value={editForm.n} onChange={setEdit("n")} placeholder="Name" />
                        <select value={editForm.c} onChange={setEdit("c")}>{CATS.map((c) => <option key={c}>{c}</option>)}</select>
                        <textarea value={editForm.d} onChange={setEdit("d")} placeholder="Description" rows={3} />
                      </div>
                    ) : (
                      <>
                        {p.n}<br /><small className="mu">{p.c}</small>
                        {promo && <div><small className="mu" style={{ color: "#b42318" }}>Promo price</small></div>}
                      </>
                    )}
                  </td>
                  <td>
                    {isEditing ? (
                      <input type="number" min="0" value={editForm.p} style={{ width: 110 }} onChange={setEdit("p")} />
                    ) : (
                      <>
                        <div>{fm(p.p)}</div>
                        {promo && <small className="mu" style={{ textDecoration: "line-through" }}>{fm(original)}</small>}
                      </>
                    )}
                  </td>
                  <td>
                    {isEditing ? (
                      <input type="number" min="0" value={editForm.s} style={{ width: 80 }} onChange={setEdit("s")} />
                    ) : (
                      p.s
                    )}
                  </td>
                  <td>
                    {isEditing ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        <button className="btn" type="button" onClick={saveEdit}>Save</button>
                        <button className="btn o" type="button" onClick={() => { setEditingId(null); setEditForm(empty); }}>Cancel</button>
                      </div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        <button className="btn o" type="button" onClick={() => { setEditingId(p.id); setEditForm({ n: p.n, c: p.c, p: String(p.p), s: String(p.s), d: p.d || "", i: Array.isArray(p.i) ? p.i : p.i ? [p.i] : [] }); }}>Edit</button>
                        <button className="btn r" type="button" onClick={() => del(p)}>Delete</button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

function Settings({ setErr }) {
  const [s, setS] = useState({ wa: "", ig: "", home_fee: 0, desk_fee: 0, wilaya_fees: [] });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    call("/api/settings")
      .then((data) => {
        const fees = Array.isArray(data.wilaya_fees) && data.wilaya_fees.length
          ? data.wilaya_fees
          : WILAYAS.map((wilaya) => ({ wilaya, home_fee: Number(data.home_fee ?? 0), desk_fee: Number(data.desk_fee ?? 0) }));

        setS({
          wa: data.wa || "",
          ig: data.ig || "",
          home_fee: Number(data.home_fee ?? 0),
          desk_fee: Number(data.desk_fee ?? 0),
          wilaya_fees: fees,
        });
      })
      .catch((e) => setErr(e.message));
  }, [setErr]);

  function setWilayaFee(wilaya, type, value) {
    setS((prev) => ({
      ...prev,
      wilaya_fees: (prev.wilaya_fees || []).map((row) => (
        row.wilaya === wilaya ? { ...row, [type]: Number(value || 0) } : row
      )),
    }));
  }

  async function save(e) {
    e.preventDefault();
    setSaved(false);
    try {
      const payload = {
        ...s,
        home_fee: Number(s.home_fee),
        desk_fee: Number(s.desk_fee),
        wilaya_fees: (s.wilaya_fees || []).map((row) => ({
          wilaya: row.wilaya,
          home_fee: Number(row.home_fee ?? 0),
          desk_fee: Number(row.desk_fee ?? 0),
        })),
      };
      setS(await call("/api/settings", "PUT", payload));
      setSaved(true);
    } catch (e) {
      setErr(e.message);
    }
  }

  return (
    <form onSubmit={save} className="step" style={{ marginTop: 14, maxWidth: 520 }}>
      <b>Contact & delivery settings</b>
      <p className="mu">WhatsApp number with country code, digits only (e.g. 2135xxxxxxxx).</p>
      <input value={s.wa} onChange={(e) => setS({ ...s, wa: e.target.value })} placeholder="WhatsApp" />
      <br /><br />
      <input value={s.ig} onChange={(e) => setS({ ...s, ig: e.target.value })} placeholder="Instagram handle" />
      <br /><br />
      <div style={{ display: "grid", gap: 8 }}>
        <label>
          <span className="mu">Default Home delivery fee (DA)</span>
          <input type="number" min="0" value={s.home_fee} onChange={(e) => setS({ ...s, home_fee: e.target.value })} />
        </label>
        <label>
          <span className="mu">Default Desk delivery fee (DA)</span>
          <input type="number" min="0" value={s.desk_fee} onChange={(e) => setS({ ...s, desk_fee: e.target.value })} />
        </label>
      </div>
      <br />
      <div>
        <b>Wilaya delivery prices</b>
        <div className="mu" style={{ margin: "6px 0 12px" }}>Set a different Home / Desk fee for each wilaya.</div>
        <div style={{ display: "grid", gap: 6, maxHeight: 320, overflowY: "auto" }}>
          {(s.wilaya_fees || []).map((row) => (
            <div key={row.wilaya} style={{ display: "grid", gridTemplateColumns: "minmax(140px, 1.7fr) 1fr 1fr", gap: 8, alignItems: "center" }}>
              <span>{row.wilaya}</span>
              <input
                type="number"
                min="0"
                value={row.home_fee ?? 0}
                onChange={(e) => setWilayaFee(row.wilaya, "home_fee", e.target.value)}
              />
              <input
                type="number"
                min="0"
                value={row.desk_fee ?? 0}
                onChange={(e) => setWilayaFee(row.wilaya, "desk_fee", e.target.value)}
              />
            </div>
          ))}
        </div>
      </div>
      <br />
      <button className="btn">Save</button> {saved && <span>Saved ✓</span>}
    </form>
  );
}

const TABS = ["Dashboard", "Orders", "Products", "Settings"];

export default function Admin() {
  const [state, setState] = useState("loading"); // loading | login | in
  const [tab, setTab] = useState("Dashboard");
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    try {
      const [o, p] = await Promise.all([call("/api/orders"), call("/api/products")]);
      setOrders(o);
      setProducts(p);
      setState("in");
    } catch (e) {
      if (e.status === 401) setState("login");
      else {
        setErr(e.message);
        setState("in");
      }
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (state === "loading") return <p className="wrap" style={{ paddingTop: 30 }}>Loading…</p>;
  if (state === "login") return <Login onDone={load} />;

  return (
    <div className="wrap" style={{ paddingTop: 20 }}>
      <div className="row" style={{ border: 0 }}>
        <h2 style={{ margin: 0 }}>Admin</h2>
        <button
          className="btn o"
          onClick={async () => {
            await call("/api/logout", "POST").catch(() => {});
            setState("login");
          }}
        >
          Log out
        </button>
      </div>
      <div style={{ display: "flex", gap: 4, overflowX: "auto", margin: "10px 0" }}>
        {TABS.map((t) => (
          <button key={t} className={"tb" + (tab === t ? " on" : "")} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>
      {err && <p className="err" onClick={() => setErr("")}>{err} (click to dismiss)</p>}
      {tab === "Dashboard" && <Dashboard orders={orders} products={products} />}
      {tab === "Orders" && <Orders orders={orders} reload={load} setErr={setErr} />}
      {tab === "Products" && <Products products={products} reload={load} setErr={setErr} />}
      {tab === "Settings" && <Settings setErr={setErr} />}
    </div>
  );
}
