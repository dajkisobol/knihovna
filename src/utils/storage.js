const STORAGE_KEY_BOOKS = 'knihovna_books_v1';
const STORAGE_KEY_SETTINGS = 'knihovna_settings_v1';

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
