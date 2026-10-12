const STORAGE_KEY_BOOKS = 'knihovna_books_v1';
const STORAGE_KEY_SETTINGS = 'knihovna_settings_v1';

export function getSavedBooks() {
  try {
    const data = localStorage.getItem(STORAGE_KEY_BOOKS);
    return data ? JSON.parse(data) : [];
  } catch (err) {
    console.error('Error reading books from localStorage:', err);
    return [];
  }
}

export function saveBooks(books) {
  try {
    localStorage.setItem(STORAGE_KEY_BOOKS, JSON.stringify(books));
  } catch (err) {
    console.error('Error saving books to localStorage:', err);
  }
}

export function getSettings() {
  try {
    const data = localStorage.getItem(STORAGE_KEY_SETTINGS);
    return data ? JSON.parse(data) : { openAiKey: '', autoEnrichWithAi: false };
  } catch (err) {
    console.error('Error reading settings from localStorage:', err);
    return { openAiKey: '', autoEnrichWithAi: false };
  }
}

export function saveSettings(settings) {
  try {
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
  } catch (err) {
    console.error('Error saving settings to localStorage:', err);
  }
}
