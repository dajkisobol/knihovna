# Online knihovna (Supabase)

Základní aplikace běží bez serveru a má pouze místní úložiště prohlížeče. Chcete-li skutečné účty a ukládání do cloudu:

1. Založte projekt na https://supabase.com a v SQL Editoru spusťte obsah `supabase/schema.sql`.
2. V nastavení projektu najděte **Project URL** a **anon/publishable key** (nikdy secret/service_role).
3. Do build prostředí GitHub Actions nastavte proměnné **VITE_SUPABASE_URL** a **VITE_SUPABASE_ANON_KEY**, případně pro místní Vite do souboru `.env.local`. Po přidání proměnných je nutný nový build. Pro GitHub Pages build je třeba v deploy workflow tyto proměnné explicitně předat.
4. Supabase Authentication → URL Configuration: přidejte adresu `https://dajkisobol.github.io/knihovna/` do redirect URLs a nastavte Site URL. Povolte Email provider; pro potvrzovací emaily nastavte doručování.
5. Přihlaste se a kliknutím importujte existující místní katalog pouze tehdy, pokud je vzdálený účet zatím prázdný.

**Upozornění:** Aktuální cloudové schéma zpřístupňuje knihy pouze jednomu přihlášenému uživateli. Více knihovníků nemá automaticky sdílenou evidenci. Pro knihovnu potřebujete společný tenant/library_id a role správce. Před ukládáním jmen vypůjčitelů do cloudu nastavte ochranu osobních údajů, retenční dobu, zálohy a přístupy. Nepublikujte skutečná čtenářská data do GitHub repozitáře.

Databáze knih (databazeknih.cz) nemá v této implementaci doložené veřejné API pro automatický import. Aplikace proto nabízí hledání na jejich webu v nové záložce, ale knižní metadata načítá z již používaných katalogových zdrojů.
