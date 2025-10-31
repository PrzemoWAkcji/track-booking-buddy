# 🔐 Security Setup Guide

## ⚠️ UWAGA: Jeśli .env był kiedyś w repo - NATYCHMIAST rotuj klucze!

### Krok 1: Sprawdź historię Git

```powershell
git log --all --full-history -- .env
```

Jeśli widzisz commity - **klucze są skompromitowane!**

### Krok 2: Usuń .env z historii Git (jeśli był commitowany)

```powershell
# UWAGA: To przepisze historię Git!
git filter-branch --force --index-filter "git rm --cached --ignore-unmatch .env" --prune-empty --tag-name-filter cat -- --all

# Wymuś push (UWAGA: wymaga force push!)
git push origin --force --all
```

### Krok 3: Rotuj klucze Supabase

1. Idź do: https://supabase.com/dashboard/project/iulbvlivqoqruqkyltze/settings/api
2. **Settings → API → Reset "anon public" key**
3. Skopiuj nowy klucz
4. Zaktualizuj `.env` z nowymi kluczami

### Krok 4: Skonfiguruj Row Level Security (RLS)

W Supabase SQL Editor wykonaj:

```sql
-- Enable RLS on all tables
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE contractors ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_archive ENABLE ROW LEVEL SECURITY;

-- Policy: tylko zalogowani użytkownicy mogą czytać
CREATE POLICY "Enable read for authenticated users only" ON reservations
  FOR SELECT USING (auth.role() = 'authenticated');

-- Policy: tylko zalogowani użytkownicy mogą wstawiać
CREATE POLICY "Enable insert for authenticated users only" ON reservations
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Policy: tylko zalogowani użytkownicy mogą aktualizować
CREATE POLICY "Enable update for authenticated users only" ON reservations
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Policy: tylko zalogowani użytkownicy mogą usuwać
CREATE POLICY "Enable delete for authenticated users only" ON reservations
  FOR DELETE USING (auth.role() = 'authenticated');
```

### Krok 5: Lokalne środowisko

```powershell
# Skopiuj template
Copy-Item .env.example .env

# Edytuj .env i wstaw NOWE klucze
notepad .env
```

### Krok 6: Weryfikacja

```powershell
# Upewnij się, że .env NIE jest trackowany
git status

# Powinno pokazać tylko:
# - .env.example (nowy plik)
# - SECURITY_SETUP.md (nowy plik)
```

---

## 🔒 Best Practices

1. **NIGDY** nie commituj `.env`
2. **ZAWSZE** używaj `.env.example` jako template
3. **Rotuj klucze** co 90 dni
4. **Włącz RLS** w Supabase dla wszystkich tabel
5. **Używaj** environment variables w CI/CD (GitHub Secrets)

---

## 📋 Checklist

- [ ] Sprawdzono historię Git
- [ ] Usunięto .env z historii (jeśli był)
- [ ] Rotowano klucze w Supabase
- [ ] Włączono RLS na wszystkich tabelach
- [ ] Zaktualizowano lokalny .env
- [ ] Zweryfikowano git status