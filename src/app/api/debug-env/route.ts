import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    anthropic_set: !!process.env.ANTHROPIC_API_KEY,
    anthropic_length: process.env.ANTHROPIC_API_KEY?.length ?? 0,
    anthropic_prefix: process.env.ANTHROPIC_API_KEY?.slice(0, 10) ?? 'none',
    whatsapp_phone_set: !!process.env.WHATSAPP_PHONE_ID,
    whatsapp_token_set: !!process.env.WHATSAPP_API_TOKEN,
  });
}
