import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion, useDragControls } from 'motion/react';
import {
  Maximize2,
  Minimize2,
  Send,
  Sparkles,
  Square,
  Trash2,
  X,
} from 'lucide-react';
import { useCatalog } from '../context/CatalogContext';
import { Product } from '../types';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  instantPrompt?: string;
}

const INITIAL_GREETING: ChatMessage = {
  id: 'greeting',
  role: 'assistant',
  content:
    "Hey! I'm Viora AI. Ask me about Astra Vesper applications, Solis Vexen, or our Privacy, Safety & Policy standards—I'm ready to help fast and securely.",
};

const SUGGESTIONS = [
  'Tell me about Viora+ Music',
  'What is Solis Vexen?',
  'How does Astra Vesper protect my privacy?',
  'Explain safety, security & terms policies',
];

function tryInstantLocalReply(queryText: string, products: Product[]): string | null {
  const q = queryText.trim().toLowerCase();

  // Brand Privacy Policy queries (instant <20ms grounded reply)
  if (
    q === 'how does astra vesper protect my privacy?' ||
    /^(what is |tell me about |explain )?(brand )?(privacy|privacy policy)\??$/.test(q) ||
    q.includes('export') && q.includes('data') ||
    q.includes('delete') && q.includes('account')
  ) {
    return [
      'Astra Vesper leaves storefront browsing open with no mandatory sign-in gate; optional accounts authenticate only via verified Google Sign-In (zero raw passwords stored).',
      'Your profile, downloads, activity logs (which you can pause anytime), and connected app links stay strictly isolated per account, and background continuity tokens contain zero PII.',
      'You own your data—export a complete JSON archive or permanently delete your account anytime in [Account > Privacy & Security](/account). Read our full [Privacy Policy](/support/privacy).',
    ].join('\n');
  }

  // Brand Safety, Security & Terms queries (instant <20ms grounded reply)
  if (
    q === 'explain safety, security & terms policies' ||
    /^(what is |tell me about |explain )?(brand )?(safety|security|terms|policy|policies|terms of service)\??$/.test(q)
  ) {
    return [
      'Astra Vesper enforces default-deny Cloud Firestore isolation, public-HTTPS sandboxed live previews, rate-limited server-side Viora AI (never sending personal user PII into prompts), and fresh Google re-authentication for sensitive admin credential changes.',
      'Status labels (Available, Beta, In Development) reflect real release readiness, and installer downloads appear only where verified builds exist.',
      'Explore [Safety & Security](/support/safety), [Privacy Policy](/support/privacy), and [Terms of Service](/support/terms).',
    ].join('\n');
  }

  // Solis Vexen queries
  if (q === 'what is solis vexen?' || q === 'solis vexen') {
    return [
      'Solis Vexen is a separate minimalist watch & horology brand showcased on its dedicated [Solis Vexen](/solis-vexen) tab and at [solisvexen.vercel.app](https://solisvexen.vercel.app/).',
      'It is currently in active progress and development, featuring brushed-silver chronometer dial studies rather than software downloads.',
    ].join('\n');
  }

  // Viora+ Music overview
  if (q === 'tell me about viora+ music' || q === 'viora+ music') {
    const app = products.find((p) => p.slug === 'viora-music');
    if (app) {
      return [
        `${app.name} (v${app.version}, ${app.status}) is developed by Vioratundra within Astra Vesper.`,
        `${app.description}`,
        `Highlights: ${app.availableFeatures.slice(0, 3).join(' · ')}. Explore [Viora+ Music](/products/${app.slug}).`,
      ].join('\n');
    }
  }

  // VioraFlow overview
  if (q === 'how does vioraflow help workflows?' || q === 'tell me about vioraflow' || q === 'vioraflow') {
    const app = products.find((p) => p.slug === 'vioraflow');
    if (app) {
      return [
        `${app.name} (v${app.version}, ${app.status}) helps teams & creators unify tasks and visual workflows cleanly.`,
        `Current capabilities: ${app.availableFeatures.slice(0, 3).join(' · ')}. View details at [VioraFlow](/products/${app.slug}).`,
      ].join('\n');
    }
  }

  // Ecosystem hierarchy
  if (
    /^(what is |how does )?(astra vesper|vioratundra|ecosystem).*\??$/.test(q) &&
    q.length < 60
  ) {
    return [
      'Astra Vesper is the parent digital ecosystem and application store.',
      'Vioratundra develops the applications inside Astra Vesper (including [Viora+ Music](/products/viora-music) and [VioraFlow](/products/vioraflow)), while [Solis Vexen](/solis-vexen) is an independent watch brand in development. Learn more at [About Astra Vesper](/about).',
    ].join('\n');
  }

  return null;
}

function isSafeLinkHref(href: string): boolean {
  if (href.startsWith('/')) return !href.startsWith('//');
  try {
    const parsed = new URL(href);
    return parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function renderRichMessage(text: string, onNavigate: () => void) {
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const lines = text.split('\n');

  return lines.map((line, lineIdx) => {
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = linkRegex.exec(line)) !== null) {
      if (match.index > lastIndex) {
        parts.push(line.slice(lastIndex, match.index));
      }
      const label = match[1];
      const href = match[2].trim();
      if (!isSafeLinkHref(href)) {
        parts.push(label);
      } else if (href.startsWith('/')) {
        parts.push(
          <Link
            key={`${lineIdx}-${match.index}`}
            to={href}
            onClick={onNavigate}
            className="underline decoration-violet-500/60 font-medium text-violet-700 dark:text-violet-300 hover:text-violet-600"
          >
            {label}
          </Link>
        );
      } else {
        parts.push(
          <a
            key={`${lineIdx}-${match.index}`}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-blue-500/60 font-medium text-blue-600 dark:text-blue-400"
          >
            {label}
          </a>
        );
      }
      lastIndex = linkRegex.lastIndex;
    }

    if (lastIndex < line.length) {
      parts.push(line.slice(lastIndex));
    }

    return (
      <p key={lineIdx} className={lineIdx > 0 ? 'mt-1.5' : ''}>
        {parts.length > 0 ? parts : '\u00A0'}
      </p>
    );
  });
}

export function VioraAiWidget({
  open,
  onOpen,
  onClose,
}: {
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
}) {
  const { publishedProducts, aiConfig } = useCatalog();
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_GREETING]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const dragControls = useDragControls();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, thinking, open]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const stopGeneration = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    setThinking(false);
  };

  const sendPrompt = async (promptText: string, forceGemini = false) => {
    const trimmed = promptText.trim();
    if (!trimmed || thinking) return;

    setErrorMsg(null);
    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: trimmed,
    };
    const nextHistory = [...messages, userMsg];

    if (!forceGemini && aiConfig.enabled) {
      const instant = tryInstantLocalReply(trimmed, publishedProducts);
      if (instant) {
        setInput('');
        setMessages([
          ...nextHistory,
          {
            id: `a-${Date.now()}`,
            role: 'assistant',
            content: instant,
            instantPrompt: trimmed,
          },
        ]);
        return;
      }
    }

    setMessages(nextHistory);
    setInput('');
    setThinking(true);

    const assistantId = `a-${Date.now()}`;
    const controller = new AbortController();
    abortRef.current = controller;

    // Compact product summary trims request payload size for faster TTFT
    const compactProducts = publishedProducts.map((p) => ({
      name: p.name,
      slug: p.slug,
      category: p.category,
      status: p.status,
      version: p.version,
      platforms: p.platforms,
      websiteUrl: p.websiteUrl,
      description: p.description,
      availableFeatures: p.availableFeatures,
      plannedFeatures: p.plannedFeatures,
      downloadUrl: p.downloadUrl ? 'yes' : '',
    }));

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: nextHistory.map((m) => ({ role: m.role, content: m.content })),
          products: compactProducts,
          customInstructions: aiConfig.systemInstructions,
          knowledgeNotes: aiConfig.knowledgeNotes,
          aiEnabled: aiConfig.enabled,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Viora AI is temporarily unavailable.');
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('Stream unavailable.');

      const decoder = new TextDecoder();
      let accumulated = '';
      let buffer = '';

      setMessages((prev) => [
        ...prev,
        { id: assistantId, role: 'assistant', content: '' },
      ]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split('\n\n');
        buffer = events.pop() || '';

        for (const ev of events) {
          const line = ev.trim();
          if (!line.startsWith('data:')) continue;
          const jsonStr = line.slice(5).trim();
          try {
            const parsed = JSON.parse(jsonStr);
            if (parsed.error) {
              throw new Error(parsed.error);
            }
            if (parsed.text) {
              accumulated += parsed.text;
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId ? { ...m, content: accumulated } : m
                )
              );
            }
          } catch (parseErr: any) {
            if (parseErr?.message && !parseErr.message.includes('JSON')) {
              throw parseErr;
            }
          }
        }
      }
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        return;
      }
      setErrorMsg(err?.message || 'Unable to connect to Viora AI.');
      setMessages((prev) => prev.filter((m) => m.id !== assistantId || m.content.length > 0));
    } finally {
      abortRef.current = null;
      setThinking(false);
    }
  };

  const handleSheetDragEnd = (
    _: MouseEvent | TouchEvent | PointerEvent,
    info: { offset: { y: number }; velocity: { y: number } }
  ) => {
    if (info.offset.y > 90 || info.velocity.y > 420) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {!open ? (
        <motion.button
          key="viora-fab"
          initial={{ opacity: 0, y: 12, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.94 }}
          transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
          type="button"
          onClick={onOpen}
          aria-label="Open Viora AI assistant"
          className="fixed bottom-4 right-4 z-40 min-h-[44px] px-4 py-2.5 rounded-2xl border border-black/10 dark:border-white/15 bg-white/95 dark:bg-[#151922]/95 sm:backdrop-blur-md text-[#0b0c10] dark:text-white shadow-lg flex items-center gap-2 hover:border-violet-500/40 active:scale-95 transition-transform will-change-transform"
        >
          <Sparkles className="w-4 h-4 text-violet-600 dark:text-violet-400" />
          <span className="text-xs font-semibold">Viora AI</span>
        </motion.button>
      ) : (
        <div key="viora-sheet-wrapper" className="fixed inset-0 sm:inset-auto sm:bottom-5 sm:right-5 z-50 pointer-events-none">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
            className="sm:hidden fixed inset-0 bg-black/45 pointer-events-auto"
          />

          <motion.div
            key="viora-dialog"
            initial={{ opacity: 0, y: 28, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 32, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            drag="y"
            dragControls={dragControls}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0.04, bottom: 0.35 }}
            onDragEnd={handleSheetDragEnd}
            role="dialog"
            aria-label="Viora AI Assistant"
            className={`pointer-events-auto fixed sm:static inset-x-0 bottom-0 h-[84dvh] sm:inset-auto flex flex-col border border-black/10 dark:border-white/15 bg-white dark:bg-[#12151c] shadow-2xl overflow-hidden will-change-transform ${
              expanded
                ? 'rounded-t-3xl sm:rounded-2xl sm:w-[500px] sm:h-[620px]'
                : 'rounded-t-3xl sm:rounded-2xl sm:w-[390px] sm:h-[520px]'
            }`}
          >
            {/* Mobile Drag Handle */}
            <div
              onPointerDown={(e) => dragControls.start(e)}
              className="sm:hidden pt-3 pb-1.5 flex justify-center bg-[#f8f9fa] dark:bg-[#161b24] touch-none cursor-grab active:cursor-grabbing"
            >
              <div className="w-10 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
            </div>

            {/* Header */}
            <div
              onPointerDown={(e) => {
                if (window.innerWidth < 640 && !(e.target as HTMLElement).closest('button')) {
                  dragControls.start(e);
                }
              }}
              className="flex items-center justify-between px-4 py-2.5 sm:py-3 border-b border-black/8 dark:border-white/10 bg-[#f8f9fa] dark:bg-[#161b24]"
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-8 h-8 rounded-xl bg-violet-600 text-white flex items-center justify-center ${
                    thinking ? 'animate-pulse' : ''
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-display text-sm font-semibold text-[#0b0c10] dark:text-white leading-tight">
                    VIORA AI
                  </p>
                  <p className="text-[11px] text-[#4b5563] dark:text-slate-400">
                    Powered by Gemini
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    stopGeneration();
                    setMessages([INITIAL_GREETING]);
                    setErrorMsg(null);
                  }}
                  aria-label="Clear chat"
                  title="Clear conversation"
                  className="min-h-[44px] min-w-[44px] sm:min-h-[38px] sm:min-w-[38px] inline-flex items-center justify-center rounded-xl text-[#4b5563] dark:text-slate-400 hover:bg-black/5 dark:hover:bg-white/10"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setExpanded((e) => !e)}
                  aria-label={expanded ? 'Collapse window' : 'Expand window'}
                  className="hidden sm:inline-flex min-h-[38px] min-w-[38px] items-center justify-center rounded-xl text-[#4b5563] dark:text-slate-400 hover:bg-black/5 dark:hover:bg-white/10"
                >
                  {expanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close Viora AI"
                  className="min-h-[44px] min-w-[44px] sm:min-h-[38px] sm:min-w-[38px] inline-flex items-center justify-center rounded-xl text-[#4b5563] dark:text-slate-400 hover:bg-black/5 dark:hover:bg-white/10"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-violet-600 text-white rounded-br-sm'
                        : 'bg-[#f1f3f5] dark:bg-[#1b2029] text-[#0b0c10] dark:text-slate-100 rounded-bl-sm'
                    }`}
                  >
                    {msg.role === 'assistant'
                      ? renderRichMessage(msg.content, () => {
                          if (window.innerWidth < 640) onClose();
                        })
                      : msg.content}
                  </div>
                  {msg.instantPrompt && !thinking && (
                    <button
                      type="button"
                      onClick={() => sendPrompt(`Elaborate further on: ${msg.instantPrompt}`, true)}
                      className="mt-1 px-2 py-1 text-[11px] font-medium text-violet-700 dark:text-violet-400 hover:underline"
                    >
                      Ask Gemini for deeper details
                    </button>
                  )}
                </div>
              ))}

              {thinking && (
                <div className="flex justify-start">
                  <div className="inline-flex items-center gap-2 rounded-2xl rounded-bl-sm px-3.5 py-2.5 bg-[#f1f3f5] dark:bg-[#1b2029] text-xs text-[#4b5563] dark:text-slate-300">
                    <Sparkles className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400 animate-spin" />
                    <span>Viora is thinking...</span>
                  </div>
                </div>
              )}

              {errorMsg && (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-700 dark:text-red-300">
                  {errorMsg}
                </div>
              )}

              {messages.length <= 1 && !thinking && (
                <div className="pt-2 space-y-1.5">
                  <p className="text-[11px] font-medium text-[#4b5563] dark:text-slate-400">
                    Quick Shortcuts
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {SUGGESTIONS.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => sendPrompt(s)}
                        className="text-left text-xs min-h-[38px] px-3 py-1.5 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#161b24] text-[#0b0c10] dark:text-slate-200 hover:border-violet-500/50 transition-colors"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendPrompt(input);
              }}
              className="p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] border-t border-black/8 dark:border-white/10 bg-white dark:bg-[#12151c] flex items-center gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                maxLength={1500}
                placeholder={
                  aiConfig.enabled ? 'Ask Viora AI about apps or policies...' : 'Viora AI is currently paused'
                }
                disabled={!aiConfig.enabled || thinking}
                className="flex-1 min-h-[44px] px-3.5 rounded-xl bg-[#f1f3f5] dark:bg-[#1b2029] text-sm text-[#0b0c10] dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-600/40"
              />
              {thinking ? (
                <button
                  type="button"
                  onClick={stopGeneration}
                  aria-label="Stop response"
                  className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl bg-[#0b0c10] dark:bg-white text-white dark:text-[#0b0c10] hover:opacity-90 transition-opacity"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!aiConfig.enabled || !input.trim()}
                  aria-label="Send message"
                  className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-40 transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              )}
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
