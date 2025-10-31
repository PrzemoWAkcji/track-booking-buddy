# 🚀 Quick Start - Wdrożenie Poprawek Bezpieczeństwa

## ⏱️ Szacowany czas: 20 minut

---

## Krok 1: Zabezpiecz Klucze API (5 min) 🔐

### 1.1 Zresetuj klucze w Supabase

```
🌐 Otwórz: https://supabase.com/dashboard/project/iulbvlivqoqruqkyltze/settings/api

📝 Kliknij: "Reset anon key" → Confirm
📋 Skopiuj nowy klucz
```

### 1.2 Zaktualizuj lokalny .env

```bash
# Edytuj plik .env
VITE_SUPABASE_PUBLISHABLE_KEY="WKLEJ_NOWY_KLUCZ_TUTAJ"
```

### 1.3 Usuń .env z historii Git

```powershell
# W PowerShell (w katalogu projektu)
git filter-branch --force --index-filter "git rm --cached --ignore-unmatch .env" --prune-empty --tag-name-filter cat -- --all
```

✅ **Checkpoint:** `.env` nie pokazuje się w `git status`

---

## Krok 2: Utwórz Tabele w Supabase (5 min) 🗄️

### 2.1 Otwórz SQL Editor

```
🌐 https://supabase.com/dashboard/project/iulbvlivqoqruqkyltze/sql/new
```

### 2.2 Skopiuj i wykonaj SQL

```sql
-- Skopiuj CAŁĄ zawartość pliku:
-- supabase/migrations/001_initial_schema.sql

-- Wklej do SQL Editor → Kliknij "Run"
```

### 2.3 Weryfikuj

```
📍 Idź do: Table Editor
👁️ Sprawdź czy widzisz tabele:
   - contractors
   - reservations  
   - weekly_archive
```

✅ **Checkpoint:** Widzisz 3 tabele w Table Editor

---

## Krok 3: Przetestuj Połączenie (2 min) 🔌

```bash
# Uruchom dev server
npm run dev
```

```
🌐 Otwórz: http://localhost:5173/track-booking-buddy/
```

Naciśnij **F12** (DevTools) → Console

Wpisz:

```javascript
// Test połączenia
import { supabase } from './src/integrations/supabase/client';
const { data, error } = await supabase.from('reservations').select('count');
console.log('Połączenie OK:', data, error);
```

✅ **Checkpoint:** Widzisz "Połączenie OK" bez błędów

---

## Krok 4: Migracja Danych (5 min) 📦

### 4.1 Sprawdź localStorage

W Console (F12):

```javascript
// Sprawdź czy są dane do migracji
localStorage.getItem('trackReservations_track-6') !== null
localStorage.getItem('trackReservations_track-8') !== null
localStorage.getItem('trackReservations_rugby') !== null
```

### 4.2 Uruchom migrację

Dla każdego typu który zwrócił `true`:

```javascript
// Dynamiczny import service
const { ReservationService } = await import('./src/services/reservationService.ts');

// Migruj dane
await ReservationService.migrateFromLocalStorage('track-6');
await ReservationService.migrateFromLocalStorage('track-8');
await ReservationService.migrateFromLocalStorage('rugby');
```

### 4.3 Weryfikuj w Supabase

```
🌐 Idź do: Table Editor → reservations
👁️ Sprawdź czy dane są widoczne
🔢 Policz rekordy - czy się zgadza?
```

✅ **Checkpoint:** Dane widoczne w Supabase

---

## Krok 5: Sprawdź Build (3 min) 🏗️

```bash
# Build produkcyjny
npm run build

# Jeśli sukces:
npm run preview
```

```
🌐 Otwórz: http://localhost:4173/track-booking-buddy/
👁️ Sprawdź czy aplikacja działa
```

✅ **Checkpoint:** Build przeszedł bez błędów

---

## ✅ CHECKLIST KOŃCOWY

Sprawdź czy wszystkie punkty są zrobione:

- [ ] Klucze API zresetowane w Supabase
- [ ] `.env` zaktualizowany z nowymi kluczami
- [ ] `.env` usunięty z historii Git
- [ ] SQL schema wykonany (3 tabele utworzone)
- [ ] Połączenie z Supabase działa
- [ ] Dane zmigrowane (jeśli były w localStorage)
- [ ] Dane widoczne w Supabase Dashboard
- [ ] `npm run build` przeszedł
- [ ] Aplikacja działa lokalnie

---

## 🎉 GRATULACJE!

Twoja aplikacja jest teraz bezpieczniejsza:

✅ Klucze nie są w repo  
✅ Dane w chmurze (nie localStorage)  
✅ TypeScript strict mode włączony  
✅ Gotowa struktura do dalszego rozwoju

---

## 🔄 CO DALEJ? (Opcjonalne)

### Następne Priorytety:

1. **Refactor Index.tsx** - Użyj nowego `useReservations` hook
2. **Dodaj Autentykację** - Supabase Auth
3. **Testy** - Vitest + Testing Library
4. **Performance** - useMemo, React.memo
5. **PWA** - Offline support

📄 Zobacz: `PRIORITY_FIXES_COMPLETED.md` dla szczegółów

---

## 🆘 POMOC

### Coś nie działa?

1. **Błąd: "Failed to fetch"**
   → Sprawdź czy klucze w .env są poprawne
   → Sprawdź czy SQL został wykonany

2. **Błąd: "RLS policy violation"**
   → Sprawdź czy policies zostały utworzone (są w SQL)

3. **Błąd: "Network error"**
   → Sprawdź internet
   → Sprawdź czy projekt Supabase jest aktywny

4. **Build fails**
   → `npm install` 
   → Usuń `node_modules` i zainstaluj ponownie

### Dokumenty Pomocnicze:

- 📘 `MIGRATION_GUIDE.md` - Pełny przewodnik migracji
- 🔒 `SECURITY_SETUP.md` - Security best practices  
- ✅ `PRIORITY_FIXES_COMPLETED.md` - Co zostało zrobione

---

**Powodzenia! 🚀**