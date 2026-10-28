import { notFound } from "next/navigation";
import { getProductById, getProducts } from "@/lib/db";
import ProductDetail from "@/components/ProductDetail";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const { id } = await params;
  const product = await getProductById(Number(id));

  if (!product) {
    return {};
  }

  const description = product.d || `Discover ${product.n} in the ${product.c} collection at ZILLA STORE.`;
  const image = product.i?.[0] || "/logo.jpg";

  return {
    title: product.n,
    description,
    alternates: { canonical: `/products/${product.id}` },
    openGraph: {
      title: product.n,
      description,
      type: "website",
      url: `/products/${product.id}`,
      images: [{ url: image, width: 1200, height: 1200, alt: product.n }],
    },
    twitter: {
      card: "summary_large_image",
      title: product.n,
      description,
      images: [image],
    },
  };
}

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
