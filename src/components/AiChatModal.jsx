import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Bot, Sparkles, Key, AlertCircle, BookOpen, RefreshCw } from 'lucide-react';

export function AiChatModal({
  isOpen,
  onClose,
  openAiKey,
  onOpenSettings,
  books = [],
  browsingHistory = [],
  initialBookToDiscuss = null
}) {
  const [messages, setMessages] = useState([
    {
      id: 'msg-welcome',
      role: 'assistant',
      text: 'Ahoj! Jsem tvůj osobní knižní AI asistent 🌿. Můžeš se mnou prokonzultovat jakoukoliv knihu, požádat o doporučení na čtení na míru, nebo si popovídat o tématech a postavách. O čem si dnes popovídáme?'
    }
  ]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [selectedBookCtx, setSelectedBookCtx] = useState(initialBookToDiscuss);
  const chatBottomRef = useRef(null);

  // Sync initial book to discuss when modal opens with a specific book
  useEffect(() => {
    if (initialBookToDiscuss) {
      setSelectedBookCtx(initialBookToDiscuss);
      setMessages((prev) => {
        // avoid duplicating welcome if already injected
        const hasSpecificMsg = prev.some((m) => m.text.includes(initialBookToDiscuss.title));
        if (!hasSpecificMsg) {
          return [
            ...prev,
            {
              id: 'msg-ctx-' + Date.now(),
              role: 'assistant',
              text: `Pojďme se podívat na knihu **"${initialBookToDiscuss.title}"** od **${initialBookToDiscuss.authors}**. Co by ses o ní chtěl/a dozvědět nebo prokonzultovat?`
            }
          ];
        }
        return prev;
      });
    }
  }, [initialBookToDiscuss]);

  // Scroll to bottom on new message
  useEffect(() => {
    if (isOpen) {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const handleQuickQuestion = (questionText) => {
    setInput(questionText);
  };

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    const userText = input.trim();
    if (!userText || isSending) return;

    const userMsg = {
      id: 'usr-' + Date.now(),
      role: 'user',
      text: userText
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsSending(true);

    if (!openAiKey) {
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            id: 'no-key-' + Date.now(),
            role: 'assistant',
            text: '🔑 Pro aktivaci živých AI odpovědí vložte v nastavení váš OpenAI API klíč. Zatím mohu pracovat v plném rozsahu, jakmile klíč uložíte.'
          }
        ]);
        setIsSending(false);
      }, 500);
      return;
    }

    try {
      // Build library context
      const librarySummary = books.map((b) => `- "${b.title}" od ${b.authors} (Stav: ${b.status || 'Chci si přečíst'}, Hodnocení: ${b.rating || 'nevyplněno'}/5)`).join('\n');
      const historySummary = browsingHistory.slice(0, 5).map((b) => `- "${b.title}" od ${b.authors}`).join('\n');

      const systemPrompt = `Jsi přátelský, sečtělý a inspirativní český knižní asistent a literární poradce v aplikaci "Moje Knihovna".
Tvým úkolem je vést s uživatelem přirozenou konverzaci o knihách, prokonzultovávat děj, myšlenky, postavy a dávat skvělá doporučení.

Kontext uživatelovy knihovny:
${librarySummary ? librarySummary : 'Zatím v knihovně nemá uložené žádné knihy.'}

Nedávno prohlížené knihy:
${historySummary ? historySummary : 'Žádná nedávná historie.'}

${selectedBookCtx ? `Aktuálně řešená kniha: "${selectedBookCtx.title}" od ${selectedBookCtx.authors}.
Popis knihy: ${selectedBookCtx.description || 'Neuveden'}.
Hlavní myšlenky: ${Array.isArray(selectedBookCtx.mainIdeas) ? selectedBookCtx.mainIdeas.join('; ') : 'Neuvedeny'}` : ''}

Odpovídej vždy zdvořile, přehledně, česky a s láskou k literatuře. Můžeš používat odrážky nebo zvýrazňovat názvy knih.`;

      const apiMessages = [
        { role: 'system', content: systemPrompt },
        ...messages
          .filter((m) => m.id !== 'msg-welcome' && !m.id.startsWith('no-key-'))
          .map((m) => ({
            role: m.role === 'user' ? 'user' : 'assistant',
            content: m.text
          })),
        { role: 'user', content: userText }
      ];

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openAiKey.trim()}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: apiMessages,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error?.message || `Chyba API serveru (${response.status})`);
      }

      const data = await response.json();
      const aiReply = data.choices?.[0]?.message?.content || 'Promiň, nepodařilo se mi vygenerovat odpověď.';

      setMessages((prev) => [
        ...prev,
        {
          id: 'ai-' + Date.now(),
          role: 'assistant',
          text: aiReply
        }
      ]);
    } catch (err) {
      console.error('AI chat error:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: 'err-' + Date.now(),
          role: 'assistant',
          text: `Omlouvám se, nastala chyba při komunikaci s OpenAI: ${err.message}`
        }
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: 'msg-welcome-' + Date.now(),
        role: 'assistant',
        text: 'Konverzace byla vyčištěna. O jaké knize si dnes popovídáme?'
      }
    ]);
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="bg-[#fbf9f5] rounded-2xl max-w-2xl w-full h-[85vh] sm:h-[80vh] p-4 sm:p-6 shadow-2xl border border-emerald-200 relative flex flex-col animate-in fade-in zoom-in-95 duration-200">

        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-200/80">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-emerald-800 text-stone-50 rounded-xl shadow-xs">
              <Bot className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-serif font-bold text-emerald-950 flex items-center space-x-1.5">
                <span>AI Knižní Asistent</span>
                <span className="text-[10px] bg-emerald-100 text-emerald-900 border border-emerald-200 px-2 py-0.5 rounded-full font-sans font-semibold">
                  GPT-4o Mini
                </span>
              </h3>
              <p className="text-xs text-stone-600">
                Interaktivní konzultace obsahu, postav a osobní knižní doporučení
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-1">
            <button
              onClick={handleClearChat}
              title="Vyčistit chat"
              className="p-1.5 rounded-xl hover:bg-stone-200/60 text-stone-500 hover:text-stone-800 transition cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-stone-200/60 text-stone-500 hover:text-stone-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Selected Context Bar */}
        {selectedBookCtx && (
          <div className="mt-2.5 px-3 py-2 bg-emerald-100/70 border border-emerald-200 rounded-xl flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2 truncate">
              <BookOpen className="w-4 h-4 text-emerald-800 shrink-0" />
              <span className="text-stone-700">
                Konzultace k tisku: <strong className="text-emerald-950 font-serif">{selectedBookCtx.title}</strong> ({selectedBookCtx.authors})
              </span>
            </div>
            <button
              onClick={() => setSelectedBookCtx(null)}
              className="text-emerald-800 hover:text-emerald-950 text-[11px] font-semibold underline shrink-0 ml-2 cursor-pointer"
            >
              Zrušit vazbu
            </button>
          </div>
        )}

        {/* OpenAI Key missing warning banner */}
        {!openAiKey && (
          <div className="mt-2.5 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-xs text-amber-900">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
              <span>Pro spuštění AI odpovídání vložte váš OpenAI API klíč v nastavení.</span>
            </div>
            <button
              onClick={onOpenSettings}
              className="px-2.5 py-1 bg-amber-200 hover:bg-amber-300 text-amber-950 font-bold rounded-lg transition shrink-0 ml-2 cursor-pointer flex items-center space-x-1"
            >
              <Key className="w-3 h-3" />
              <span>Zadat klíč</span>
            </button>
          </div>
        )}

        {/* Quick Questions Suggestions */}
        <div className="mt-3 flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] custom-scrollbar">
          <span className="text-stone-400 font-medium shrink-0 flex items-center space-x-1">
            <Sparkles className="w-3 h-3 text-emerald-700" />
            <span>Tipy:</span>
          </span>
          {[
            'Doporuč mi podobnou knihu na míru',
            'Analyzuj hlavní postavy a jejich jednání',
            'Vysvětli mi skryté poselství příběhu',
            'Co si přečíst dalšího z mojí knihovny?'
          ].map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleQuickQuestion(prompt)}
              className="px-2.5 py-1 rounded-full bg-white hover:bg-emerald-50 border border-stone-200/80 text-stone-700 hover:text-emerald-950 whitespace-nowrap transition cursor-pointer shadow-2xs shrink-0"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto my-3 space-y-3.5 pr-1.5 custom-scrollbar">
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`flex items-start space-x-2.5 ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}
              >
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${
                    isUser
                      ? 'bg-stone-200 border-stone-300 text-stone-800'
                      : 'bg-emerald-800 border-emerald-700 text-emerald-100'
                  }`}
                >
                  {isUser ? '👤' : <Bot className="w-4 h-4 text-emerald-200" />}
                </div>

                <div
                  className={`max-w-[85%] sm:max-w-[80%] p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-xs whitespace-pre-wrap ${
                    isUser
                      ? 'bg-emerald-700 text-stone-50 rounded-tr-none font-medium'
                      : 'bg-white text-stone-800 border border-stone-200/80 rounded-tl-none'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            );
          })}

          {isSending && (
            <div className="flex items-center space-x-2 text-stone-500 text-xs italic pl-10">
              <Bot className="w-4 h-4 animate-bounce text-emerald-700" />
              <span>AI přemýšlí nad odpovědí...</span>
            </div>
          )}

          <div ref={chatBottomRef} />
        </div>

        {/* Input Form */}
        <form onSubmit={handleSendMessage} className="pt-2 border-t border-stone-200 flex items-center space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Napište dotaz nebo zprávu pro AI asistenta..."
            className="flex-1 px-4 py-2.5 rounded-xl border border-stone-300 bg-white text-stone-900 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <button
            type="submit"
            disabled={isSending || !input.trim()}
            className="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-semibold text-xs sm:text-sm flex items-center space-x-1.5 transition shadow-xs cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Odeslat</span>
          </button>
        </form>
      </div>
    </div>
  );
}
