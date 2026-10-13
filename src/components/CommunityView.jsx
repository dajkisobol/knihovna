import React, { useState, useEffect } from 'react';
import { Star, Send, Users, Sparkles, RefreshCw } from 'lucide-react';
import { fetchReviews, addReview, fetchCommunityChat, sendChatMessage } from '../services/communityService';

export function CommunityView({ activeProfile, books }) {
  const [activeTab, setActiveTab] = useState('reviews'); // 'reviews' | 'chat'
  const [reviews, setReviews] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  // New review form state
  const [selectedBookIsbn, setSelectedBookIsbn] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Chat input state
  const [chatInput, setChatInput] = useState('');
  const [isSendingChat, setIsSendingChat] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [revs, msgs] = await Promise.all([
        fetchReviews(),
        fetchCommunityChat()
      ]);
      setReviews(revs);
      setChatMessages(msgs);
    } catch (err) {
      console.error('Failed to load community data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handlePostReview = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;

    setIsSubmittingReview(true);
    const selectedBook = books.find(b => b.isbn === selectedBookIsbn);
    const bookTitle = selectedBook ? selectedBook.title : 'Kniha z veřejné databáze';

    try {
      const newRev = await addReview({
        isbn: selectedBookIsbn || '9788020712219',
        bookTitle,
        userName: activeProfile?.name || 'Čtenář',
        avatar: activeProfile?.avatar || '📚',
        rating,
        comment
      });
      setReviews([newRev, ...reviews]);
      setComment('');
    } catch (err) {
      alert('Nepodařilo se odeslat recenzi: ' + err.message);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleSendChat = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    setIsSendingChat(true);
    try {
      const newMsg = await sendChatMessage({
        userName: activeProfile?.name || 'Čtenář',
        avatar: activeProfile?.avatar || '📚',
        message: chatInput
      });
      setChatMessages([...chatMessages, newMsg]);
      setChatInput('');
    } catch (err) {
      alert('Chyba při odesílání zprávy: ' + err.message);
    } finally {
      setIsSendingChat(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-amber-200/80 via-amber-100 to-amber-200/50 p-5 rounded-2xl border border-amber-300/80 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 bg-amber-400 text-amber-950 rounded-xl text-2xl shadow-xs">
            💬
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-stone-900 tracking-tight">
              Veřejný komunitní prostor
            </h2>
            <p className="text-xs text-stone-700 font-medium">
              Sdílejte hodnocení knih a diskutujte živě s ostatními čtenáři
            </p>
          </div>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-amber-300 hover:bg-amber-400 text-amber-950 font-semibold text-xs transition cursor-pointer shadow-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Obnovit živá data</span>
        </button>
      </div>

      {/* Tabs bar */}
      <div className="flex items-center space-x-2 border-b border-amber-200 pb-1">
        <button
          onClick={() => setActiveTab('reviews')}
          className={`px-4 py-2 rounded-xl font-bold text-xs sm:text-sm flex items-center space-x-2 transition cursor-pointer ${
            activeTab === 'reviews'
              ? 'bg-amber-400 text-amber-950 shadow-xs'
              : 'text-stone-600 hover:bg-amber-100'
          }`}
        >
          <Star className="w-4 h-4 fill-amber-950/20" />
          <span>Recenze & Hodnocení</span>
        </button>

        <button
          onClick={() => setActiveTab('chat')}
          className={`px-4 py-2 rounded-xl font-bold text-xs sm:text-sm flex items-center space-x-2 transition cursor-pointer ${
            activeTab === 'chat'
              ? 'bg-amber-400 text-amber-950 shadow-xs'
              : 'text-stone-600 hover:bg-amber-100'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Živá čtenářská chatovna</span>
        </button>
      </div>

      {/* Tab Content 1: Reviews */}
      {activeTab === 'reviews' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Post New Review Form */}
          <div className="lg:col-span-1 bg-amber-100/60 p-5 rounded-2xl border border-amber-200 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-stone-900 flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-amber-700" />
              <span>Napsat hodnocení k knize</span>
            </h3>

            <form onSubmit={handlePostReview} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Vyberte knihu ze své knihovny
                </label>
                <select
                  value={selectedBookIsbn}
                  onChange={(e) => setSelectedBookIsbn(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-amber-300 bg-white text-stone-800 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer"
                >
                  <option value="">Všeobecná recenze / Vybrat knihu...</option>
                  {books.map((b) => (
                    <option key={b.isbn} value={b.isbn}>
                      {b.title} ({b.authors})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Hodnocení
                </label>
                <div className="flex items-center space-x-1 bg-white/80 p-2 rounded-xl border border-amber-200">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="p-1 hover:scale-110 transition cursor-pointer"
                    >
                      <Star
                        className={`w-5 h-5 ${
                          star <= rating
                            ? 'fill-amber-400 text-amber-500'
                            : 'text-stone-300'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-stone-700 ml-2">{rating} / 5</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Vaše recenze / dojem z knihy
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Co se vám na knize nejvíce líbilo nebo co vás překvapilo?"
                  rows={3}
                  required
                  className="w-full p-3 rounded-xl border border-amber-300 bg-white text-stone-900 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingReview}
                className="w-full py-2.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-amber-950 font-bold text-xs shadow-xs transition cursor-pointer"
              >
                {isSubmittingReview ? 'Odesílám...' : 'Zveřejnit recenzi'}
              </button>
            </form>
          </div>

          {/* List of Community Reviews */}
          <div className="lg:col-span-2 space-y-3">
            {reviews.length > 0 ? (
              reviews.map((rev) => (
                <div
                  key={rev.id || rev.created_at}
                  className="bg-white/80 border border-amber-200 p-4 rounded-2xl shadow-xs space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2.5">
                      <span className="text-xl p-1 bg-amber-100 rounded-lg">{rev.avatar || '👤'}</span>
                      <div>
                        <h4 className="text-xs font-bold text-stone-900 leading-tight">
                          {rev.userName || rev.user_name || 'Čtenář'}
                        </h4>
                        <span className="text-[10px] text-amber-800 font-medium">
                          kniha: <strong className="text-stone-800">{rev.bookTitle || rev.book_title || 'Maly princ'}</strong>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-3.5 h-3.5 ${
                            star <= (rev.rating || 5)
                              ? 'fill-amber-400 text-amber-500'
                              : 'text-stone-200'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  <p className="text-xs text-stone-700 leading-relaxed bg-amber-50/50 p-2.5 rounded-xl border border-amber-100">
                    "{rev.comment}"
                  </p>
                </div>
              ))
            ) : (
              <p className="text-xs text-stone-500 text-center py-10 bg-amber-100/30 rounded-2xl border border-dashed border-amber-300">
                Zatím nebyly přidány žádné recenze. Buďte první!
              </p>
            )}
          </div>
        </div>
      )}

      {/* Tab Content 2: Chat */}
      {activeTab === 'chat' && (
        <div className="bg-amber-100/40 border border-amber-200 rounded-2xl p-4 sm:p-5 space-y-4 max-w-3xl mx-auto shadow-xs">
          <div className="h-80 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
            {chatMessages.map((msg) => {
              const isMe = msg.userName === activeProfile?.name;
              return (
                <div
                  key={msg.id || msg.created_at}
                  className={`flex items-start space-x-2.5 ${isMe ? 'flex-row-reverse space-x-reverse' : ''}`}
                >
                  <span className="text-2xl p-1 bg-amber-200/80 rounded-xl shrink-0">
                    {msg.avatar || '👤'}
                  </span>
                  <div
                    className={`max-w-[80%] p-3 rounded-2xl text-xs space-y-1 shadow-xs ${
                      isMe
                        ? 'bg-amber-400 text-amber-950 font-medium rounded-tr-none'
                        : 'bg-white text-stone-800 border border-amber-200 rounded-tl-none'
                    }`}
                  >
                    <p className="text-[10px] font-bold opacity-80">
                      {msg.userName || msg.user_name || 'Čtenář'}
                    </p>
                    <p className="leading-relaxed">{msg.message}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Send Message Form */}
          <form onSubmit={handleSendChat} className="flex items-center space-x-2 pt-2 border-t border-amber-200">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder={`Napište zprávu jako ${activeProfile?.name || 'Čtenář'}...`}
              className="flex-1 px-4 py-2.5 rounded-xl border border-amber-300 bg-white text-stone-900 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
            <button
              type="submit"
              disabled={isSendingChat}
              className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-amber-950 font-bold text-xs flex items-center space-x-1.5 transition shadow-xs cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">{isSendingChat ? 'Odesílám...' : 'Odeslat'}</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
