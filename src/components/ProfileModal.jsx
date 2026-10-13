import React, { useState } from 'react';
import { Plus, Check, X } from 'lucide-react';

const AVATAR_OPTIONS = ['📚', '🦊', '🦉', '🦁', '📖', '🐱', '☕', '🎨', '🚀', '🌟'];

export function ProfileModal({
  isOpen,
  onClose,
  profiles,
  activeProfile,
  onSwitchProfile,
  onCreateProfile
}) {
  const [isCreating, setIsCreating] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [avatarInput, setAvatarInput] = useState('📚');
  const [bioInput, setBioInput] = useState('');

  if (!isOpen) return null;

  const handleCreate = (e) => {
    e.preventDefault();
    if (!nameInput.trim()) return;
    const newProfile = {
      id: 'prof-' + Date.now(),
      name: nameInput.trim(),
      avatar: avatarInput,
      bio: bioInput.trim() || 'Čtenář knihovny',
      createdAt: new Date().toISOString()
    };
    onCreateProfile(newProfile);
    setNameInput('');
    setBioInput('');
    setIsCreating(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-amber-50 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-amber-200 relative animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-amber-200/50 text-stone-500 hover:text-stone-800 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 mb-5">
          <div className="p-2.5 bg-amber-300 text-amber-950 rounded-xl text-xl">
            {activeProfile?.avatar || '👤'}
          </div>
          <div>
            <h3 className="text-lg font-bold text-stone-900">Uživatelský profil</h3>
            <p className="text-xs text-stone-600">Správa profilů a nastavení identity</p>
          </div>
        </div>

        {/* Existing Profiles List */}
        {!isCreating ? (
          <div className="space-y-4">
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {profiles.map((prof) => {
                const isActive = activeProfile?.id === prof.id;
                return (
                  <div
                    key={prof.id}
                    onClick={() => onSwitchProfile(prof)}
                    className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                      isActive
                        ? 'bg-amber-200/80 border-amber-400 shadow-xs'
                        : 'bg-white/80 hover:bg-amber-100/60 border-amber-200/80'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{prof.avatar || '👤'}</span>
                      <div>
                        <h4 className="text-sm font-bold text-stone-900 leading-tight">
                          {prof.name}
                        </h4>
                        <p className="text-xs text-stone-600 truncate max-w-[180px]">
                          {prof.bio || 'Milovník knih'}
                        </p>
                      </div>
                    </div>
                    {isActive && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-400 text-amber-950 text-[10px] font-bold flex items-center space-x-1">
                        <Check className="w-3 h-3" />
                        <span>Aktivní</span>
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => setIsCreating(true)}
              className="w-full py-2.5 rounded-xl border border-dashed border-amber-400 hover:bg-amber-100/60 text-amber-900 font-semibold text-xs flex items-center justify-center space-x-2 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Založit nový profil</span>
            </button>
          </div>
        ) : (
          /* Create Profile Form */
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                Vyberte si ikonku / avatara
              </label>
              <div className="flex flex-wrap gap-2">
                {AVATAR_OPTIONS.map((av) => (
                  <button
                    key={av}
                    type="button"
                    onClick={() => setAvatarInput(av)}
                    className={`w-9 h-9 rounded-xl text-xl flex items-center justify-center border transition ${
                      avatarInput === av
                        ? 'bg-amber-300 border-amber-500 scale-105 shadow-xs'
                        : 'bg-white hover:bg-amber-100 border-amber-200'
                    }`}
                  >
                    {av}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Jméno profilu
              </label>
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="Např. Eliška_Knihy"
                required
                className="w-full px-3.5 py-2 rounded-xl border border-amber-300 bg-white text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Krátký popis / Bio (dobrovolné)
              </label>
              <input
                type="text"
                value={bioInput}
                onChange={(e) => setBioInput(e.target.value)}
                placeholder="Např. Čtu neraději sci-fi a detektivky"
                className="w-full px-3.5 py-2 rounded-xl border border-amber-300 bg-white text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="px-4 py-2 rounded-xl text-xs text-stone-600 hover:bg-amber-100 transition"
              >
                Zpět
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-500 text-amber-950 font-semibold text-xs shadow-xs transition"
              >
                Vytvořit profil
              </button>
            </div>
          </form>
        )}

        <div className="mt-6 pt-4 border-t border-amber-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs bg-stone-200 hover:bg-stone-300 text-stone-800 font-medium transition cursor-pointer"
          >
            Zavřít
          </button>
        </div>
      </div>
    </div>
  );
}
