import { db } from '@/lib/db';
import { notFound } from 'next/navigation';
import MerchantCatalog from './catalog-view';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function CatalogSlugPage({ params }: PageProps) {
  const { slug } = await params;

  const merchant = await db.merchant.findUnique({
    where: { slug },
    include: { products: { orderBy: { createdAt: 'asc' } } },
  });

  if (!merchant) notFound();

  // Parse variants JSON for each product
  const products = merchant.products.map(p => ({
    id: p.id,
    name: p.name,
    sku: p.sku,
    price: p.price,
    description: p.description,
    inStock: p.inStock,
    variants: (() => {
      try { return JSON.parse(p.variants) as { label: string; options: string[] }[]; }
      catch { return []; }
    })(),
  }));

  return (
    <MerchantCatalog
      shopName={merchant.shopName}
      tagline={merchant.tagline}
      whatsappNumber={merchant.whatsappNumber}
      instagramHandle={merchant.instagramHandle}
      products={products}
    />
  );
}
