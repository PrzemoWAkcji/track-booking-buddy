# 🚀 Migration Guide: localStorage → Supabase

## Przegląd

Ta aplikacja została zaktualizowana z przechowywania danych w **localStorage** (przeglądarki) na **Supabase** (chmurę). To zapewnia:

✅ **Bezpieczeństwo** - dane w chronionym datacenter  
✅ **Trwałość** - nie znikają przy wyczyszczeniu cache  
✅ **Synchronizacja** - dostęp z różnych urządzeń  
✅ **Backup** - automatyczne kopie zapasowe  
✅ **Współdzielenie** - wielu użytkowników może pracować na tych samych danych

---

## Krok 1: Setup Supabase Database

### 1.1 Zaloguj się do Supabase

Idź do: https://supabase.com/dashboard/project/iulbvlivqoqruqkyltze

### 1.2 Wykonaj SQL Schema

1. W dashboardzie wybierz **SQL Editor**
2. Kliknij **New Query**
3. Skopiuj zawartość pliku: `supabase/migrations/001_initial_schema.sql`
4. Wklej do edytora i kliknij **Run**
5. Sprawdź czy pokazało się: ✅ Success

### 1.3 Weryfikacja

Sprawdź czy tabele zostały utworzone:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';
```

Powinny być 3 tabele:
- `contractors`
- `reservations`
- `weekly_archive`

---

## Krok 2: Rotacja Kluczy (KRYTYCZNE!)

⚠️ **WAŻNE:** Twoje klucze były w repo, więc mogły być skompromitowane!

### 2.1 Reset kluczy

1. Idź do: https://supabase.com/dashboard/project/iulbvlivqoqruqkyltze/settings/api
2. W sekcji **Project API keys** kliknij:
   - **Reset "anon" key** → Confirm
3. Skopiuj **NOWY** `anon public` key

### 2.2 Zaktualizuj .env

```bash
# Edytuj .env
VITE_SUPABASE_PUBLISHABLE_KEY="NOWY_KLUCZ_TUTAJ"
```

### 2.3 Usuń .env z historii Git

```powershell
# UWAGA: To przepisze historię Git!
git filter-branch --force --index-filter "git rm --cached --ignore-unmatch .env" --prune-empty --tag-name-filter cat -- --all

# Force push (jeśli repo jest zdalne)
git push origin --force --all
```

---

## Krok 3: Instalacja Dependencies

```bash
npm install
```

---

## Krok 4: Migracja Danych

### 4.1 Automatyczna migracja (przez UI)

1. Uruchom aplikację:
   ```bash
   npm run dev
   ```

2. Otwórz w przeglądarce: http://localhost:5173/track-booking-buddy/

3. Dla każdego typu obiektu (Bieżnia 6-torowa, 8-torowa, Rugby):
   - Otwórz zakładkę
   - **Naciśnij F12** (DevTools)
   - W Console wpisz:
     ```javascript
     // Dla aktualnie wybranego typu obiektu
     window.__migrateReservations()
     ```
   
4. Sprawdź czy widzisz komunikat: "Przeniesiono X rezerwacji do chmury"

### 4.2 Manualna migracja (przez kod)

Jeśli automatyczna migracja nie działa, możesz uruchomić w console:

```javascript
// Import service
const { ReservationService } = await import('./src/services/reservationService.ts');

// Migracja dla każdego typu
await ReservationService.migrateFromLocalStorage('track-6');
await ReservationService.migrateFromLocalStorage('track-8');
await ReservationService.migrateFromLocalStorage('rugby');
```

### 4.3 Weryfikacja

Sprawdź w Supabase Dashboard → Table Editor → `reservations`:
- Czy dane są widoczne?
- Czy liczba rekordów się zgadza?

---

## Krok 5: Wyczyszczenie localStorage (Opcjonalne)

Po pomyślnej migracji możesz wyczyścić stare dane:

```javascript
// W DevTools Console
localStorage.removeItem('trackReservations_track-6');
localStorage.removeItem('trackReservations_track-8');
localStorage.removeItem('trackReservations_rugby');
localStorage.removeItem('contractors');
localStorage.removeItem('weeklyArchive');

console.log('localStorage wyczyszczony ✅');
```

⚠️ **UWAGA:** Zrób to TYLKO po zweryfikowaniu, że dane są w Supabase!

---

## Krok 6: Build & Deploy

```bash
# Build produkcyjny
npm run build

# Test build
npm run preview
```

---

## Troubleshooting

### Problem: "Failed to fetch reservations"

**Rozwiązanie:**
1. Sprawdź czy .env ma poprawne klucze
2. Sprawdź czy tabele istnieją w Supabase
3. Sprawdź konsole przeglądarki (F12) dla szczegółów błędu

### Problem: "RLS policy violation"

**Rozwiązanie:**
Sprawdź czy RLS policies zostały utworzone (są w migration SQL).

### Problem: "Duplicate key value violates unique constraint"

**Rozwiązanie:**
Dane już zostały zmigrowane. Sprawdź Supabase → Table Editor.

### Problem: "Network error"

**Rozwiązanie:**
1. Sprawdź internet
2. Sprawdź czy VITE_SUPABASE_URL jest poprawny
3. Sprawdź czy projekt Supabase jest aktywny (nie zapauzowany)

---

## Rollback (Cofnięcie migracji)

Jeśli coś pójdzie nie tak:

1. **Przywróć stary kod:**
   ```bash
   git checkout HEAD~1 src/pages/Index.tsx
   ```

2. **Dane są bezpieczne:**
   - W Supabase: tabela `reservations`
   - W localStorage: jeśli nie wyczyszczono

---

## Post-Migration Checklist

- [ ] SQL schema wykonany w Supabase
- [ ] Klucze API zrotowane
- [ ] .env usunięty z historii Git
- [ ] Dane zmigrowane do Supabase
- [ ] Aplikacja działa w trybie dev
- [ ] Aplikacja działa w trybie produkcji (build)
- [ ] localStorage wyczyszczony (opcjonalne)
- [ ] Dokumentacja zaktualizowana

---

## Następne Kroki (Opcjonalne)

1. **Autentykacja** - dodaj logowanie użytkowników
2. **RLS Policies** - ogranicz dostęp do zalogowanych
3. **Real-time** - synchronizacja w czasie rzeczywistym
4. **Backup** - automatyczne backupy bazy danych

---

Potrzebujesz pomocy? Sprawdź:
- 📚 [Supabase Docs](https://supabase.com/docs)
- 🐛 [GitHub Issues](https://github.com/twoj-repo/issues)