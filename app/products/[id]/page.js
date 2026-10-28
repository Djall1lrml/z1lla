import { notFound } from "next/navigation";
import { getProductById, getProducts } from "@/lib/db";
import ProductDetail from "@/components/ProductDetail";

export const dynamic = "force-dynamic";

export default async function ProductPage({ params }) {
  const { id } = await params;
  const product = await getProductById(Number(id));
  if (!product) notFound();

  const allProducts = await getProducts();
  const related = allProducts
    .filter((item) => item.id !== product.id && item.c === product.c)
    .slice(0, 4);

  return <ProductDetail product={product} related={related} />;
}
