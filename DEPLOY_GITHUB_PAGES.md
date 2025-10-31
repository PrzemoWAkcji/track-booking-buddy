# Wdrożenie na GitHub Pages

## Kroki:

### 1. Załóż konto na GitHub (jeśli nie masz)
- Wejdź na [github.com](https://github.com)
- Zarejestruj się

### 2. Utwórz nowe repozytorium
- Kliknij `+` → `New repository`
- Nazwa: `track-booking-buddy`
- Pozostaw public
- Nie inicjalizuj README
- Kliknij `Create repository`

### 3. Wgraj kod do GitHub (z poziomu folderu projektu)

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/track-booking-buddy.git
git push -u origin main
```

Zamiast `YOUR_USERNAME` wstaw swoją nazwę użytkownika GitHub.

### 4. Wdróż na GitHub Pages

```bash
npm run deploy
```

To automatycznie:
- Zbuduje aplikację
- Wyśle na gałąź `gh-pages`
- Opublikuje na GitHub Pages

### 5. Włącz GitHub Pages w repozytorium

- Wejdź w **Settings** → **Pages**
- Source: wybierz `gh-pages`
- Root folder: `/root`
- Kliknij Save

### 6. Czekaj 2-3 minuty

Aplikacja będzie dostępna na:
```
https://YOUR_USERNAME.github.io/track-booking-buddy
```

---

## Aktualizacje

Każdorazowo gdy zmienisz kod:

```bash
git add .
git commit -m "Opisz zmianę"
git push
npm run deploy
```

---

## ⚙️ Konfiguracja Supabase

**WAŻNE:** Aplikacja wymaga zmiennych środowiskowych Supabase!

Przed deployment upewnij się, że masz plik `.env` z:

```env
VITE_SUPABASE_URL=https://qebyyjwwkjkhpfeufyor.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=twój-klucz-publiczny
VITE_SUPABASE_PROJECT_ID=qebyyjwwkjkhpfeufyor
```

⚠️ **Zmienne środowiskowe są wbudowywane podczas budowania!**
- `npm run build` wczytuje `.env` i wstawia wartości do kodu
- Build zawiera twoje klucze (publiczne), więc są dostępne w aplikacji

---

## 📝 Notatka

✅ **Dane w chmurze (Supabase)**:
- Rezerwacje przechowywane w bazie danych PostgreSQL
- Archiwum tygodniowe w tabeli `weekly_archive`
- Dane synchronizowane między urządzeniami
- Współdzielone dla wszystkich użytkowników

✅ **Funkcje offline**:
- PDF export pobierany na komputer użytkownika
- Excel export lokalnie generowany

🔒 **Bezpieczeństwo**:
- Row Level Security (RLS) w Supabase
- Klucz publiczny (Anon Key) można bezpiecznie udostępniać
- API zabezpieczone politykami Supabase

Gotowe! 🚀
