

## Analyse

1. **Edge Function `post-saturday-kennenlernabend`** existiert als Code, aber:
   - Keine Einträge in `cron.job` dafür (kein Cron-Job erstellt)
   - Nicht in `supabase/config.toml` registriert (kein `verify_jwt = false`)
   - Keine Logs vorhanden (wurde nie aufgerufen)

2. Die Mittwochs-Umfrage (`post-weekly-meetup-message`) läuft korrekt per Cron (`0 8 * * 3` = Mi 8 Uhr UTC), aber das Samstags-Followup wurde nie automatisiert.

## Plan

### 1. `config.toml` erweitern
- `[functions.post-saturday-kennenlernabend]` mit `verify_jwt = false` hinzufugen

### 2. Cron-Job erstellen via SQL
- Schedule: `0 9 * * 6` (Samstag 9:00 UTC)
- Ruft `post-saturday-kennenlernabend` auf
- Nutzt den bestehenden Anon-Key fur die Authorization

### 3. Funktion manuell testen
- Einmal manuell auslosen um den heutigen Post nachzuholen

