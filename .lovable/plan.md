

## Analyse

Ja, das ist genau die PWA-Installations-Funktion. Der Browser erkennt, dass deine App ein gültiges `manifest.json` hat und bietet die native "App installieren"-Leiste an. Das nennt sich `beforeinstallprompt`-Event.

Deine App hat bereits:
- Ein `manifest.json` mit allen nötigen Feldern
- Einen Service Worker (`sw.js`)
- Die richtigen Meta-Tags in `index.html`

Was fehlt: Du fängst das `beforeinstallprompt`-Event nicht ab und nutzt es nicht aktiv. Der Browser zeigt es manchmal automatisch, aber du kannst es kontrolliert einsetzen.

## Plan

### 1. PWA Install Hook erstellen (`src/hooks/usePWAInstall.ts`)
- Neuer Hook der das `beforeinstallprompt`-Event abfängt und speichert
- Exportiert `canInstall` (boolean), `installApp()` (Funktion) und `isInstalled` (boolean)
- Prüft ob die App bereits im Standalone-Modus läuft

### 2. `AppDownloadPrompt.tsx` erweitern
- Statt nur auf Android den Play Store zu verlinken, zuerst prüfen ob die native PWA-Installation möglich ist
- Wenn `beforeinstallprompt` verfügbar: direkten "Installieren"-Button anzeigen (für Android UND Desktop)
- Fallback auf Play Store Link wenn das Event nicht verfügbar ist
- iOS behält die manuelle Anleitung (Safari unterstützt `beforeinstallprompt` nicht)

### 3. Optionaler Install-Button im Profil/Settings
- Kleinen "App installieren"-Hinweis im Profil-Bereich anzeigen wenn `canInstall === true`
- Verschwindet automatisch wenn die App bereits installiert ist

### Technische Details
- Das `beforeinstallprompt`-Event wird vom Browser nur gefeuert wenn bestimmte Kriterien erfüllt sind (manifest.json, service worker, HTTPS)
- Auf iOS/Safari gibt es kein `beforeinstallprompt` -- dort bleibt die manuelle "Zum Home-Bildschirm"-Anleitung
- Der bestehende Service Worker `sw.js` wird manuell registriert (nicht via vite-plugin-pwa), was ausreicht
- Service Worker Registration muss in `main.tsx` oder `index.html` hinzugefügt werden falls noch nicht vorhanden

