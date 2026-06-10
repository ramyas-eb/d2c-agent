'use client';
import { useState, useRef, useEffect } from 'react';
import { Bot, Send, RefreshCw } from 'lucide-react';
import { useAgentSettingsStore } from '@/store/agent-settings';
import { useProductStore } from '@/store/products';
import { cn } from '@/lib/utils';

interface TestMessage {
  id: string;
  role: 'customer' | 'agent';
  content: string;
}

const QUICK_STARTERS = ["What's the price?", 'Is it in stock?', 'Do you have returns?'];

export default function TestModePage() {
  const { settings } = useAgentSettingsStore();
  const products = useProductStore(s => s.products);
  const [messages, setMessages] = useState<TestMessage[]>([]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  const reset = () => { setMessages([]); setInput(''); setTyping(false); };

  const send = async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg) return;
    setInput('');
    const userMsg: TestMessage = { id: `${Date.now()}`, role: 'customer', content: msg };
    setMessages(prev => [...prev, userMsg]);
    setTyping(true);

    try {
      const history = [...messages, userMsg].map(m => ({ role: m.role, content: m.content }));
      const res = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history, convStage: 'inquiry', products, agentSettings: settings }),
      });
      const data = await res.json();
      setTyping(false);
      const reply = data.message
        ?? (data.fallback ? 'Your agent would respond here — add your Anthropic API key to enable live responses.' : null);
      if (reply) {
        setMessages(prev => [...prev, { id: `${Date.now()}a`, role: 'agent', content: reply }]);
      }
    } catch {
      setTyping(false);
      setMessages(prev => [...prev, {
        id: `${Date.now()}e`,
        role: 'agent',
        content: "Couldn't reach the agent. Check your API configuration.",
      }]);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="px-8 py-6 flex flex-col flex-1 w-full min-h-0">

        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Test Mode</h1>
            <p className="text-sm text-gray-400 mt-0.5">Type as a customer — see exactly what they experience</p>
          </div>
          <button
            onClick={reset}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 border border-gray-200 hover:border-gray-300 rounded-lg px-3 py-1.5 transition-colors"
          >
            <RefreshCw className="w-3 h-3" /> Reset
          </button>
        </div>

        <div className="flex-1 bg-white border border-gray-200 rounded-2xl overflow-hidden flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {messages.length === 0 && (
              <div className="h-full flex items-center justify-center">
                <div className="text-center space-y-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mx-auto">
                    <Bot className="w-5 h-5 text-blue-500" />
                  </div>
                  <p className="text-sm text-gray-400">Send a message to test your agent</p>
                  <div className="flex flex-wrap gap-1.5 justify-center">
                    {QUICK_STARTERS.map(s => (
                      <button
                        key={s}
                        onClick={() => send(s)}
                        className="text-xs px-2.5 py-1 bg-gray-100 hover:bg-blue-50 hover:text-blue-600 text-gray-500 rounded-full transition-colors"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {messages.map(msg => (
              <div key={msg.id} className={cn('flex gap-2', msg.role === 'customer' ? 'flex-row-reverse' : 'flex-row')}>
                <div className={cn(
                  'w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-auto text-sm',
                  msg.role === 'customer' ? 'bg-gray-100' : 'bg-blue-100'
                )}>
                  {msg.role === 'customer' ? '👤' : '🤖'}
                </div>
                <div className={cn(
                  'max-w-xs px-3 py-2 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap',
                  msg.role === 'customer'
                    ? 'bg-gray-100 text-gray-800 rounded-tr-sm'
                    : 'bg-blue-600 text-white rounded-tl-sm'
                )}>
                  {msg.content}
                </div>
              </div>
            ))}

            {typing && (
              <div className="flex gap-2">
                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-sm">🤖</div>
                <div className="bg-blue-50 px-3 py-2 rounded-2xl rounded-tl-sm">
                  <div className="flex gap-1 items-center h-4">
                    <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="px-4 py-3 border-t border-gray-100 flex-shrink-0">
            <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
              <input
                className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none"
                placeholder="Type as customer…"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') send(); }}
              />
              <button
                onClick={() => send()}
                disabled={!input.trim()}
                className="w-7 h-7 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 text-white rounded-lg flex items-center justify-center transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
