import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/merchant/[slug] — public, used by catalog page
export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  try {
    const merchant = await db.merchant.findUnique({
      where: { slug },
      include: { products: { orderBy: { createdAt: 'asc' } } },
    });
    if (!merchant) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Strip password hash before returning
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...safe } = merchant;
    return NextResponse.json(safe);
  } catch (err) {
    console.error('[merchant GET]', err);
    return NextResponse.json({ error: 'Failed to load merchant' }, { status: 500 });
  }
}

// PATCH /api/merchant/[slug] — authenticated, used by onboarding wizard
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  // Verify the merchant_id cookie matches
  const merchantId = req.cookies.get('merchant_id')?.value;
  if (!merchantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const merchant = await db.merchant.findUnique({ where: { slug } });
    if (!merchant || merchant.id !== merchantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      tagline, whatsappNumber, instagramHandle,
      tone, returnPolicy, shippingDays, codAvailable, discount,
      onboardingDone,
      products, // array of product objects to create
    } = body;

    // Update merchant fields
    const updated = await db.merchant.update({
      where: { slug },
      data: {
        ...(tagline !== undefined && { tagline }),
        ...(whatsappNumber !== undefined && { whatsappNumber }),
        ...(instagramHandle !== undefined && { instagramHandle }),
        ...(tone !== undefined && { tone }),
        ...(returnPolicy !== undefined && { returnPolicy }),
        ...(shippingDays !== undefined && { shippingDays }),
        ...(codAvailable !== undefined && { codAvailable }),
        ...(discount !== undefined && { discount }),
        ...(onboardingDone !== undefined && { onboardingDone }),
      },
    });

    // If products array provided, replace all products for this merchant
    if (Array.isArray(products)) {
      await db.product.deleteMany({ where: { merchantId: merchant.id } });
      if (products.length > 0) {
        await db.product.createMany({
          data: products.map((p: {
            name: string; sku?: string; price: number;
            description?: string; inStock?: boolean; variants?: unknown;
          }) => ({
            name: p.name,
            sku: p.sku ?? '',
            price: Number(p.price) || 0,
            description: p.description ?? '',
            inStock: p.inStock !== false,
            variants: JSON.stringify(p.variants ?? []),
            merchantId: merchant.id,
          })),
        });
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...safe } = updated;
    return NextResponse.json(safe);
  } catch (err) {
    console.error('[merchant PATCH]', err);
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }
}
