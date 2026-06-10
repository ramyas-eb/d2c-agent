import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { db } from '@/lib/db';

function verifyPassword(password: string, storedHash: string): boolean {
  const parts = storedHash.split(':');
  if (parts.length !== 2) return false;
  const [salt, hash] = parts;
  const test = createHash('sha256').update(salt + password).digest('hex');
  return test === hash;
}

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email?.trim() || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const merchant = await db.merchant.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!merchant || !verifyPassword(password, merchant.passwordHash)) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const res = NextResponse.json({ slug: merchant.slug, shopName: merchant.shopName });
    res.cookies.set('merchant_id', merchant.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
    });
    return res;
  } catch (err) {
    console.error('[merchant-login]', err);
    return NextResponse.json({ error: 'Login failed. Please try again.' }, { status: 500 });
  }
}
