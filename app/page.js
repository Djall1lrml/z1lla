import Shop from "@/components/Shop";
import { getProducts, getSettings } from "@/lib/db";
import { CATS } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function Home({ searchParams }) {
  const sp = await searchParams;
  const cat = CATS.includes(sp?.cat) ? sp.cat : "All";
  let products;
  try {
    products = await getProducts();
  } catch (e) {
    return (
      <div className="wrap" style={{ paddingTop: 40 }}>
        <h2>Store is not connected to the database yet</h2>
        <p className="mu">{e.message}</p>
        <p className="mu">
          Create a Supabase project, run <code>supabase/schema.sql</code>, then set <code>SUPABASE_URL</code> and{" "}
          <code>SUPABASE_SERVICE_ROLE_KEY</code> in <code>.env.local</code>.
        </p>
      </div>
    );
  }
  const settings = await getSettings();
  return <Shop products={products} cat={cat} settings={settings} />;
}
