import { NextRequest, NextResponse } from 'next/server';
import { createHash, randomBytes } from 'crypto';
import { db } from '@/lib/db';

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = createHash('sha256').update(salt + password).digest('hex');
  return `${salt}:${hash}`;
}

export async function POST(req: NextRequest) {
  try {
    const { shopName, slug, email, password } = await req.json();

    if (!shopName?.trim() || !slug?.trim() || !email?.trim() || !password) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    if (cleanSlug.length < 3) {
      return NextResponse.json({ error: 'Slug must be at least 3 characters' }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    const existing = await db.merchant.findFirst({
      where: { OR: [{ slug: cleanSlug }, { email: email.toLowerCase() }] },
    });

    if (existing) {
      const field = existing.slug === cleanSlug ? 'shop URL' : 'email';
      return NextResponse.json({ error: `This ${field} is already taken` }, { status: 409 });
    }

    const merchant = await db.merchant.create({
      data: {
        shopName: shopName.trim(),
        slug: cleanSlug,
        email: email.toLowerCase().trim(),
        passwordHash: hashPassword(password),
      },
    });

    const res = NextResponse.json({ id: merchant.id, slug: merchant.slug });
    res.cookies.set('merchant_id', merchant.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
    });
    return res;
  } catch (err) {
    console.error('[signup]', err);
    return NextResponse.json({ error: 'Signup failed. Please try again.' }, { status: 500 });
  }
}
