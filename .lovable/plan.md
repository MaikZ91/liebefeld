

# Download-Button auf Community Page + Notification-Klingel im Chat

## Übersicht

Zwei Änderungen:

1. **Community Board** (`TribeCommunityBoard.tsx`): Einen Download-Button/Bereich hinzufügen, der Android (Play Store Link) und iOS (Home-Bildschirm Anleitung) als Optionen anbietet. Nutzt die bestehende PWA-Install-Logik aus `usePWAInstall` für direkte Installation wo möglich.

2. **Chat MessageInput** (`chat/MessageInput.tsx`): Neben dem Bild-Upload-Button einen Klingel-Button (Bell-Icon) hinzufügen, der `handleEnablePushNotifications` aufruft (Funktion existiert bereits im Code, wird nur nicht in der UI genutzt).

## Technische Details

### Schritt 1: Notification-Bell im Chat-Input

In `src/components/chat/MessageInput.tsx`:
- Neben dem Image-Button (Zeile 268-291) einen zweiten Button mit `Bell`-Icon einfügen
- Klick ruft die bereits existierende `handleEnablePushNotifications()` Funktion auf (Zeile 190)
- Gleicher Style wie der Image-Button (rund, border, glow)
- Nur im `community` Mode anzeigen

### Schritt 2: Download-Bereich auf Community Board

In `src/components/tribe/TribeCommunityBoard.tsx`:
- Einen kompakten Download-Banner/Card im oberen Bereich der Community Page einfügen
- Zwei Buttons: "Android" (Link zum Play Store) und "iOS" (Sheet/Dialog mit Home-Bildschirm Anleitung)
- PWA-Install als dritte Option wenn verfügbar (`usePWAInstall`)
- Styling passend zum Tribe Design (dark, gold accents)
- Dismissible (localStorage Key speichern)

