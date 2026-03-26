

# Push-Benachrichtigungen & PWA-Install reparieren

## Probleme

Es gibt zwei zusammenhaengende Probleme:

1. **Service Worker wird im Lovable-Preview/Iframe registriert** -- `main.tsx` registriert den SW bedingungslos. Im Preview-Iframe verursacht das Konflikte: der SW cached Inhalte falsch und blockiert die korrekte FCM-Initialisierung. Das kann auch dazu fuehren, dass die Play Store-App (die intern einen WebView nutzt) einen kaputten SW-State hat.

2. **Notification-Permission wird nicht explizit VOR `getToken()` angefragt** -- Firebase's `getToken()` sollte die Permission automatisch anfragen, tut es aber in manchen Kontexten (installed PWA, WebView) nicht zuverlaessig. Die Permission muss explizit vorher per `Notification.requestPermission()` angefragt werden.

3. **PWA-Install-Prompt erscheint nicht** -- Weil der SW im Preview-Iframe registriert wird und dort cached, kann der Browser die PWA-Kriterien nicht sauber pruefen. Ausserdem fehlt ein Guard gegen Iframe/Preview-Registrierung.

## Plan

### Schritt 1: Service Worker Registration absichern (main.tsx)

Guard hinzufuegen, der verhindert dass der SW in Lovable-Preview-Iframes oder auf Preview-Domains registriert wird. Bestehende fehlerhafte SW-Registrierungen in diesen Kontexten werden automatisch deregistriert.

```typescript
// Nur in Production/echtem Browser registrieren, NICHT im Lovable-Preview
const isInIframe = (() => {
  try { return window.self !== window.top; } catch { return true; }
})();
const isPreviewHost = window.location.hostname.includes('id-preview--') 
  || window.location.hostname.includes('lovableproject.com');

if (isPreviewHost || isInIframe) {
  navigator.serviceWorker?.getRegistrations().then(regs => 
    regs.forEach(r => r.unregister())
  );
} else if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}
```

### Schritt 2: Notification-Permission explizit anfragen (firebaseMessaging.ts)

Vor dem `getToken()`-Aufruf explizit `Notification.requestPermission()` aufrufen. Das stellt sicher, dass der Browser-Dialog auch in PWA/WebView-Kontexten erscheint.

```typescript
// VOR getToken():
const permission = await Notification.requestPermission();
if (permission !== 'granted') {
  console.warn('Notification permission not granted:', permission);
  return null;
}
// Dann erst getToken()...
```

### Schritt 3: SW-Registrierung in firebaseMessaging.ts absichern

Auch in `initializeFCM` den gleichen Guard einbauen -- wenn wir im Preview sind, FCM ueberspringen.

## Erwartetes Ergebnis

- Im Lovable-Preview wird kein SW registriert (keine Cache-Probleme mehr)
- Auf der echten Domain / in der installierten PWA wird der Notification-Permission-Dialog korrekt angezeigt
- FCM-Tokens werden nach Permission-Erteilung gespeichert
- Der PWA-Install-Prompt funktioniert wieder korrekt auf der echten Domain

