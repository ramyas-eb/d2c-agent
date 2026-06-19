import { NextRequest } from 'next/server';
import { runAgent } from '@/services/agent';

export async function POST(req: NextRequest) {
  const { messages, convStage, products = [], agentSettings = {} } = await req.json();

  const result = await runAgent({ messages, products, settings: agentSettings, convStage });
  console.log('[api/agent] result:', JSON.stringify(result).slice(0, 200));
  return Response.json(result);
}
