import { createClient } from '@supabase/supabase-js';

// Default public Supabase demo/fallback endpoint if custom env keys aren't set
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://xyzcompany.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const LOCAL_STORAGE_REVIEWS = 'knihovna_community_reviews_v1';
const LOCAL_STORAGE_CHAT = 'knihovna_community_chat_v1';

// Pre-populated sample community reviews
const SAMPLE_REVIEWS = [
  {
    id: 'rev-1',
    isbn: '9788020712219',
    bookTitle: 'Maly princ',
    userName: 'Anet',
    avatar: '🦊',
    rating: 5,
    comment: 'Krasna kniha plna hlubokych myslenek. Doporucuji precist kazdemu nezalezi na veku!',
    createdAt: new Date(Date.now() - 3600000 * 24 * 2).toISOString()
  },
  {
    id: 'rev-2',
    isbn: '9788020712219',
    bookTitle: 'Maly princ',
    userName: 'Petr_K',
    avatar: '📖',
    rating: 4,
    comment: 'Moje oblíbena klasika, ilustrace v knize jsou kouzelné.',
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString()
  }
];

const SAMPLE_CHAT = [
  {
    id: 'chat-1',
    userName: 'Knihomolka_Evis',
    avatar: '🦉',
    message: 'Ahoj všichni! Máte tip na dobrou detektivku na víkend?',
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString()
  },
  {
    id: 'chat-2',
    userName: 'Martin_Read',
    avatar: '🦁',
    message: 'Určitě zkus cokoliv od Jo Nesbøho nebo Robert Galbraith!',
    createdAt: new Date(Date.now() - 3600000 * 1).toISOString()
  }
];

export async function fetchReviews(isbn) {
  try {
    if (import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY) {
      let query = supabase.from('reviews').select('*').order('created_at', { ascending: false });
      if (isbn) query = query.eq('isbn', isbn);
      const { data, error } = await query;
      if (!error && data) return data;
    }
  } catch (err) {
    console.warn('Supabase fetch error, using local/sample memory fallback:', err);
  }

  // Local fallback
  try {
    const local = localStorage.getItem(LOCAL_STORAGE_REVIEWS);
    const reviews = local ? JSON.parse(local) : SAMPLE_REVIEWS;
    if (isbn) {
      return reviews.filter(r => r.isbn === isbn);
    }
    return reviews;
  } catch {
    return SAMPLE_REVIEWS;
  }
}

export async function addReview({ isbn, bookTitle, userName, avatar, rating, comment }) {
  const newReview = {
    id: 'rev-' + Date.now(),
    isbn,
    bookTitle,
    userName: userName || 'Anonymní čtenář',
    avatar: avatar || '👤',
    rating: Number(rating) || 5,
    comment: comment.trim(),
    createdAt: new Date().toISOString()
  };

  try {
    if (import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY) {
      const { data, error } = await supabase.from('reviews').insert([{
        isbn,
        book_title: bookTitle,
        user_name: newReview.userName,
        avatar: newReview.avatar,
        rating: newReview.rating,
        comment: newReview.comment
      }]).select();
      if (!error && data) return data[0];
    }
  } catch (err) {
    console.warn('Supabase insert error, saving locally:', err);
  }

  // Save in local storage
  try {
    const existing = await fetchReviews();
    const updated = [newReview, ...existing];
    localStorage.setItem(LOCAL_STORAGE_REVIEWS, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save review locally:', err);
  }

  return newReview;
}

export async function fetchCommunityChat() {
  try {
    if (import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY) {
      const { data, error } = await supabase.from('community_chat').select('*').order('created_at', { ascending: true }).limit(50);
      if (!error && data) return data;
    }
  } catch (err) {
    console.warn('Supabase chat error, using local fallback:', err);
  }

  try {
    const local = localStorage.getItem(LOCAL_STORAGE_CHAT);
    return local ? JSON.parse(local) : SAMPLE_CHAT;
  } catch {
    return SAMPLE_CHAT;
  }
}

export async function sendChatMessage({ userName, avatar, message }) {
  const newMsg = {
    id: 'msg-' + Date.now(),
    userName: userName || 'Čtenář',
    avatar: avatar || '👤',
    message: message.trim(),
    createdAt: new Date().toISOString()
  };

  try {
    if (import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY) {
      const { data, error } = await supabase.from('community_chat').insert([{
        user_name: newMsg.userName,
        avatar: newMsg.avatar,
        message: newMsg.message
      }]).select();
      if (!error && data) return data[0];
    }
  } catch (err) {
    console.warn('Supabase chat send error, saving locally:', err);
  }

  try {
    const existing = await fetchCommunityChat();
    const updated = [...existing, newMsg];
    localStorage.setItem(LOCAL_STORAGE_CHAT, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save chat message locally:', err);
  }

  return newMsg;
}
