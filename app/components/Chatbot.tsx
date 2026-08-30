'use client';

import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import 'katex/dist/katex.min.css';

import { Button } from '@/app/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import {
  Bot,
  X,
  Send,
  Loader2,
  Sparkles,
  Minimize2,
  Maximize2,
  RotateCcw,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

const INITIAL_MESSAGE: ChatMessage = {
  id: 'welcome_msg',
  role: 'assistant',
  content: `Halo! Saya **Asisten AI Recovery Sumatera**. Tanyakan kepada saya mengenai:
- Analisis ketahanan pangan & neraca energi: \\[ \\text{Neraca Pangan} = \\text{Ketersediaan Energi} - \\text{Kebutuhan Energi} \\]
- Estimasi produktivitas padi (satuan **Ton/km²**)
- Status ketahanan (**5 kelas resilience**) & skor recovery
- Rekomendasi kebijakan spesifik tingkat kecamatan di Aceh, Sumut, dan Sumbar.`,
};

const SUGGESTIONS = [
  'Apa itu Neraca Pangan dan bagaimana rumusnya?',
  'Bagaimana tren pemulihan di Aceh?',
  'Apa saja 5 kelas status Resilience?',
  'Rekomendasi kebijakan untuk Sumatera Barat',
  'Mengapa produktivitas memakai Ton/km²?',
];

export const Chatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [input, setInput] = useState<string>('');
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll ke pesan terbaru
  useEffect(() => {
    if (isOpen && !isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isMinimized, isLoading]);

  const handleSendMessage = async (textToSend: string) => {
    const cleanText = textToSend.trim();
    if (!cleanText || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: cleanText,
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
      });

      if (!response.ok) {
        throw new Error('Gagal menghubungi AI Assistant');
      }

      if (!response.body) {
        throw new Error('Response body is empty');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      const assistantMessageId = `asst_${Date.now()}`;
      let accumulatedText = '';

      // Tambahkan placeholder assistant message
      setMessages([...newMessages, { id: assistantMessageId, role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        accumulatedText += chunk;

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId ? { ...msg, content: accumulatedText } : msg
          )
        );
      }
    } catch (err: any) {
      console.error('Chat error:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          role: 'assistant',
          content:
            'Maaf, terjadi kendala saat memproses jawaban dari server. Silakan coba lagi beberapa saat lagi.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(input);
  };

  const handleResetChat = () => {
    setMessages([INITIAL_MESSAGE]);
  };

  return (
    <>
      {/* Floating Action Trigger Button (Fixed Bottom-Right, High Z-Index) */}
      {!isOpen && (
        <div className="chatbot-trigger fixed bottom-6 right-6 z-[9999] flex items-center gap-2 group pointer-events-auto">
          <div className="hidden md:flex items-center px-3 py-1.5 rounded-full bg-card/95 border border-border shadow-lg text-xs font-semibold text-foreground backdrop-blur-md transition-all group-hover:scale-105">
            <Sparkles className="w-3.5 h-3.5 text-emerald-500 mr-1.5 animate-pulse" />
            Tanya Asisten AI
          </div>

          <Button
            onClick={() => {
              setIsOpen(true);
              setIsMinimized(false);
            }}
            className="w-14 h-14 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white shadow-2xl shadow-emerald-900/40 flex items-center justify-center p-0 transition-transform duration-300 hover:scale-110 active:scale-95"
            aria-label="Buka Chatbot AI"
          >
            <Bot className="w-7 h-7" />
            <span className="absolute top-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-background animate-ping" />
            <span className="absolute top-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-background" />
          </Button>
        </div>
      )}

      {/* Chatbot Window Container (Z-Index 9999 to guarantee no overlap with map canvas or legends) */}
      {isOpen && (
        <Card
          className={`chatbot-container fixed bottom-6 right-6 z-[9999] w-[380px] sm:w-[450px] max-w-[calc(100vw-2rem)] border-border bg-card/95 backdrop-blur-xl shadow-2xl transition-all duration-300 flex flex-col rounded-2xl overflow-hidden pointer-events-auto ${
            isMinimized ? 'h-[64px]' : 'h-[590px] max-h-[85vh]'
          }`}
        >
          {/* Header Bar */}
          <CardHeader className="p-3.5 px-4 bg-gradient-to-r from-emerald-600/15 via-card to-card border-b border-border flex flex-row items-center justify-between space-y-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-sm">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <CardTitle className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <span>Asisten AI Riset</span>
                  <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">
                    Online
                  </Badge>
                </CardTitle>
                <p className="text-[10px] text-muted-foreground">Recovery Sumatera RAG Engine</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetChat}
                className="w-7 h-7 p-0 text-muted-foreground hover:text-foreground"
                title="Reset Percakapan"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMinimized(!isMinimized)}
                className="w-7 h-7 p-0 text-muted-foreground hover:text-foreground"
                title={isMinimized ? 'Perbesar' : 'Minimalkan'}
              >
                {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="w-7 h-7 p-0 text-muted-foreground hover:text-foreground"
                title="Tutup"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>

          {/* Chat Messages Body */}
          {!isMinimized && (
            <>
              <CardContent className="flex-1 p-3.5 overflow-y-auto space-y-3">
                {messages.map((msg) => {
                  const isUser = msg.role === 'user';
                  return (
                    <div
                      key={msg.id}
                      className={`flex gap-2 items-start ${isUser ? 'justify-end' : 'justify-start'}`}
                    >
                      {!isUser && (
                        <div className="w-6 h-6 rounded-lg bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5">
                          <Sparkles className="w-3.5 h-3.5" />
                        </div>
                      )}

                      <div
                        className={`max-w-[88%] rounded-xl p-3 shadow-xs text-xs leading-relaxed overflow-x-auto ${
                          isUser
                            ? 'bg-emerald-600 text-white font-medium rounded-tr-none'
                            : 'bg-background/95 border border-border text-foreground rounded-tl-none prose prose-xs dark:prose-invert max-w-none'
                        }`}
                      >
                        {isUser ? (
                          <p className="whitespace-pre-wrap text-xs">{msg.content}</p>
                        ) : (
                          <ReactMarkdown
                            remarkPlugins={[remarkMath, remarkGfm]}
                            rehypePlugins={[rehypeKatex]}
                            components={{
                              p: ({ children }) => <p className="mb-1.5 last:mb-0 text-xs leading-relaxed">{children}</p>,
                              ul: ({ children }) => <ul className="list-disc pl-4 space-y-1 my-1 text-xs">{children}</ul>,
                              ol: ({ children }) => <ol className="list-decimal pl-4 space-y-1 my-1 text-xs">{children}</ol>,
                              li: ({ children }) => <li className="text-xs">{children}</li>,
                              h1: ({ children }) => <h1 className="text-sm font-bold text-foreground my-1.5">{children}</h1>,
                              h2: ({ children }) => <h2 className="text-xs font-bold text-foreground my-1.5">{children}</h2>,
                              h3: ({ children }) => <h3 className="text-xs font-bold text-foreground my-1">{children}</h3>,
                              code: ({ children, className }) => (
                                <code className={`${className || ''} bg-muted px-1 py-0.5 rounded text-[11px] font-mono text-emerald-600 dark:text-emerald-400`}>
                                  {children}
                                </code>
                              ),
                              table: ({ children }) => (
                                <div className="overflow-x-auto my-2 border border-border rounded-lg">
                                  <table className="min-w-full divide-y divide-border text-[11px]">{children}</table>
                                </div>
                              ),
                              th: ({ children }) => <th className="px-2 py-1 bg-muted font-bold text-left text-[11px]">{children}</th>,
                              td: ({ children }) => <td className="px-2 py-1 border-t border-border/60 text-[11px]">{children}</td>,
                            }}
                          >
                            {msg.content}
                          </ReactMarkdown>
                        )}
                      </div>
                    </div>
                  );
                })}

                {isLoading && (
                  <div className="flex gap-2 items-start justify-start">
                    <div className="w-6 h-6 rounded-lg bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center text-emerald-600 dark:text-emerald-400 flex-shrink-0">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    </div>
                    <div className="bg-background/95 border border-border rounded-xl rounded-tl-none p-3 shadow-xs flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce" />
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce [animation-delay:0.2s]" />
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce [animation-delay:0.4s]" />
                      <span className="text-[11px] ml-1">Menganalisis data spasial & formula...</span>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </CardContent>

              {/* Suggestion Chips */}
              <div className="px-3.5 py-1.5 border-t border-border/50 bg-muted/20 overflow-x-auto flex gap-1.5 scrollbar-none">
                {SUGGESTIONS.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(item)}
                    className="text-[10px] whitespace-nowrap bg-background hover:bg-muted text-muted-foreground hover:text-foreground border border-border px-2.5 py-1 rounded-full transition-all flex-shrink-0"
                  >
                    {item}
                  </button>
                ))}
              </div>

              {/* Input Footer */}
              <CardFooter className="p-3 border-t border-border bg-card">
                <form onSubmit={handleSubmit} className="flex items-center gap-2 w-full">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Tanyakan analisis atau formula ketahanan pangan..."
                    disabled={isLoading}
                    className="flex-1 bg-background border border-border rounded-xl px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-50"
                  />

                  <Button
                    type="submit"
                    size="sm"
                    disabled={isLoading || !input.trim()}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-3 h-8 flex items-center justify-center transition-all disabled:opacity-40 shadow-xs"
                  >
                    {isLoading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                  </Button>
                </form>
              </CardFooter>
            </>
          )}
        </Card>
      )}
    </>
  );
};
