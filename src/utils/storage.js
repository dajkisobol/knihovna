const STORAGE_KEY_BOOKS = 'knihovna_books_v1';
const STORAGE_KEY_SETTINGS = 'knihovna_settings_v1';
const STORAGE_KEY_PROFILES = 'knihovna_profiles_v1';
const STORAGE_KEY_ACTIVE_PROFILE = 'knihovna_active_profile_v1';
const STORAGE_KEY_HISTORY = 'knihovna_browsing_history_v1';

const DEFAULT_PROFILES = [
  { id: 'prof-1', name: 'Čtenář / Čtenářka', avatar: '📚', bio: 'Milovník knih', createdAt: new Date().toISOString() },
  { id: 'prof-2', name: 'Knihomol', avatar: '🦊', bio: 'Přečtu všechno!', createdAt: new Date().toISOString() }
];

export function getProfiles() {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return DEFAULT_PROFILES;
    const data = localStorage.getItem(STORAGE_KEY_PROFILES);
    if (!data) return DEFAULT_PROFILES;
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_PROFILES;
  } catch (err) {
    console.error('Error reading profiles:', err);
    return DEFAULT_PROFILES;
  }
}

export function saveProfiles(profiles) {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    localStorage.setItem(STORAGE_KEY_PROFILES, JSON.stringify(profiles));
  } catch (err) {
    console.error('Error saving profiles:', err);
  }
}

export function getActiveProfile() {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return DEFAULT_PROFILES[0];
    const data = localStorage.getItem(STORAGE_KEY_ACTIVE_PROFILE);
    if (!data) return DEFAULT_PROFILES[0];
    const parsed = JSON.parse(data);
    return parsed || DEFAULT_PROFILES[0];
  } catch (err) {
    return DEFAULT_PROFILES[0];
  }
}

export function saveActiveProfile(profile) {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    localStorage.setItem(STORAGE_KEY_ACTIVE_PROFILE, JSON.stringify(profile));
  } catch (err) {
    console.error('Error saving active profile:', err);
  }
}

export function getBrowsingHistory() {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return [];
    const data = localStorage.getItem(STORAGE_KEY_HISTORY);
    if (!data) return [];
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Error reading browsing history:', err);
    return [];
  }
}

export function addBrowsingHistory(book) {
  if (!book || !book.isbn) return [];
  try {
    const current = getBrowsingHistory();
    const filtered = current.filter(item => item.isbn !== book.isbn);
    const entry = {
      ...book,
      viewedAt: new Date().toISOString()
    };
    const updated = [entry, ...filtered].slice(0, 30); // keep last 30 viewed books
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(updated));
    }
    return updated;
  } catch (err) {
    console.error('Error adding to browsing history:', err);
    return [];
  }
}

export function clearBrowsingHistory() {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem(STORAGE_KEY_HISTORY);
    }
  } catch (err) {
    console.error('Error clearing history:', err);
  }
}

export function getSavedBooks() {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return [];
    const data = localStorage.getItem(STORAGE_KEY_BOOKS);
    if (!data) return [];
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Error reading books from localStorage:', err);
    return [];
  }
}

export function saveBooks(books) {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    localStorage.setItem(STORAGE_KEY_BOOKS, JSON.stringify(books));
  } catch (err) {
    console.error('Error saving books to localStorage:', err);
  }
}

export function getSettings() {
  const defaultSettings = { openAiKey: '', autoEnrichWithAi: false };
  try {
    if (typeof window === 'undefined' || !window.localStorage) return defaultSettings;
    const data = localStorage.getItem(STORAGE_KEY_SETTINGS);
    if (!data) return defaultSettings;
    const parsed = JSON.parse(data);
    return typeof parsed === 'object' && parsed !== null ? { ...defaultSettings, ...parsed } : defaultSettings;
  } catch (err) {
    console.error('Error reading settings from localStorage:', err);
    return defaultSettings;
  }
}

export function saveSettings(settings) {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
  } catch (err) {
    console.error('Error saving settings to localStorage:', err);
  }
}
