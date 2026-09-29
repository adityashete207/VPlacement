import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Sparkles } from 'lucide-react';
import { sendChatMessage } from '../../api/aiService.js';

const CareerChatWidget = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content:
        "Hi! I'm your VPlacement AI Career Assistant. Ask me about resumes, interviews, or open roles.",
    },
  ]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || isSending) return;

    const priorMessages = messages;
    const newMessages = [...priorMessages, { role: 'user', content: trimmed }];
    setMessages(newMessages);
    setInput('');
    setIsSending(true);

    try {
      const history = priorMessages
        .slice(-8)
        .map((m) => ({ role: m.role, content: m.content }));
      const { reply } = await sendChatMessage(trimmed, history);
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: "Sorry, I couldn't reach the AI service right now. Please try again shortly.",
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {open && (
        // Explicit near-opaque background + strong blur, independent of the
        // shared `glass-panel` utility — this widget floats over every page
        // in the app (including bright hero imagery), so it can't rely on a
        // light-opacity glass effect meant for panels sitting on our own
        // dark backgrounds. This keeps text readable regardless of what's
        // behind it.
        <div
          className="mb-3 w-80 sm:w-96 h-[28rem] flex flex-col rounded-2xl border overflow-hidden animate-[chatPop_.25s_cubic-bezier(.2,.9,.3,1)_both]"
          style={{
            background: 'rgba(10,8,22,0.96)',
            backdropFilter: 'blur(28px)',
            WebkitBackdropFilter: 'blur(28px)',
            borderColor: 'rgba(157,78,221,0.3)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.55), 0 0 32px rgba(157,78,221,0.25)',
          }}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <span
                className="relative flex h-8 w-8 rounded-full flex-shrink-0"
                style={{
                  background: 'radial-gradient(circle at 30% 30%, #fff, #9D4EDD 45%, #FF007F)',
                  boxShadow: '0 0 16px rgba(255, 0, 127, 0.55)',
                }}
              />
              <span className="flex items-center gap-1.5 font-display font-semibold text-sm text-ink">
                <Sparkles size={14} className="text-violet-soft" />
                Career Assistant
              </span>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="rounded-full p-1.5 text-muted hover:text-ink hover:bg-white/10 transition-colors"
              aria-label="Close chat"
            >
              <X size={16} />
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-2.5">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm whitespace-pre-wrap ${
                    m.role === 'user'
                      ? 'text-white rounded-br-sm shadow-glow-magenta'
                      : 'border rounded-bl-sm'
                  }`}
                  style={
                    m.role === 'user'
                      ? { backgroundImage: 'linear-gradient(120deg, #8A3ACB, #E6007A)' }
                      : {
                          background: 'rgba(255,255,255,0.08)',
                          borderColor: 'rgba(255,255,255,0.12)',
                          color: '#EDE9FF',
                        }
                  }
                >
                  {m.content}
                </div>
              </div>
            ))}
            {isSending && (
              <div className="flex justify-start">
                <div
                  className="rounded-2xl rounded-bl-sm px-3.5 py-2.5 flex gap-1 border"
                  style={{ background: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.12)' }}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-violet-soft animate-bounce [animation-delay:0ms]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-violet-soft animate-bounce [animation-delay:150ms]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-violet-soft animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-white/10 p-2.5 flex items-center gap-2" style={{ background: 'rgba(255,255,255,0.02)' }}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about jobs, resumes, interviews..."
              className="flex-1 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-ink
                         placeholder:text-muted/70 focus:outline-none focus:ring-2 focus:ring-emerald/50"
            />
            <button
              onClick={handleSend}
              disabled={isSending || !input.trim()}
              className="btn-glow p-2.5 rounded-full disabled:opacity-40"
              aria-label="Send message"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen(!open)}
        className="relative flex h-14 w-14 items-center justify-center rounded-full text-white transition-transform hover:scale-105"
        style={{
          backgroundImage: 'conic-gradient(from 0deg, #9D4EDD, #FF007F, #FFBE0B, #9D4EDD)',
          boxShadow: '0 0 26px rgba(255, 0, 127, 0.5)',
        }}
        aria-label="Toggle AI career assistant"
      >
        <span className="absolute inset-[2px] rounded-full bg-void flex items-center justify-center">
          {open ? <X size={22} /> : <MessageCircle size={22} />}
        </span>
      </button>
    </div>
  );
};

export default CareerChatWidget;